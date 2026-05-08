/**
 * SupabaseService - Service unifié pour les requêtes Supabase
 *
 * Fonctionnalités:
 * - Retry automatique avec backoff exponentiel pour les erreurs 429 (rate limit)
 * - Gestion centralisée des erreurs
 * - Wrapper pour les requêtes avec .is() pour les valeurs null
 * - Logging et debugging
 */

import { supabase } from "./supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logFoncierAudit } from "./foncierAudit";

/**
 * Vérifie si une erreur est liée au rate limiting
 */
const isRateLimitError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const status = (error as { status?: number }).status;
  const message = (error as { message?: string }).message || "";
  return status === 429 || /rate limit|too many requests/i.test(message);
};

let attestationHasDeletedAt: boolean | null = null;
const isMissingColumnError = (error: unknown, column: string): boolean => {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string }).code || "";
  const message = (error as { message?: string }).message || "";
  return (
    code === "42703" || message.includes(`column "${column}" does not exist`)
  );
};

/**
 * Exécute une fonction avec retry et backoff exponentiel
 * @param fn - Fonction à exécuter
 * @param retries - Nombre de tentatives restantes
 * @param baseMs - Délai de base en millisecondes
 */
const withBackoff = async <T extends { error?: any }>(
  fn: () => PromiseLike<T>,
  retries = 3,
  baseMs = 500,
): Promise<T> => {
  let attempt = 0;
  while (true) {
    try {
      const result = await fn();
      if (
        !result?.error ||
        !isRateLimitError(result.error) ||
        attempt >= retries
      ) {
        return result;
      }
    } catch (error) {
      if (!isRateLimitError(error) || attempt >= retries) {
        throw error;
      }
    }
    // Backoff exponentiel: 500ms, 1000ms, 2000ms, ...
    await new Promise((resolve) => setTimeout(resolve, baseMs * 2 ** attempt));
    attempt += 1;
  }
};

/**
 * Classe de service pour les opérations Supabase
 */
export class SupabaseService {
  private client: SupabaseClient;
  private defaultRetries = 3;

  constructor(client: SupabaseClient = supabase) {
    this.client = client;
  }

  /**
   * Exécute une requête Supabase avec retry automatique
   */
  async queryWithRetry<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    retries = this.defaultRetries,
  ): Promise<{ data: T | null; error: string | null }> {
    try {
      const result = await withBackoff(queryFn, retries);
      return {
        data: result.data as T | null,
        error: result.error?.message || null,
      };
    } catch (error) {
      if (import.meta.env.DEV)
        console.error("SupabaseService: queryWithRetry error", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Obtient la prochaine version d'une attestation pour un lot donné
   * Utilise .is() pour la gestion correcte des valeurs null
   */
  async getNextAttestationVersion(lotId: string): Promise<number> {
    const runQuery = async (includeDeletedAt: boolean) =>
      withBackoff(() => {
        let query = this.client
          .from("foncier_attestations")
          .select("version")
          .eq("lot_id", lotId);
        if (includeDeletedAt) {
          query = query.is("deleted_at", null); // ✅ Utiliser .is() pour null, pas .eq()
        }
        return query.order("version", { ascending: false }).limit(1);
      });

    try {
      const includeDeletedAt = attestationHasDeletedAt !== false;
      let { data, error } = await runQuery(includeDeletedAt);

      if (error && isMissingColumnError(error, "deleted_at")) {
        attestationHasDeletedAt = false;
        ({ data, error } = await runQuery(false));
      } else if (
        !error &&
        includeDeletedAt &&
        attestationHasDeletedAt === null
      ) {
        attestationHasDeletedAt = true;
      }

      if (error) {
        if (import.meta.env.DEV)
          console.error("getNextAttestationVersion: erreur", error);
        return 1; // Fallback sécurisé
      }

      const maxVersion = data?.[0]?.version || 0;
      return Number(maxVersion) + 1;
    } catch (error) {
      if (import.meta.env.DEV)
        console.error("getNextAttestationVersion: erreur", error);
      return 1; // Fallback sécurisé
    }
  }

  /**
   * Récupère les attestations avec filtres
   * Gère automatiquement les filtres null avec .is()
   */
  async getAttestations(
    filters: {
      lot_id?: string;
      deleted_at?: null;
      [key: string]: any;
    } = {},
  ) {
    const buildQuery = (includeDeletedAt: boolean) => {
      let query = this.client.from("foncier_attestations").select("*");

      // Appliquer les filtres de manière sécurisée
      Object.entries(filters).forEach(([key, value]) => {
        if (key === "deleted_at" && value === null) {
          if (includeDeletedAt) {
            query = query.is("deleted_at", null);
          }
          return;
        }
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      return query;
    };

    try {
      const includeDeletedAt = attestationHasDeletedAt !== false;
      let result = await withBackoff(() => buildQuery(includeDeletedAt));

      if (result.error && isMissingColumnError(result.error, "deleted_at")) {
        attestationHasDeletedAt = false;
        result = await withBackoff(() => buildQuery(false));
      } else if (
        !result.error &&
        includeDeletedAt &&
        attestationHasDeletedAt === null
      ) {
        attestationHasDeletedAt = true;
      }

      return {
        data: result.data as any,
        error: result.error?.message || null,
      };
    } catch (error) {
      if (import.meta.env.DEV) console.error("getAttestations: erreur", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Récupère un lot foncier par ID
   */
  async getLotById(lotId: string) {
    return this.queryWithRetry(async () =>
      this.client
        .from("foncier_lots")
        .select("*")
        .eq("id", lotId)
        .is("deleted_at", null)
        .maybeSingle(),
    );
  }

  /**
   * Vérifie les doublons de lots fonciers
   */
  async checkLotDuplicate(params: {
    village: string;
    lotissement: string;
    ilot: string;
    lot: string;
    exclude_lot_id?: string | null;
  }) {
    return this.queryWithRetry(async () =>
      this.client.rpc("check_foncier_duplicate", {
        p_village: params.village,
        p_lotissement: params.lotissement,
        p_ilot: params.ilot,
        p_lot: params.lot,
        p_exclude_lot_id: params.exclude_lot_id || null,
      }),
    );
  }

  /**
   * Recherche des lots fonciers avec pagination
   */
  async searchLots(params: {
    search: string;
    village: string;
    quartier: string;
    lotissement: string;
    statut: string;
    sort: string;
    dir: "asc" | "desc";
    page: number;
    limit: number;
    include_archived: boolean;
  }) {
    return this.queryWithRetry(async () =>
      this.client.rpc("search_foncier_lots", {
        p_search: params.search,
        p_village: params.village,
        p_quartier: params.quartier,
        p_lotissement: params.lotissement,
        p_statut: params.statut,
        p_sort: params.sort,
        p_dir: params.dir,
        p_page: params.page,
        p_limit: params.limit,
        p_include_archived: params.include_archived,
      }),
    );
  }

  /**
   * Obtient les statistiques par village
   */
  async getVillageStats(includeArchived: boolean = false) {
    return this.queryWithRetry(async () =>
      this.client.rpc("foncier_stats_by_village", {
        p_include_archived: includeArchived,
      }),
    );
  }

  /**
   * Charge les villages depuis la base de données
   */
  async getVillages() {
    return this.queryWithRetry(async () =>
      this.client
        .from("foncier_villages")
        .select("name")
        .order("name", { ascending: true }),
    );
  }

  /**
   * Soft delete d'un lot foncier
   */
  async softDeleteLot(lotId: string, reason: string = "archivage") {
    return this.queryWithRetry(async () =>
      this.client.rpc("soft_delete_foncier_lot", {
        p_lot_id: lotId,
        p_reason: reason,
      }),
    );
  }

  /**
   * Restaure un lot foncier archivé
   */
  async restoreLot(lotId: string) {
    return this.queryWithRetry(async () =>
      this.client.rpc("restore_foncier_lot", { p_lot_id: lotId }),
    );
  }

  /**
   * Crée la hiérarchie foncière (village → lotissement → îlot)
   */
  async ensureHierarchy(params: {
    village: string;
    lotissement: string;
    ilot: string;
  }) {
    return this.queryWithRetry(async () =>
      this.client.rpc("ensure_foncier_hierarchy", {
        p_village: params.village,
        p_lotissement: params.lotissement,
        p_ilot: params.ilot,
      }),
    );
  }

  /**
   * Journalise un audit foncier
   */
  async logAudit(payload: {
    parcelle_id?: string | null;
    action: string;
    details?: Record<string, any> | null;
  }) {
    const lotId = payload.parcelle_id || "";
    if (!lotId) {
      return {
        data: null,
        error: "parcelle_id manquant pour la journalisation foncière",
      };
    }

    return this.queryWithRetry(async () =>
      logFoncierAudit(this.client as any, {
        lotId,
        action: payload.action,
        details: payload.details || null,
      }),
    );
  }
}

// Export d'une instance singleton pour utilisation directe
export const supabaseService = new SupabaseService();

// Export des utilitaires pour usage direct
export { withBackoff, isRateLimitError };

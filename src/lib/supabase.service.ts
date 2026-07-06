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
import type { FoncierLot } from "../types";
import { logFoncierAudit } from "./foncierAudit";
import {
  FONCIER_ATTESTATION_SELECT,
  FONCIER_ATTESTATION_WITH_TEMOINS_SELECT,
  FONCIER_LOT_SELECT,
} from "./foncierAttestation";

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
  private client: any; // Proxy adapter compatible with Supabase client
  private defaultRetries = 3;

  // Cache pour les données fréquemment utilisées
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(client: any = supabase) {
    this.client = client;
  }

  /**
   * Récupère des données du cache si elles sont valides
   */
  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * Stocke des données en cache
   */
  private setCachedData(key: string, data: any, ttl: number = this.CACHE_TTL): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  /**
   * Invalide le cache pour une clé spécifique ou toutes les clés
   */
  invalidateCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Exécute une requête Supabase avec retry automatique
   */
  async queryWithRetry<T>(
    queryFn: () => Promise<{ data: T | null; error: any; count?: number | null }>,
    retries = this.defaultRetries,
  ): Promise<{ data: T | null; error: string | null; count: number | null }> {
    try {
      const result = await withBackoff(queryFn, retries);
      return {
        data: result.data as T | null,
        error: result.error?.message || null,
        count: result.count ?? null,
      };
    } catch (error) {
      if (import.meta.env.DEV)
        console.error("SupabaseService: queryWithRetry error", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Erreur inconnue",
        count: null,
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
      let query = this.client
        .from("foncier_attestations")
        .select(FONCIER_ATTESTATION_SELECT);

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
        .select(FONCIER_LOT_SELECT)
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
   * Obtient les statistiques par village (avec cache)
   */
  async getVillageStats(includeArchived: boolean = false) {
    const cacheKey = `village_stats_${includeArchived}`;

    // Vérifier le cache d'abord
    const cachedData = this.getCachedData(cacheKey);
    if (cachedData) {
      return { data: cachedData, error: null };
    }

    const result = await this.queryWithRetry(async () =>
      this.client.rpc("foncier_stats_by_village", {
        p_include_archived: includeArchived,
      }),
    );

    if (result.data) {
      // Mettre en cache pour 2 minutes (statistiques changent fréquemment)
      this.setCachedData(cacheKey, result.data, 2 * 60 * 1000);
    }

    return result;
  }

  /**
   * Charge les villages depuis la base de données (avec cache)
   */
  async getVillages(): Promise<{ data: string[] | null; error: string | null }> {
    const cacheKey = "villages";

    // Vérifier le cache d'abord
    const cachedData = this.getCachedData(cacheKey);
    if (cachedData) {
      return { data: cachedData, error: null };
    }

    const result = await this.queryWithRetry(async () =>
      this.client
        .from("foncier_villages")
        .select("nom")
        .order("nom", { ascending: true }),
    );

    if (result.data) {
      const villageNames = result.data.map((row: { nom: string }) => row.nom);
      // Mettre en cache pour 10 minutes (villages changent rarement)
      this.setCachedData(cacheKey, villageNames, 10 * 60 * 1000);
      return { data: villageNames, error: null };
    }

    return { data: null, error: result.error ?? null };
  }

  /**
   * Soft delete d'un lot foncier
   */
  async softDeleteLot(lotId: string, _reason: string = "archivage") {
    const result = await this.queryWithRetry(async () =>
      this.client.rpc("soft_delete_foncier_lot", {
        p_lot_id: lotId,
      }),
    );

    // Invalider le cache des statistiques
    if (result.data) {
      this.invalidateCache("village_stats_true");
      this.invalidateCache("village_stats_false");
    }

    return result;
  }

  /**
   * Restaure un lot foncier archivé
   */
  async restoreLot(lotId: string) {
    const result = await this.queryWithRetry(async () =>
      this.client.rpc("restore_foncier_lot", { p_lot_id: lotId }),
    );

    // Invalider le cache des statistiques
    if (result.data) {
      this.invalidateCache("village_stats_true");
      this.invalidateCache("village_stats_false");
    }

    return result;
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

  /**
   * Récupère les données d'audit foncier avec pagination et filtres
   */
  async getAudit(params: {
    page: number;
    pageSize: number;
    actionFilter?: string;
  }) {
    return this.queryWithRetry(async () => {
      const from = (params.page - 1) * params.pageSize;
      const to = from + params.pageSize - 1;

      let query = this.client
        .from("foncier_audit")
        .select(
          "id, lot_id, action, performed_by, performed_at, old_values, new_values, foncier_lots:lot_id(reference, numero_lot, village)",
          { count: "exact" },
        )
        .order("performed_at", { ascending: false })
        .range(from, to);

      if (params.actionFilter) {
        query = query.eq("action", params.actionFilter);
      }

      return query;
    });
  }

  /**
   * Récupère les profils utilisateurs par IDs
   */
  async getUserProfiles(userIds: string[]) {
    if (userIds.length === 0) {
      return { data: {}, error: null };
    }

    return this.queryWithRetry(async () =>
      this.client
        .from("user_profiles")
        .select("id, full_name")
        .in("id", userIds),
    );
  }

  /**
   * Vérifie si une référence de lot existe déjà
   */
  async checkLotReferenceExists(reference: string, excludeLotId?: string) {
    return this.queryWithRetry(async () => {
      let query = this.client
        .from("foncier_lots")
        .select("id")
        .eq("reference", reference);

      if (excludeLotId) {
        query = query.neq("id", excludeLotId);
      }

      return query.maybeSingle();
    });
  }

  /**
   * Sauvegarde un lot foncier (insertion ou mise à jour)
   */
  async saveLot(lotData: Partial<FoncierLot>, isUpdate: boolean = false) {
    const result = await this.queryWithRetry(async () => {
      if (isUpdate) {
        return this.client
          .from("foncier_lots")
          .update(lotData)
          .eq("id", lotData.id!)
          .eq("row_version", lotData.row_version ?? 1)
          .select(FONCIER_LOT_SELECT)
          .single();
      } else {
        return this.client
          .from("foncier_lots")
          .insert(lotData)
          .select(FONCIER_LOT_SELECT)
          .single();
      }
    });

    // Invalider le cache des statistiques si la sauvegarde réussit
    if (result.data) {
      this.invalidateCache("village_stats_true");
      this.invalidateCache("village_stats_false");
    }

    return result;
  }

  /**
   * Récupère la dernière attestation pour un lot
   */
  async getLatestAttestationForLot(
    lotId: string,
    includeArchived: boolean = false,
    select: string = FONCIER_ATTESTATION_WITH_TEMOINS_SELECT
  ) {
    return this.queryWithRetry(async () => {
      let query = this.client
        .from("foncier_attestations")
        .select(select)
        .eq("lot_id", lotId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!includeArchived) {
        query = query.is("deleted_at", null);
      }

      return query.maybeSingle();
    });
  }

  /**
   * Crée une attestation atomique
   */
  async createAttestationAtomic(attestationPayload: any) {
    return this.queryWithRetry(async () =>
      this.client.rpc("create_foncier_attestation_atomic", attestationPayload),
    );
  }

  /**
   * Attache les métadonnées PDF à une attestation
   */
  async attachAttestationPdfMetadata(params: {
    attestation_id: string;
    hash_sha256?: string | null;
    verify_url?: string | null;
    pdf_path?: string | null;
    pdf_generated_at?: string | null;
    printed_by?: string | null;
  }) {
    return this.queryWithRetry(async () =>
      this.client.rpc("attach_foncier_attestation_pdf_metadata", params),
    );
  }

  /**
   * Signe une attestation via Edge Function
   */
  async signAttestation(attestationId: string, payload: Record<string, unknown>) {
    try {
      const result = await this.client.functions.invoke("attestation-sign", {
        body: {
          attestation_id: attestationId,
          payload: JSON.stringify(payload),
        },
      });

      if (result.error) {
        return { data: null, error: result.error.message };
      }

      return {
        data: (result.data as { signature?: string })?.signature || "",
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Erreur de signature",
      };
    }
  }
}

// Export d'une instance singleton pour utilisation directe
export const supabaseService = new SupabaseService();

// Export des utilitaires pour usage direct
export { withBackoff, isRateLimitError };

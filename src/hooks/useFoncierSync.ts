import { useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { FoncierLot } from "../types";
import type { AuditRecord, AuditQueryRow } from "../components/foncier/FoncierConstants";
import { sleep, isRateLimitError } from "../components/foncier/FoncierConstants";
import {
  getCachedLots,
  countQueueItems,
  upsertCachedLots,
  upsertCachedLot,
  addQueueItem,
  removeQueueItem,
  getDeviceId,
} from "../lib/foncierOffline";
import { generateUUID } from "../utils/reference";

/**
 * Utilitaire retry avec backoff exponentiel
 */
export const withBackoff = async <
  T extends { data: any; error?: any; count?: number },
>(
  fn: () => PromiseLike<T> | any,
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
    await sleep(baseMs * 2 ** attempt);
    attempt += 1;
  }
};

/**
 * Hook centralisé pour la synchronisation et le fetch de données foncier
 */
export function useFoncierSync() {
  const deviceId = getDeviceId();

  // ============ FETCH LOTS ============
  const fetchData = useCallback(
    async (
      debouncedSearch: string,
      filterVillage: string,
      filterStatut: string,
      showArchived: boolean,
      page: number,
      pageSize: number,
      isOnline: boolean,
    ) => {
      if (!isOnline) {
        const cached = await getCachedLots();
        let filtered = cached.slice();
        if (!showArchived) {
          filtered = filtered.filter((lot) => !lot.deleted_at);
        }
        if (filterStatut) {
          filtered = filtered.filter((lot) => lot.statut === filterStatut);
        }
        if (filterVillage) {
          filtered = filtered.filter((lot) => lot.village === filterVillage);
        }
        if (debouncedSearch) {
          const q = debouncedSearch.toLowerCase();
          filtered = filtered.filter((lot) =>
            `${lot.reference} ${lot.numero_lot} ${lot.nom_lotissement} ${lot.village} ${lot.proprietaire_nom} ${lot.proprietaire_prenom}`
              .toLowerCase()
              .includes(q),
          );
        }
        filtered.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        const total = filtered.length;
        const start = (page - 1) * pageSize;
        const paged = filtered.slice(start, start + pageSize);
        return { data: paged, error: null, total };
      }

      const { data, error } = await withBackoff(() =>
        supabase.rpc("search_foncier_lots", {
          p_search: debouncedSearch,
          p_village: filterVillage,
          p_quartier: "",
          p_lotissement: "",
          p_statut: filterStatut,
          p_sort: "created_at",
          p_dir: "desc",
          p_page: page,
          p_limit: pageSize,
          p_include_archived: showArchived,
        }),
      );

      if (error) {
        if (import.meta.env.DEV) console.error("search_foncier_lots failed", error);
        return { data: null, error, total: 0 };
      }

      const lotsData = (data || []) as FoncierLot[];
      const total =
        lotsData.length > 0 && lotsData[0].total_count !== undefined
          ? lotsData[0].total_count
          : 0;

      if (lotsData.length > 0) {
        try {
          await upsertCachedLots(lotsData);
        } catch (err: any) {
          if (import.meta.env.DEV)
            console.warn("Cache update failed:", err?.code);
        }
      }

      return { data: lotsData, error: null, total };
    },
    [],
  );

  // ============ FETCH VILLAGE STATS ============
  const fetchVillageStats = useCallback(
    async (showArchived: boolean, isOnline: boolean) => {
      if (!isOnline) {
        const cached = await getCachedLots();
        const map: Record<string, { total: number; count: number }> = {};
        cached.forEach((lot) => {
          const key = lot.village || "—";
          if (!map[key]) {
            map[key] = { total: 0, count: 0 };
          }
          map[key].total += Number(lot.superficie || 0);
          map[key].count += 1;
        });
        return { data: map, error: null };
      }

      const { data, error } = await withBackoff(() =>
        supabase.rpc("foncier_stats_by_village", {
          p_include_archived: showArchived,
        }),
      );

      if (error) {
        if (import.meta.env.DEV)
          console.error("foncier_stats_by_village failed", error);
        return { data: null, error };
      }

      const map: Record<string, { total: number; count: number }> = {};
      (data || []).forEach(
        (row: {
          village: string;
          total_superficie: number;
          lots_count: number;
        }) => {
          map[row.village] = {
            total: Number(row.total_superficie || 0),
            count: Number(row.lots_count || 0),
          };
        },
      );
      return { data: map, error: null };
    },
    [],
  );

  // ============ FETCH AUDIT ============
  const fetchAudit = useCallback(
    async (
      auditPage: number,
      auditPageSize: number,
      auditActionFilter: string,
      isOnline: boolean,
    ) => {
      if (!isOnline) {
        return { data: null, error: "Mode hors-ligne", total: 0 };
      }

      const from = (auditPage - 1) * auditPageSize;
      const to = from + auditPageSize - 1;

      let query = supabase
        .from("foncier_audit")
        .select(
          "id, lot_id, action, performed_by, performed_at, old_values, new_values, foncier_lots:lot_id(reference, numero_lot, village)",
          { count: "exact" },
        )
        .order("performed_at", { ascending: false })
        .range(from, to);

      if (auditActionFilter) {
        query = query.eq("action", auditActionFilter);
      }

      const { data, error, count } = await withBackoff(() => query);

      if (error) {
        if (import.meta.env.DEV)
          console.error("fetchAudit failed", error);
        return { data: null, error, total: 0 };
      }

      const rows = (data || []) as AuditQueryRow[];
      const performerIds = Array.from(
        new Set(
          rows
            .map((row) => row.performed_by)
            .filter((value): value is string => Boolean(value)),
        ),
      );

      let namesById: Record<string, string> = {};
      if (performerIds.length > 0) {
        const { data: profilesData } = await withBackoff(() =>
          supabase
            .from("user_profiles")
            .select("id, full_name")
            .in("id", performerIds),
        );
        namesById = (profilesData || []).reduce(
          (acc: Record<string, string>, profile: { id: string; full_name: string | null }) => {
            acc[profile.id] = profile.full_name || "";
            return acc;
          },
          {} as Record<string, string>,
        );
      }

      const normalizedRows: AuditRecord[] = rows.map((row) => ({
        id: row.id,
        parcelle_id: row.lot_id,
        action: row.action,
        utilisateur_nom: row.performed_by
          ? namesById[row.performed_by] || null
          : null,
        date_action: row.performed_at,
        details: row.new_values || row.old_values || null,
        foncier_lots: row.foncier_lots || null,
      }));

      return { data: normalizedRows, error: null, total: count ?? 0 };
    },
    [],
  );

  // ============ LOAD VILLAGES ============
  const loadVillages = useCallback(async (isOnline: boolean) => {
    if (!isOnline) {
      return { data: null, error: "Mode hors-ligne" };
    }

    const { data, error } = await withBackoff(() =>
      supabase
        .from("foncier_villages")
        .select("name")
        .order("name", { ascending: true }),
    );

    if (error) {
      if (import.meta.env.DEV)
        console.error("loadVillages failed", error);
      return { data: null, error };
    }

    return {
      data: data ? data.map((row: { name: string }) => row.name) : null,
      error: null,
    };
  }, []);

  // ============ REFRESH CACHE ============
  const refreshCache = useCallback(async (isOnline: boolean) => {
    if (!isOnline) return { error: "Mode hors-ligne" };

    const { data, error } = await withBackoff(() =>
      supabase.rpc("search_foncier_lots", {
        p_search: "",
        p_village: "",
        p_quartier: "",
        p_lotissement: "",
        p_statut: "",
        p_sort: "created_at",
        p_dir: "desc",
        p_page: 1,
        p_limit: 1000,
        p_include_archived: true,
      }),
    );

    if (!error && data) {
      try {
        await upsertCachedLots(data as FoncierLot[]);
      } catch (err: any) {
        if (import.meta.env.DEV)
          console.warn("Cache refresh failed:", err?.code);
      }
    }

    return { error: error?.message || null };
  }, []);

  // ============ LOAD CACHED ============
  const loadCachedLots = useCallback(async () => {
    return await getCachedLots();
  }, []);

  // ============ REFRESH QUEUE COUNT ============
  const refreshQueueCount = useCallback(async () => {
    return await countQueueItems();
  }, []);

  // ============ CACHE OPERATIONS ============
  const upsertLot = useCallback(async (lot: FoncierLot) => {
    return await upsertCachedLot(lot);
  }, []);

  const queueOperation = useCallback(
    async (op: string, payload: any) => {
      return await addQueueItem({
        id: generateUUID(),
        op: op as any,
        payload,
        client_updated_at: new Date().toISOString(),
      });
    },
    [],
  );

  const dequeueOperation = useCallback(async (itemId: string) => {
    return await removeQueueItem(itemId);
  }, []);

  return {
    deviceId,
    fetchData,
    fetchVillageStats,
    fetchAudit,
    loadVillages,
    refreshCache,
    loadCachedLots,
    refreshQueueCount,
    upsertLot,
    queueOperation,
    dequeueOperation,
    withBackoff,
  };
}

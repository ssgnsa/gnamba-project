import { useCallback } from "react";
import { supabaseService, withBackoff } from "../lib/supabase.service";
export { withBackoff } from "../lib/supabase.service";
import type { FoncierLot } from "../types";
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

      const { data, error } = await supabaseService.searchLots({
        search: debouncedSearch,
        village: filterVillage,
        quartier: "",
        lotissement: "",
        statut: filterStatut,
        sort: "created_at",
        dir: "desc",
        page,
        limit: pageSize,
        include_archived: showArchived,
      });

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

      const { data, error } = await supabaseService.getVillageStats(
        showArchived,
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

  // ============ LOAD VILLAGES ============
  const loadVillages = useCallback(async (isOnline: boolean) => {
    if (!isOnline) {
      return { data: null, error: "Mode hors-ligne" };
    }

    const { data, error } = await supabaseService.getVillages();

    if (error) {
      if (import.meta.env.DEV)
        console.error("loadVillages failed", error);
      return { data: null, error };
    }

    return {
      data,
      error: null,
    };
  }, []);

  // ============ REFRESH CACHE ============
  const refreshCache = useCallback(async (isOnline: boolean) => {
    if (!isOnline) return { error: "Mode hors-ligne" };

    const { data, error } = await supabaseService.searchLots({
      search: "",
      village: "",
      quartier: "",
      lotissement: "",
      statut: "",
      sort: "created_at",
      dir: "desc",
      page: 1,
      limit: 1000,
      include_archived: true,
    });

    if (!error && data) {
      try {
        await upsertCachedLots(data as FoncierLot[]);
      } catch (err: any) {
        if (import.meta.env.DEV)
          console.warn("Cache refresh failed:", err?.code);
      }
    }

    return { error };
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

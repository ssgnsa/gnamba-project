import { useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { FoncierLot } from "../types";
import { withBackoff } from "./useFoncierSync";

/**
 * Hook pour la gestion des données foncier (lots)
 */
export function useFoncierData() {
  const fetchLots = useCallback(
    async (
      debouncedSearch: string,
      filterVillage: string,
      filterStatut: string,
      showArchived: boolean,
      page: number,
      pageSize: number,
      isOnline: boolean,
    ): Promise<{ data: FoncierLot[] | null; error: any; total: number }> => {
      if (!isOnline) {
        // Implementation offline would go here
        return { data: null, error: "Offline mode not implemented", total: 0 };
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
        return { data: null, error, total: 0 };
      }

      const lotsData = (data || []) as FoncierLot[];
      const total =
        lotsData.length > 0 && lotsData[0].total_count !== undefined
          ? lotsData[0].total_count
          : 0;

      return { data: lotsData, error: null, total };
    },
    [],
  );

  const fetchVillageStats = useCallback(
    async (
      showArchived: boolean,
      isOnline: boolean,
    ): Promise<{ data: Record<string, { total: number; count: number }> | null; error: any }> => {
      if (!isOnline) {
        // Implementation offline would go here
        return { data: null, error: "Offline mode not implemented" };
      }

      const { data, error } = await withBackoff(() =>
        supabase.rpc("foncier_stats_by_village", {
          p_include_archived: showArchived,
        }),
      );

      if (error) {
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

  return {
    fetchLots,
    fetchVillageStats,
  };
}
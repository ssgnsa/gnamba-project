import { useState, useCallback, useEffect, useMemo } from "react";
import { foncierRepository } from "../data/foncier.repository";
import type { FoncierLot } from "../types";

interface UseLotsOptions {
  initialPageSize?: number;
}

interface UseLotsReturn {
  // Data
  lots: FoncierLot[];
  totalCount: number;
  villageStats: Record<string, { total: number; count: number }>;
  villageOptions: string[];
  
  // Pagination
  page: number;
  pageSize: number;
  totalPages: number;
  setPage: (page: number) => void;
  
  // Filters
  search: string;
  setSearch: (search: string) => void;
  debouncedSearch: string;
  filterStatut: string;
  setFilterStatut: (statut: string) => void;
  filterVillage: string;
  setFilterVillage: (village: string) => void;
  showArchived: boolean;
  setShowArchived: (show: boolean) => void;
  
  // Loading states
  loading: boolean;
  statsLoading: boolean;
  statsError: string | null;
  
  // Actions
  fetchData: () => Promise<void>;
  refreshCache: () => Promise<void>;
  loadVillages: () => Promise<void>;
  fetchVillageStats: () => Promise<void>;
  
  // CRUD
  saveLot: (data: Record<string, unknown>, isUpdate?: boolean) => Promise<any>;
  softDeleteLot: (id: string, reason?: string) => Promise<any>;
  restoreLot: (id: string) => Promise<any>;
  checkDuplicate: (params: { village: string; lotissement: string; ilot: string; lot: string; exclude_lot_id?: string | null }) => Promise<any>;
  ensureHierarchy: (params: { village: string; lotissement: string; ilot: string }) => Promise<any>;
  
  // Offline
  loadCachedLots: () => Promise<void>;
  refreshQueueCount: () => Promise<number>;
  
  // Local filtered/paged data
  applyLocalFilters: (rows: FoncierLot[]) => { paged: FoncierLot[]; total: number };
}

export function useLots(options: UseLotsOptions = {}): UseLotsReturn {
  const { initialPageSize = 20 } = options;
  
  // Core data
  const [lots, setLots] = useState<FoncierLot[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [villageStats, setVillageStats] = useState<Record<string, { total: number; count: number }>>({});
  const [villageOptions, setVillageOptions] = useState<string[]>([]);
  const [villageOptionsLoaded, setVillageOptionsLoaded] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(initialPageSize);
  
  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [filterVillage, setFilterVillage] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  
  // Computed
  const totalPages = useMemo(() => Math.ceil(totalCount / pageSize), [totalCount, pageSize]);

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search?.trim() ?? "");
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filterStatut, filterVillage, showArchived]);

  // Local filtering for offline/immediate feedback
  const applyLocalFilters = useCallback((rows: FoncierLot[]) => {
    let filtered = rows.slice();
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
          .includes(q)
      );
    }
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);
    return { paged, total };
  }, [showArchived, filterStatut, filterVillage, debouncedSearch, page, pageSize]);

  // Offline cache
  const loadCachedLots = useCallback(async () => {
    try {
      const { getCachedLots } = await import("../lib/foncierOffline");
      const cached = await getCachedLots();
      const { paged, total } = applyLocalFilters(cached);
      setLots(paged);
      setTotalCount(total);
      setVillageStats(buildVillageStats(cached, showArchived));
      setStatsError(null);
    } catch (err) {
      console.error("Error loading cached lots:", err);
    }
  }, [applyLocalFilters, showArchived]);

  // Fetch data when dependencies change
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const repositoryResult = (await foncierRepository.searchLots({
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
      })) as { error?: unknown; data?: FoncierLot[] | null; count?: number | null } | null;
      const result = (repositoryResult ?? { error: null, data: [], count: 0 }) as {
        error?: unknown;
        data?: FoncierLot[] | null;
        count?: number | null;
      };

      if (result.error) throw result.error;

      const data = Array.isArray(result.data) ? result.data : [];
      const nextCount = typeof result.count === "number" ? result.count : data.length;
      setLots(data);
      setTotalCount(nextCount);
    } catch (err: any) {
      console.error("Error fetching lots:", err);
      // Fallback to cached
      await loadCachedLots();
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filterStatut, filterVillage, showArchived, page, pageSize, loadCachedLots]);

  // Auto-fetch when dependencies change
  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const loadVillages = useCallback(async () => {
    if (villageOptionsLoaded) return;
    try {
      const result = (await foncierRepository.getVillagesList()) as {
        error?: unknown;
        data?: Array<{ nom?: string } | null> | null;
      };
      if (result.error) throw result.error;
      const villages = result.data?.map((v: any) => v?.nom).filter(Boolean).sort() || [];
      setVillageOptions(villages);
      setVillageOptionsLoaded(true);
    } catch (err) {
      console.error("Error loading villages:", err);
    }
  }, [villageOptionsLoaded]);

  const fetchVillageStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const result = (await foncierRepository.getVillageStats(showArchived)) as {
        error?: unknown;
        data?: Record<string, { total: number; count: number }> | null;
      };
      if (result.error) throw result.error;
      setVillageStats(result.data || {});
    } catch (err: any) {
      console.error("Error fetching village stats:", err);
      setStatsError(err.message || "Impossible de charger les statistiques");
    } finally {
      setStatsLoading(false);
    }
  }, [showArchived]);

  useEffect(() => {
    fetchVillageStats();
  }, [fetchVillageStats]);

  const refreshQueueCount = useCallback(async (): Promise<number> => {
    try {
      const { countQueueItems } = await import("../lib/foncierOffline");
      const count = await countQueueItems();
      return count;
    } catch (err) {
      console.error("Error refreshing queue count:", err);
      return 0;
    }
  }, []);

  // CRUD operations
  const saveLot = useCallback(async (data: Record<string, unknown>, isUpdate = false) => {
    return foncierRepository.saveLot(data, isUpdate);
  }, []);

  const softDeleteLot = useCallback(async (id: string, reason = "archivage") => {
    return foncierRepository.softDeleteLot(id, reason);
  }, []);

  const restoreLot = useCallback(async (id: string) => {
    return foncierRepository.restoreLot(id);
  }, []);

  const checkDuplicate = useCallback(async (params: { village: string; lotissement: string; ilot: string; lot: string; exclude_lot_id?: string | null }) => {
    return foncierRepository.checkDuplicate(params);
  }, []);

  const ensureHierarchy = useCallback(async (params: { village: string; lotissement: string; ilot: string }) => {
    return foncierRepository.ensureHierarchy(params);
  }, []);

  const refreshCache = useCallback(async () => {
    await loadVillages();
    await fetchVillageStats();
    await fetchData();
  }, [loadVillages, fetchVillageStats, fetchData]);

  return {
    // Data
    lots,
    totalCount,
    villageStats,
    villageOptions,
    // Pagination
    page,
    pageSize,
    totalPages,
    setPage,
    // Filters
    search,
    setSearch,
    debouncedSearch,
    filterStatut,
    setFilterStatut,
    filterVillage,
    setFilterVillage,
    showArchived,
    setShowArchived,
    // Loading
    loading,
    statsLoading,
    statsError,
    // Actions
    fetchData,
    refreshCache,
    loadVillages,
    fetchVillageStats,
    // CRUD
    saveLot,
    softDeleteLot,
    restoreLot,
    checkDuplicate,
    ensureHierarchy,
    // Offline
    loadCachedLots,
    refreshQueueCount,
    // Local filtering
    applyLocalFilters,
  };
}

// Helper function for village stats
function buildVillageStats(rows: FoncierLot[], showArchived: boolean) {
  const map: Record<string, { total: number; count: number }> = {};
  rows.forEach((lot) => {
    if (!showArchived && lot.deleted_at) return;
    const key = lot.village || "—";
    if (!map[key]) map[key] = { total: 0, count: 0 };
    map[key].total += Number(lot.superficie || 0);
    map[key].count += 1;
  });
  return map;
}
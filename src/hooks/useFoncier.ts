import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { logFoncierAuditFromPayload } from "../lib/foncierAudit";
import { FoncierLot } from "../types";
import {
  addQueueItem,
  countQueueItems,
  getCachedLots,
  getDeviceId,
  getQueueItems,
  removeQueueItem,
  upsertCachedLot,
  upsertCachedLots,
} from "../lib/foncierOffline";
import { generateUUID } from "../utils/reference";
import { validateFoncierForm } from "../lib/foncierValidation";

export interface UseFoncierOptions {
  pageSize?: number;
  enableOffline?: boolean;
}

export interface UseFoncierReturn {
  // Data
  lots: FoncierLot[];
  loading: boolean;
  error: string | null;
  totalCount: number;

  // Pagination & Filters
  page: number;
  setPage: (page: number) => void;
  search: string;
  setSearch: (search: string) => void;
  filterStatut: string;
  setFilterStatut: (statut: string) => void;
  filterVillage: string;
  setFilterVillage: (village: string) => void;
  showArchived: boolean;
  setShowArchived: (show: boolean) => void;

  // Online/Offline status
  isOnline: boolean;
  syncing: boolean;
  syncPending: number;
  syncError: string | null;

  // Actions
  fetchData: () => Promise<void>;
  handleSave: (
    form: Partial<FoncierLot>,
    editingId: string | null,
  ) => Promise<{ success: boolean; error?: string }>;
  handleArchive: (lot: FoncierLot) => Promise<void>;
  handleRestore: (lot: FoncierLot) => Promise<void>;
  syncQueue: () => Promise<void>;

  // Computed
  totalPages: number;
}

const DEFAULT_OPTIONS: UseFoncierOptions = {
  pageSize: 20,
  enableOffline: true,
};

export function useFoncier(
  options: UseFoncierOptions = DEFAULT_OPTIONS,
): UseFoncierReturn {
  const { pageSize = 20 } = options;

  // State
  const [lots, setLots] = useState<FoncierLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [filterVillage, setFilterVillage] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  // Online/Offline
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [syncPending, setSyncPending] = useState(0);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Device ID for offline tracking
  const deviceId = useMemo(() => getDeviceId(), []);

  // Helpers
  const applyLocalFilters = useCallback(
    (rows: FoncierLot[]) => {
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
      return { paged, total };
    },
    [
      showArchived,
      filterStatut,
      filterVillage,
      debouncedSearch,
      page,
      pageSize,
    ],
  );

  const loadCachedLots = useCallback(async () => {
    const cached = await getCachedLots();
    const filtered = applyLocalFilters(cached);
    setLots(filtered.paged);
    setTotalCount(filtered.total);
  }, [applyLocalFilters]);

  const refreshQueueCount = useCallback(async () => {
    const count = await countQueueItems();
    setSyncPending(count);
  }, []);

  const refreshCache = useCallback(async () => {
    if (!navigator.onLine) return;
    const { data, error } = await supabase.rpc("search_foncier_lots", {
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
    });
    if (!error && data) {
      await upsertCachedLots(data as FoncierLot[]);
    }
  }, []);

  // Main fetch function
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isOnline) {
      await loadCachedLots();
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase.rpc(
      "search_foncier_lots",
      {
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
      },
    );

    if (fetchError) {
      if (import.meta.env.DEV)
        console.error("search_foncier_lots failed", fetchError);
      setError("Impossible de charger les lots fonciers. Réessayez.");
      await loadCachedLots();
    } else {
      const lotsData = (data || []) as FoncierLot[];
      setLots(lotsData);
      const count =
        lotsData.length > 0 && lotsData[0].total_count !== undefined
          ? lotsData[0].total_count
          : 0;
      setTotalCount(count);
      if (lotsData.length > 0) {
        await upsertCachedLots(lotsData);
      }
    }
    setLoading(false);
  }, [
    isOnline,
    loadCachedLots,
    debouncedSearch,
    filterVillage,
    filterStatut,
    page,
    pageSize,
    showArchived,
  ]);

  // Sync queue
  const syncQueue = useCallback(async () => {
    if (!navigator.onLine || syncing) return;
    setSyncing(true);
    setSyncError(null);
    const queue = await getQueueItems();
    let syncErrors = 0;

    const sorted = queue.sort((a, b) =>
      (a.client_updated_at || "").localeCompare(b.client_updated_at || ""),
    );
    for (const item of sorted) {
      try {
        if (item.op === "upsert_lot") {
          let payload = item.payload as Partial<FoncierLot> & { id: string };
          if (!payload.lotissement_id || !payload.ilot_id) {
            const { data, error } = await supabase.rpc(
              "ensure_foncier_hierarchy",
              {
                p_village: payload.village || "",
                p_lotissement: payload.nom_lotissement || "",
                p_ilot: payload.numero_ilot || "",
              },
            );
            if (!error && data) {
              const hierarchy = Array.isArray(data) ? data[0] : data;
              payload = {
                ...payload,
                lotissement_id:
                  hierarchy?.lotissement_id || payload.lotissement_id || null,
                ilot_id: hierarchy?.ilot_id || payload.ilot_id || null,
              };
            } else if (error) {
              if (import.meta.env.DEV)
                console.error(
                  "ensure_foncier_hierarchy failed during sync",
                  error,
                );
              syncErrors++;
              continue;
            }
          }

          const { data: server, error: fetchError } = await supabase
            .from("foncier_lots")
            .select("id, updated_at, client_updated_at")
            .eq("id", payload.id)
            .maybeSingle();

          if (fetchError) {
            if (import.meta.env.DEV)
              console.error(
                "Failed to fetch server lot during sync",
                fetchError,
              );
            syncErrors++;
            continue;
          }

          const serverTs = new Date(
            server?.client_updated_at || server?.updated_at || 0,
          ).getTime();
          const clientTs = new Date(
            item.client_updated_at ||
              payload.client_updated_at ||
              payload.updated_at ||
              0,
          ).getTime();
          if (server && serverTs > clientTs) {
            await removeQueueItem(item.id);
            continue;
          }

          let syncError;
          if (server) {
            const { error } = await supabase
              .from("foncier_lots")
              .update(payload)
              .eq("id", payload.id);
            syncError = error;
          } else {
            const { error } = await supabase
              .from("foncier_lots")
              .insert(payload);
            syncError = error;
          }

          if (syncError) {
            if (import.meta.env.DEV)
              console.error("Sync upsert_lot failed", syncError);
            syncErrors++;
            continue;
          }
          await removeQueueItem(item.id);
        }

        if (item.op === "soft_delete_lot") {
          const payload = item.payload as {
            id: string;
            deleted_reason?: string;
          };
          const { error } = await supabase.rpc("soft_delete_foncier_lot", {
            p_lot_id: payload.id,
            p_reason: payload.deleted_reason || "archivage",
          });
          if (error) {
            if (import.meta.env.DEV)
              console.error("Sync soft_delete_lot failed", error);
            syncErrors++;
            continue;
          }
          await removeQueueItem(item.id);
        }

        if (item.op === "restore_lot") {
          const payload = item.payload as { id: string };
          const { error } = await supabase.rpc("restore_foncier_lot", {
            p_lot_id: payload.id,
          });
          if (error) {
            if (import.meta.env.DEV)
              console.error("Sync restore_lot failed", error);
            syncErrors++;
            continue;
          }
          await removeQueueItem(item.id);
        }

        if (item.op === "audit_log") {
          const { error } = await logFoncierAuditFromPayload(
            supabase,
            item.payload,
          );
          if (error) {
            if (import.meta.env.DEV)
              console.error("Sync audit_log failed", error);
            syncErrors++;
            continue;
          }
          await removeQueueItem(item.id);
        }
      } catch (err) {
        if (import.meta.env.DEV)
          console.error("Sync error for item", item.id, err);
        syncErrors++;
      }
    }

    if (syncErrors > 0) {
      setSyncError(`${syncErrors} erreur(s) de synchronisation.`);
    }
    await refreshQueueCount();
    await refreshCache();
    setSyncing(false);
  }, [refreshQueueCount, refreshCache, syncing]);

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  // Online/Offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      void syncQueue();
      void refreshCache();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncQueue, refreshCache]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [filterStatut, filterVillage, showArchived]);

  // Fetch data on dependency change
  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Load cached lots on mount
  useEffect(() => {
    void loadCachedLots();
    void refreshQueueCount();
  }, [loadCachedLots, refreshQueueCount]);

  // Save lot
  const handleSave = async (
    form: Partial<FoncierLot>,
    editingId: string | null,
  ): Promise<{ success: boolean; error?: string }> => {
    // Validate with Zod
    const validation = validateFoncierForm(form);
    if (!validation.success && validation.errors) {
      const firstError = Object.values(validation.errors)[0];
      return { success: false, error: firstError };
    }

    // Check for duplicates locally
    const duplicateLocal = lots.find(
      (lot) =>
        lot.village === form.village &&
        lot.nom_lotissement === form.nom_lotissement &&
        lot.numero_ilot === form.numero_ilot &&
        lot.numero_lot === form.numero_lot &&
        lot.id !== editingId,
    );
    if (duplicateLocal) {
      return {
        success: false,
        error: `Un lot existe déjà avec ces caractéristiques : ${duplicateLocal.reference}.`,
      };
    }

    // Check for duplicates in DB
    if (isOnline) {
      const { data: existingLot } = await supabase
        .from("foncier_lots")
        .select("id, reference")
        .eq("village", form.village)
        .eq("nom_lotissement", form.nom_lotissement)
        .eq("numero_ilot", form.numero_ilot)
        .eq("numero_lot", form.numero_lot)
        .neq("id", editingId || "00000000-0000-0000-0000-000000000000")
        .is("deleted_at", null)
        .maybeSingle();

      if (existingLot) {
        return {
          success: false,
          error: `Un lot existe déjà avec ces caractéristiques : ${existingLot.reference}.`,
        };
      }
    }

    // Create hierarchy
    let hierarchy: {
      lotissement_id?: string | null;
      ilot_id?: string | null;
    } | null = null;
    if (isOnline) {
      const { data, error } = await supabase.rpc("ensure_foncier_hierarchy", {
        p_village: form.village || "",
        p_lotissement: form.nom_lotissement || "",
        p_ilot: form.numero_ilot || "",
      });
      if (error || !data) {
        return {
          success: false,
          error: "Impossible de créer la hiérarchie foncière.",
        };
      }
      hierarchy = Array.isArray(data) ? data[0] : data;
    }

    const nowIso = new Date().toISOString();
    const lotId = editingId || generateUUID();

    const payload = {
      id: lotId,
      ...form,
      lotissement_id: hierarchy?.lotissement_id || null,
      ilot_id: hierarchy?.ilot_id || null,
      client_updated_at: nowIso,
      last_modified_device_id: deviceId,
      updated_at: nowIso,
    };

    // Offline mode
    if (!isOnline) {
      await upsertCachedLot(payload as FoncierLot);
      await addQueueItem({
        id: generateUUID(),
        op: "upsert_lot",
        payload,
        client_updated_at: nowIso,
      });
      await refreshQueueCount();
      await loadCachedLots();
      return { success: true };
    }

    // Online mode
    let data: FoncierLot | null = null;
    let dbError: string | null = null;
    let dbErrorCode: string | null = null;

    if (editingId) {
      const result = await supabase
        .from("foncier_lots")
        .update(payload)
        .eq("id", editingId)
        .select("*")
        .single();
      data = result.data as FoncierLot | null;
      dbError = result.error?.message || null;
      dbErrorCode = result.error?.code || null;
    } else {
      const result = await supabase
        .from("foncier_lots")
        .insert(payload)
        .select("*")
        .single();
      data = result.data as FoncierLot | null;
      dbError = result.error?.message || null;
      dbErrorCode = result.error?.code || null;
    }

    if (dbError) {
      let errorMsg: string;
      if (
        dbErrorCode === "23505" ||
        dbError.includes("duplicate") ||
        dbError.includes("unique")
      ) {
        if (dbError.includes("foncier_lots_unique_location")) {
          errorMsg = `Un lot existe déjà avec ces caractéristiques (village, lotissement, îlot, lot).`;
        } else {
          errorMsg = `Un doublon a été détecté.`;
        }
      } else {
        errorMsg = `Erreur: ${dbError}`;
      }
      return { success: false, error: errorMsg };
    }

    if (data) {
      await upsertCachedLot(data);
    }

    void fetchData();
    return { success: true };
  };

  // Archive lot
  const handleArchive = async (lot: FoncierLot) => {
    const nowIso = new Date().toISOString();

    if (!isOnline) {
      const payload = {
        ...lot,
        deleted_at: nowIso,
        deleted_reason: "archivage",
        client_updated_at: nowIso,
      };
      await upsertCachedLot(payload as FoncierLot);
      await addQueueItem({
        id: generateUUID(),
        op: "soft_delete_lot",
        payload: { id: lot.id, deleted_reason: "archivage" },
        client_updated_at: nowIso,
      });
      await refreshQueueCount();
      await loadCachedLots();
      return;
    }

    await supabase.rpc("soft_delete_foncier_lot", {
      p_lot_id: lot.id,
      p_reason: "archivage",
    });
    await refreshCache();
    void fetchData();
  };

  // Restore lot
  const handleRestore = async (lot: FoncierLot) => {
    const nowIso = new Date().toISOString();

    if (!isOnline) {
      const payload = {
        ...lot,
        deleted_at: null,
        deleted_reason: null,
        client_updated_at: nowIso,
      };
      await upsertCachedLot(payload as FoncierLot);
      await addQueueItem({
        id: generateUUID(),
        op: "restore_lot",
        payload: { id: lot.id },
        client_updated_at: nowIso,
      });
      await refreshQueueCount();
      await loadCachedLots();
      return;
    }

    await supabase.rpc("restore_foncier_lot", { p_lot_id: lot.id });
    await refreshCache();
    void fetchData();
  };

  // Computed
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    lots,
    loading,
    error,
    totalCount,
    page,
    setPage,
    search,
    setSearch,
    filterStatut,
    setFilterStatut,
    filterVillage,
    setFilterVillage,
    showArchived,
    setShowArchived,
    isOnline,
    syncing,
    syncPending,
    syncError,
    fetchData,
    handleSave,
    handleArchive,
    handleRestore,
    syncQueue,
    totalPages,
  };
}

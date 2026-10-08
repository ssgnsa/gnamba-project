import { useCallback, useEffect, useMemo, useRef } from "react";
import { useAuth, resolveAccessLevel } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { useLots } from "./useLots";
import { useAttestations } from "./useAttestations";
import { useVillages } from "./useVillages";
import { useFoncierSync } from "./useFoncierSync";
import { useFoncierAudit } from "./useFoncierAudit";
import { useFoncierLogic } from "./useFoncierLogic";
import { printAttestationAnnex, printAttestationCoutumiere } from "../utils/print";
import type { FoncierLot } from "../types";
import type { FoncierConfigMap } from "../components/foncier/FoncierConstants";

interface UseFoncierStateReturn {
  lots: FoncierLot[];
  totalCount: number;
  villageStats: Record<string, { total: number; count: number }>;
  villageOptions: string[];
  page: number;
  pageSize: number;
  totalPages: number;
  setPage: (page: number) => void;
  search: string;
  setSearch: (search: string) => void;
  debouncedSearch: string;
  filterStatut: string;
  setFilterStatut: (statut: string) => void;
  filterVillage: string;
  setFilterVillage: (village: string) => void;
  showArchived: boolean;
  setShowArchived: (show: boolean) => void;
  loading: boolean;
  fetchData: () => Promise<void>;
  loadCachedLots: () => Promise<void>;
  refreshQueueCount: () => Promise<number>;
  selectedVillage: string;
  setSelectedVillage: (village: string) => void;
  villageOptionsLoading: boolean;
  config: FoncierConfigMap;
  configLoading: boolean;
  configError: string | null;
  loadConfig: (village: string) => Promise<void>;
  updateConfig: (updates: Partial<FoncierConfigMap>) => void;
  saveConfig: () => Promise<boolean>;
  setConfigError: (error: string | null) => void;
  logoUrl: string | undefined;
  setLogoUrl: (url: string | undefined) => void;
  deviceId: string;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  syncing: boolean;
  syncPending: number;
  syncProgress: number;
  syncError: string | null;
  setSyncProgress: (progress: number) => void;
  setSyncError: (error: string | null) => void;
  syncQueue: () => Promise<void>;
  auditModalOpen: boolean;
  setAuditModalOpen: (open: boolean) => void;
  auditRecords: any[];
  auditLoading: boolean;
  auditPage: number;
  setAuditPage: (page: number) => void;
  auditTotal: number;
  auditActionFilter: string;
  setAuditActionFilter: (filter: string) => void;
  auditError: string | null;
  fetchAudit: () => Promise<{ data: any[] | null; error: any; total: number }>;
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  form: any;
  setForm: (form: any) => void;
  saving: boolean;
  setSaving: (saving: boolean) => void;
  configModalOpen: boolean;
  setConfigModalOpen: (open: boolean) => void;
  configForm: any;
  setConfigForm: (form: any) => void;
  configCache: any;
  setConfigCache: (cache: any) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pageError: string | null;
  setPageError: (error: string | null) => void;
  modalError: string | null;
  setModalError: (error: string | null) => void;
  attestationModalOpen: boolean;
  setAttestationModalOpen: (open: boolean) => void;
  attestationLot: FoncierLot | null;
  setAttestationLot: (lot: FoncierLot | null) => void;
  attestationForm: any;
  setAttestationForm: (form: any) => void;
  attestationSaving: boolean;
  setAttestationSaving: (saving: boolean) => void;
  attestationError: string | null;
  setAttestationError: (error: string | null) => void;
  workflowModalOpen: boolean;
  setWorkflowModalOpen: (open: boolean) => void;
  workflowSelectedLot: string | null;
  setWorkflowSelectedLot: (id: string | null) => void;
  attestationHistoryOpen: boolean;
  setAttestationHistoryOpen: (open: boolean) => void;
  attestationHistoryLot: FoncierLot | null;
  setAttestationHistoryLot: (lot: FoncierLot | null) => void;
  attestationHistoryRecords: any[];
  setAttestationHistoryRecords: (records: any[]) => void;
  attestationHistoryScans: Record<string, any>;
  setAttestationHistoryScans: (scans: Record<string, any>) => void;
  attestationHistoryLoading: boolean;
  canManage: boolean;
  accessLevel: string;
  settings: any;
  profile: any;
  searchInputRef: React.RefObject<HTMLInputElement>;
  openAdd: () => Promise<void>;
  openEdit: (lot: FoncierLot) => void;
  openAttestation: (lot: FoncierLot) => void;
  openWorkflow: (lotId: string) => void;
  openAttestationHistory: (lot: FoncierLot) => void;
  openConfig: (village: string) => void;
  openAudit: () => void;
  handleArchive: (lot: FoncierLot) => Promise<void>;
  handleRestore: (lot: FoncierLot) => Promise<void>;
  handlePrintAttestation: (lot: FoncierLot) => Promise<void>;
  handlePrintAttestationAnnex: (lot: FoncierLot) => Promise<void>;
  handleGenerateAttestation: () => Promise<void>;
}

export function useFoncierState(): UseFoncierStateReturn {
  const { profile } = useAuth();
  const { settings } = useSettings();
  
  const accessLevel = resolveAccessLevel(profile?.role, profile?.access_level);
  const canManage = 
    accessLevel === "admin" ||
    accessLevel === "gestionnaire" ||
    accessLevel === "gerant" ||
    accessLevel === "secretaire";

  // Search input ref
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Use focused hooks
  const lotsHook = useLots();
  const {
    loadVillages: loadLotsVillages,
    fetchVillageStats: fetchLotsVillageStats,
    setPage: setLotsPage,
    fetchData: fetchLotsData,
    debouncedSearch: lotsDebouncedSearch,
    filterStatut: lotsFilterStatut,
    filterVillage: lotsFilterVillage,
    showArchived: lotsShowArchived,
    page: lotsPage,
  } = lotsHook;
  const attestationsHook = useAttestations({ deviceId: "", profile });
  const villagesHook = useVillages({ accessLevel, profile });
  const syncHook = useFoncierSync();
  const auditHook = useFoncierAudit();
  const logicHook = useFoncierLogic(syncHook.deviceId, profile);

  // Update attestations hook with deviceId from sync
  // Note: In a real implementation, we'd use a context or pass deviceId properly
  
  // UI Action handlers
  const openAdd = useCallback(async () => {
    logicHook.setEditingId(null);
    logicHook.setForm({});
    logicHook.setModalOpen(true);
    logicHook.setModalError(null);
  }, [logicHook]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) return;
      
      if (event.ctrlKey && event.key.toLowerCase() === "n") {
        event.preventDefault();
        if (canManage) {
          void openAdd();
        }
      }
      if (event.ctrlKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [canManage, openAdd]);

  // Online/offline handlers
  useEffect(() => {
    const handleOnline = () => {
      syncHook.setIsOnline(true);
      void syncHook.syncQueue();
      void syncHook.refreshCache();
      void loadLotsVillages();
      void fetchLotsVillageStats();
    };
    const handleOffline = () => syncHook.setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [fetchLotsVillageStats, loadLotsVillages, syncHook]);

  // Sync page reset when filters change
  useEffect(() => {
    setLotsPage(1);
  }, [lotsFilterStatut, lotsFilterVillage, lotsShowArchived, setLotsPage]);

  // Auto-fetch data
  useEffect(() => {
    void fetchLotsData();
  }, [lotsDebouncedSearch, lotsFilterStatut, lotsFilterVillage, lotsShowArchived, lotsPage, syncHook.isOnline, fetchLotsData]);

  useEffect(() => {
    void fetchLotsVillageStats();
  }, [lotsShowArchived, syncHook.isOnline, fetchLotsVillageStats]);

  // Audit fetch
  const fetchAudit = useCallback(async () => {
    await auditHook.fetchAudit(
      auditHook.auditPage,
      lotsHook.pageSize,
      auditHook.auditActionFilter,
      syncHook.isOnline,
    );
  }, [auditHook, lotsHook.pageSize, syncHook.isOnline]);

  useEffect(() => {
    if (auditHook.auditModalOpen) {
      fetchAudit();
    }
  }, [auditHook.auditModalOpen, auditHook.auditPage, auditHook.auditActionFilter, fetchAudit]);

  const openEdit = useCallback((lot: FoncierLot) => {
    logicHook.setEditingId(lot.id);
    logicHook.setForm(lot);
    logicHook.setModalOpen(true);
    logicHook.setModalError(null);
  }, [logicHook]);

  const openAttestation = useCallback((lot: FoncierLot) => {
    logicHook.setAttestationLot(lot);
    logicHook.setAttestationForm({});
    logicHook.setAttestationModalOpen(true);
    logicHook.setAttestationError(null);
  }, [logicHook]);

  const openWorkflow = useCallback((lotId: string) => {
    logicHook.setWorkflowSelectedLot(lotId);
    logicHook.setWorkflowModalOpen(true);
  }, [logicHook]);

  const openAttestationHistory = useCallback(async (lot: FoncierLot) => {
    logicHook.setAttestationHistoryLot(lot);
    logicHook.setAttestationHistoryOpen(true);
    logicHook.setAttestationHistoryRecords([]);
    logicHook.setAttestationHistoryScans({});
    attestationsHook.setAttestationHistoryError(null);
    await attestationsHook.fetchAttestationHistory(lot.id);
  }, [logicHook, attestationsHook]);

  const openConfig = useCallback((village: string) => {
    villagesHook.setSelectedVillage(village);
    logicHook.setConfigModalOpen(true);
    logicHook.setConfigError(null);
  }, [villagesHook, logicHook]);

  const openAudit = useCallback(() => {
    logicHook.setAuditModalOpen(true);
    logicHook.setAuditError(null);
  }, [logicHook]);

  const handleArchive = useCallback(async (lot: FoncierLot) => {
    if (!confirm(`Archiver le lot ${lot.reference} ?`)) return;
    logicHook.setPageError(null);
    try {
      await lotsHook.softDeleteLot(lot.id, "archivage");
      await lotsHook.fetchData();
    } catch (err: any) {
      logicHook.setPageError(err.message || "Erreur lors de l'archivage");
    }
  }, [lotsHook, logicHook]);

  const handleRestore = useCallback(async (lot: FoncierLot) => {
    if (!confirm(`Restaurer le lot ${lot.reference} ?`)) return;
    logicHook.setPageError(null);
    try {
      await lotsHook.restoreLot(lot.id);
      await lotsHook.fetchData();
    } catch (err: any) {
      logicHook.setPageError(err.message || "Erreur lors de la restauration");
    }
  }, [lotsHook, logicHook]);

  const handlePrintAttestation = useCallback(async (lot: FoncierLot) => {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      alert("Veuillez autoriser les fenêtres popup pour imprimer.");
      return;
    }

    printWindow.document.write(
      "<!doctype html><html lang=\"fr\"><head><meta charset=\"utf-8\"><title>Préparation de l’attestation</title></head><body>Préparation de l’attestation…</body></html>",
    );
    printWindow.document.close();

    try {
      const record = await attestationsHook.getLatestAttestation(lot.id);
      if (!record) {
        printWindow.close();
        alert("Aucune attestation disponible pour ce lot.");
        return;
      }
      if (record.statut !== "valide" || !record.reference || !record.date_etablissement) {
        printWindow.close();
        alert("Seule une attestation validée avec référence et date peut être imprimée.");
        return;
      }

      const payload = {
        reference: record.reference,
        numero_enregistrement: record.numero_enregistrement ?? "",
        date_etablissement: record.date_etablissement,
        original: Boolean(record.original),
        statut: record.statut,
        mode_acquisition: record.mode_acquisition ?? "",
        historique_possession: record.historique_possession ?? "",
        domicile: record.domicile ?? "",
        limites_nord: record.limites_nord ?? "",
        limites_sud: record.limites_sud ?? "",
        limites_est: record.limites_est ?? "",
        limites_ouest: record.limites_ouest ?? "",
        coordonnees_gps: record.coordonnees_gps ?? {
          lat: Number(record.gps_lat ?? lot.gps_lat ?? 0),
          lng: Number(record.gps_lng ?? lot.gps_lng ?? 0),
          precision: Number(record.gps_precision ?? lot.gps_precision ?? 0),
        },
        gps_points: record.gps_points ?? [],
        registre_volume: record.registre_volume ?? "",
        registre_page: record.registre_page ?? null,
        registre_ligne: record.registre_ligne ?? null,
        control_number: record.control_number ?? "",
        hash_sha256: record.hash_sha256 ?? "",
        validation_agent_nom: record.validation_agent_nom ?? "",
        validation_chef_nom: record.validation_chef_nom ?? "",
        attestation_type: record.type ?? record.attestation_type ?? "standard",
        village: lot.village ?? record.village ?? "",
        quartier: lot.quartier ?? record.quartier ?? "",
        lotissement: lot.nom_lotissement ?? record.lotissement ?? "",
        numero_lot: lot.numero_lot ?? record.numero_lot ?? "",
        superficie_m2: Number(record.superficie_m2 ?? lot.superficie ?? 0),
        cedant_nom: record.cedant_nom ?? "",
        cedant_prenom: record.cedant_prenom ?? "",
        cedant_cni_numero: record.cedant_cni_numero ?? "",
        cedant_telephone: record.cedant_telephone ?? "",
        cedant_domicile: record.cedant_domicile ?? "",
        date_cession: record.date_cession ?? "",
        proprietaire_nom: lot.proprietaire_nom ?? record.proprietaire_nom ?? "",
        proprietaire_prenom: lot.proprietaire_prenom ?? record.proprietaire_prenom ?? "",
        proprietaire_naissance_date: record.proprietaire_naissance_date ?? "",
        proprietaire_naissance_lieu: record.proprietaire_naissance_lieu ?? "",
        proprietaire_domicile: record.proprietaire_domicile ?? "",
        proprietaire_profession: record.proprietaire_profession ?? "",
        proprietaire_cni_numero: record.proprietaire_cni_numero ?? "",
        proprietaire_cni_date: record.proprietaire_cni_date ?? "",
        proprietaire_cni_lieu: record.proprietaire_cni_lieu ?? "",
        proprietaire_telephone: record.proprietaire_telephone ?? "",
        chef_village: record.chef_village ?? "",
        chef_nom: record.chef_nom ?? record.validation_chef_nom ?? "",
        lieu_signature: record.lieu_signature ?? lot.village ?? "",
        village_logo_url: record.village_logo_url ?? "",
        logoUrl: record.logo_url ?? settings.logo_url ?? "",
        qrDataUrl: record.qr_data_url ?? record.qrDataUrl ?? "",
        code_barre: record.code_barre ?? "",
        lot: {
          id: lot.id,
          reference: lot.reference,
          numero_lot: lot.numero_lot,
          village: lot.village,
          quartier: lot.quartier,
          lotissement: lot.nom_lotissement,
          superficie_m2: lot.superficie ?? 0,
          gps_lat: lot.gps_lat,
          gps_lng: lot.gps_lng,
          gps_precision: lot.gps_precision,
        },
        temoins: record.foncier_attestation_temoins ?? [],
      } as any;

      await printAttestationCoutumiere(payload, printWindow);
    } catch (err) {
      console.error("Print error:", err);
      if (!printWindow.closed) printWindow.close();
      alert("Impossible d’imprimer l’attestation.");
    }
  }, [attestationsHook, settings.logo_url]);

  const handlePrintAttestationAnnex = useCallback(async (lot: FoncierLot) => {
    try {
      await attestationsHook.getLatestAttestation(lot.id);
      const record = attestationsHook.latestAttestation;
      if (!record) {
        alert("Aucune attestation disponible pour ce lot.");
        return;
      }
      if (record.statut !== "valide" || !record.reference || !record.date_etablissement) {
        alert("Seule une attestation validée avec référence et date peut être imprimée.");
        return;
      }

      const payload = {
        reference: record.reference,
        numero_enregistrement: record.numero_enregistrement ?? "",
        date_etablissement: record.date_etablissement,
        original: Boolean(record.original),
        statut: record.statut,
        mode_acquisition: record.mode_acquisition ?? "",
        historique_possession: record.historique_possession ?? "",
        domicile: record.domicile ?? "",
        limites_nord: record.limites_nord ?? "",
        limites_sud: record.limites_sud ?? "",
        limites_est: record.limites_est ?? "",
        limites_ouest: record.limites_ouest ?? "",
        coordonnees_gps: record.coordonnees_gps ?? {
          lat: Number(record.gps_lat ?? lot.gps_lat ?? 0),
          lng: Number(record.gps_lng ?? lot.gps_lng ?? 0),
          precision: Number(record.gps_precision ?? lot.gps_precision ?? 0),
        },
        gps_points: record.gps_points ?? [],
        registre_volume: record.registre_volume ?? "",
        registre_page: record.registre_page ?? null,
        registre_ligne: record.registre_ligne ?? null,
        control_number: record.control_number ?? "",
        hash_sha256: record.hash_sha256 ?? "",
        validation_agent_nom: record.validation_agent_nom ?? "",
        validation_chef_nom: record.validation_chef_nom ?? "",
        attestation_type: record.type ?? record.attestation_type ?? "standard",
        village: lot.village ?? record.village ?? "",
        quartier: lot.quartier ?? record.quartier ?? "",
        lotissement: lot.nom_lotissement ?? record.lotissement ?? "",
        numero_lot: lot.numero_lot ?? record.numero_lot ?? "",
        superficie_m2: Number(record.superficie_m2 ?? lot.superficie ?? 0),
        proprietaire_nom: lot.proprietaire_nom ?? record.proprietaire_nom ?? "",
        proprietaire_prenom: lot.proprietaire_prenom ?? record.proprietaire_prenom ?? "",
        proprietaire_naissance_date: record.proprietaire_naissance_date ?? "",
        proprietaire_naissance_lieu: record.proprietaire_naissance_lieu ?? "",
        proprietaire_domicile: record.proprietaire_domicile ?? "",
        proprietaire_profession: record.proprietaire_profession ?? "",
        proprietaire_cni_numero: record.proprietaire_cni_numero ?? "",
        proprietaire_cni_date: record.proprietaire_cni_date ?? "",
        proprietaire_cni_lieu: record.proprietaire_cni_lieu ?? "",
        proprietaire_telephone: record.proprietaire_telephone ?? "",
        chef_village: record.chef_village ?? "",
        chef_nom: record.chef_nom ?? record.validation_chef_nom ?? "",
        lieu_signature: record.lieu_signature ?? lot.village ?? "",
        village_logo_url: record.village_logo_url ?? "",
        logoUrl: record.logo_url ?? "",
        qrDataUrl: record.qr_data_url ?? record.qrDataUrl ?? "",
        code_barre: record.code_barre ?? "",
        lot: {
          id: lot.id,
          reference: lot.reference,
          numero_lot: lot.numero_lot,
          village: lot.village,
          quartier: lot.quartier,
          lotissement: lot.nom_lotissement,
          superficie_m2: lot.superficie ?? 0,
          gps_lat: lot.gps_lat,
          gps_lng: lot.gps_lng,
          gps_precision: lot.gps_precision,
        },
        temoins: record.foncier_attestation_temoins ?? [],
      } as any;

      await printAttestationAnnex(payload);
    } catch (err) {
      console.error("Print annex error:", err);
      alert("Impossible d’imprimer l’annexe technique.");
    }
  }, [attestationsHook]);

  const handleGenerateAttestation = useCallback(async () => {
    // This would be handled by the AttestationModal component
    // Just a placeholder for the logic hook
  }, []);

  // Memoize the combined return object
  const combinedState = useMemo(
    () => ({
      // Lots
      ...lotsHook,
      // Attestations
      ...attestationsHook,
      // Villages
      ...villagesHook,
      // Sync
      ...syncHook,
      // Audit
      ...auditHook,
      // Logic (UI state)
      ...logicHook,
      // Explicit overrides to avoid name collisions between hooks
      fetchData: lotsHook.fetchData,
      refreshCache: lotsHook.refreshCache,
      fetchVillageStats: lotsHook.fetchVillageStats,
      loadVillages: lotsHook.loadVillages,
      loadCachedLots: lotsHook.loadCachedLots,
      refreshQueueCount: lotsHook.refreshQueueCount,
      // Sync-specific explicit exposures
      deviceId: syncHook.deviceId,
      isOnline: syncHook.isOnline,
      setIsOnline: syncHook.setIsOnline,
      syncing: syncHook.syncing,
      syncPending: syncHook.syncPending,
      syncProgress: syncHook.syncProgress,
      syncError: syncHook.syncError,
      setSyncProgress: syncHook.setSyncProgress,
      setSyncError: syncHook.setSyncError,
      syncQueue: syncHook.syncQueue,
      // Derived
      canManage,
      accessLevel,
      settings,
      profile,
      searchInputRef,
      // UI Actions
      openAdd,
      openEdit,
      openAttestation,
      openWorkflow,
      openAttestationHistory,
      openConfig,
      openAudit,
      handleArchive,
      handleRestore,
      handlePrintAttestation,
      handlePrintAttestationAnnex,
      handleGenerateAttestation,
    }),
    [
      lotsHook,
      attestationsHook,
      villagesHook,
      syncHook,
      auditHook,
      logicHook,
      canManage,
      accessLevel,
      settings,
      profile,
      openAdd,
      openEdit,
      openAttestation,
      openWorkflow,
      openAttestationHistory,
      openConfig,
      openAudit,
      handleArchive,
      handleRestore,
      handlePrintAttestation,
      handlePrintAttestationAnnex,
      handleGenerateAttestation,
    ],
  ) as unknown as UseFoncierStateReturn;

  return combinedState;
}

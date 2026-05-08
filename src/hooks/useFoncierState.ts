import { useState } from "react";
import type { FoncierLot } from "../types";
import type {
  AttestationForm,
  AuditRecord,
  AttestationHistoryItem,
  AttestationScan,
  FoncierConfigMap,
} from "../components/foncier/FoncierConstants";
import {
  emptyConfig,
  createEmptyForm,
  createAttestationForm,
} from "../components/foncier/FoncierConstants";

/**
 * Hook centralisé pour la gestion d'état du module foncier
 * Réduit le nombre de useState dans Foncier.tsx
 */
export function useFoncierState() {
  // ============ LOTS ============
  const [lots, setLots] = useState<FoncierLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [showArchived, setShowArchived] = useState(false);

  // ============ RECHERCHE & FILTRES ============
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [filterVillage, setFilterVillage] = useState("");

  // ============ MODAL LOT (CRUD) ============
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(() => createEmptyForm());
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // ============ ATTESTATION STATE ============
  const [attestationHasDeletedAt, setAttestationHasDeletedAt] = useState<boolean | null>(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [configForm, setConfigForm] = useState<FoncierConfigMap>(emptyConfig);
  const [configCache, setConfigCache] = useState<FoncierConfigMap>(
    emptyConfig,
  );
  const [configLoaded, setConfigLoaded] = useState(false);
  const [configLoadedVillage, setConfigLoadedVillage] = useState<string | null>(
    null,
  );
  const [configVillage, setConfigVillage] = useState("Sikensi");
  const [savingConfig, setSavingConfig] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  // ============ VILLAGES ============
  const [villageOptions, setVillageOptions] = useState<string[]>([
    "Sikensi",
    "Katadji",
  ]);
  const [villageOptionsLoaded, setVillageOptionsLoaded] = useState(false);
  const [villageStats, setVillageStats] = useState<
    Record<string, { total: number; count: number }>
  >({});
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // ============ MODAL ATTESTATION ============
  const [attestationModalOpen, setAttestationModalOpen] = useState(false);
  const [attestationLot, setAttestationLot] = useState<FoncierLot | null>(null);
  const [attestationForm, setAttestationForm] = useState<AttestationForm>(
    createAttestationForm(),
  );
  const [attestationSaving, setAttestationSaving] = useState(false);
  const [attestationError, setAttestationError] = useState<string | null>(null);

  // ============ WORKFLOW ============
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
  const [workflowSelectedLot, setWorkflowSelectedLot] = useState<string | null>(
    null,
  );

  // ============ HISTORIQUE ATTESTATIONS ============
  const [attestationHistoryOpen, setAttestationHistoryOpen] = useState(false);
  const [attestationHistoryLot, setAttestationHistoryLot] =
    useState<FoncierLot | null>(null);
  const [attestationHistoryRecords, setAttestationHistoryRecords] = useState<
    AttestationHistoryItem[]
  >([]);
  const [attestationHistoryLoading, setAttestationHistoryLoading] =
    useState(false);
  const [attestationHistoryError, setAttestationHistoryError] = useState<
    string | null
  >(null);
  const [attestationHistoryScans, setAttestationHistoryScans] = useState<
    Record<string, AttestationScan>
  >({});

  // ============ AUDIT ============
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPageSize] = useState(20);
  const [auditActionFilter, setAuditActionFilter] = useState("");
  const [auditError, setAuditError] = useState<string | null>(null);

  // ============ SYNC OFFLINE ============
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [syncPending, setSyncPending] = useState(0);
  const [syncProgress, setSyncProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // ============ MODAL TABS ============
  const [activeTab, setActiveTab] = useState<"info" | "proprietaire" | "admin">(
    "info",
  );

  // ============ MESSAGES ============
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageNotice, setPageNotice] = useState<string | null>(null);

  return {
    // Lots
    lots,
    setLots,
    loading,
    setLoading,
    totalCount,
    setTotalCount,
    page,
    setPage,
    pageSize,
    showArchived,
    setShowArchived,

    // Recherche
    search,
    setSearch,
    debouncedSearch,
    setDebouncedSearch,
    filterStatut,
    setFilterStatut,
    filterVillage,
    setFilterVillage,

    // Modal Lot
    modalOpen,
    setModalOpen,
    editingId,
    setEditingId,
    form,
    setForm,
    saving,
    setSaving,
    modalError,
    setModalError,

    // Modal Config
    configModalOpen,
    setConfigModalOpen,
    configForm,
    setConfigForm,
    configCache,
    setConfigCache,
    configLoaded,
    setConfigLoaded,
    configLoadedVillage,
    setConfigLoadedVillage,
    configVillage,
    setConfigVillage,
    savingConfig,
    setSavingConfig,
    configError,
    setConfigError,

    // Villages
    villageOptions,
    setVillageOptions,
    villageOptionsLoaded,
    setVillageOptionsLoaded,
    villageStats,
    setVillageStats,
    statsLoading,
    setStatsLoading,
    statsError,
    setStatsError,

    // Attestation
    attestationModalOpen,
    setAttestationModalOpen,
    attestationLot,
    setAttestationLot,
    attestationForm,
    setAttestationForm,
    attestationSaving,
    setAttestationSaving,
    attestationError,
    setAttestationError,
    attestationHasDeletedAt,
    setAttestationHasDeletedAt,

    // Workflow
    workflowModalOpen,
    setWorkflowModalOpen,
    workflowSelectedLot,
    setWorkflowSelectedLot,

    // Attestation History
    attestationHistoryOpen,
    setAttestationHistoryOpen,
    attestationHistoryLot,
    setAttestationHistoryLot,
    attestationHistoryRecords,
    setAttestationHistoryRecords,
    attestationHistoryLoading,
    setAttestationHistoryLoading,
    attestationHistoryError,
    setAttestationHistoryError,
    attestationHistoryScans,
    setAttestationHistoryScans,

    // Audit
    auditModalOpen,
    setAuditModalOpen,
    auditRecords,
    setAuditRecords,
    auditLoading,
    setAuditLoading,
    auditPage,
    setAuditPage,
    auditTotal,
    setAuditTotal,
    auditPageSize,
    auditActionFilter,
    setAuditActionFilter,
    auditError,
    setAuditError,

    // Sync
    isOnline,
    setIsOnline,
    syncing,
    setSyncing,
    syncPending,
    setSyncPending,
    syncProgress,
    setSyncProgress,
    syncError,
    setSyncError,

    // Tabs
    activeTab,
    setActiveTab,

    // Messages
    pageError,
    setPageError,
    pageNotice,
    setPageNotice,
  };
}

/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useRef } from "react";
import {
  Plus,
  Search,
  CreditCard as Edit,
  Printer,
  Map,
  Settings2,
  QrCode as QrIcon,
  FileText,
  History,
  Archive,
  RotateCcw,
  RefreshCcw,
  Wifi,
  WifiOff,
  CheckCircle,
  Files,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import {
  FoncierLot,
  FoncierAttestation,
  FoncierAttestationTemoin,
} from "../types";
import Modal from "../components/ui/Modal";
import Badge from "../components/ui/Badge";
import {
  VillageLogoUploader,
  VillageLogoDisplay,
} from "../components/foncier/VillageLogoUploader";
import WorkflowValidation from "../components/foncier/WorkflowValidation";
import {
  AttestationForm,
  AttestationTemoinForm,
  AttestationHistoryItem,
  AttestationScan,
  AuditRecord,
  AuditQueryRow,
  FoncierConfigKey,
  FoncierConfigMap,
  auditActions,
  configFields as _configFields,
  createAttestationForm,
  createEmptyForm,
  emptyConfig,
  getLocalDateInput,
  gpsBoundaryFields as _gpsBoundaryFields,
  isMissingColumnError,
  isRateLimitError,
  parseAttestationSnapshot,
  sleep,
} from "../components/foncier/FoncierConstants";
import { useSettings } from "../context/SettingsContext";
import { useAuth, resolveAccessLevel } from "../context/AuthContext";
import { useFoncierState } from "../hooks/useFoncierState";
import { useFoncierSync } from "../hooks/useFoncierSync";
import { useFoncierLogic } from "../hooks/useFoncierLogic";
import {
  generateFoncierReference,
  formatDateLong,
  formatMontant,
  isValidFrDate,
  parseNumberInput,
  cleanText,
  generateUUID,
  sha256Hex,
} from "../utils/reference";
import {
  printAttestationCoutumiere,
  printAttestationAnnex,
  printAuditReport,
} from "../utils/print";
import {
  logFoncierAudit,
  logFoncierAuditFromPayload,
} from "../lib/foncierAudit";
import {
  validateAttestationForm,
} from "../lib/foncierValidation";
import { buildAttestationRpcParams } from "../lib/foncierAttestation";
import {
  addQueueItem,
  countQueueItems,
  getCachedLots,
  getQueueItems,
  OFFLINE_STORAGE_FULL,
  removeQueueItem,
  upsertCachedLot,
  upsertCachedLots,
} from "../lib/foncierOffline";

const statutConfig: Record<
  string,
  { label: string; color: "green" | "gray" | "red" | "orange" | "blue" }
> = {
  actif: { label: "Actif", color: "green" },
  vendu: { label: "Vendu", color: "blue" },
  litige: { label: "Litige", color: "red" },
  reserve: { label: "Réservé", color: "orange" },
  annule: { label: "Annulé", color: "gray" },
};

const villages = [
  "Sikensi",
  "Katadji",
  "Élibou",
  "Sahuyé",
  "Gomon",
  "Bécédi",
  "Braffouéby",
  "Badasso",
];

const getAttestationStatusInfo = (record: AttestationHistoryItem | null) => {
  if (!record) return { label: "—", color: "gray" as const };
  if (record.deleted_at) return { label: "Archivé", color: "gray" as const };
  const statut = String(record.statut || "brouillon").toLowerCase();
  if (statut === "valide") return { label: "Validé", color: "green" as const };
  if (statut === "soumis") return { label: "Soumis", color: "blue" as const };
  if (statut === "revoque") return { label: "Révoqué", color: "red" as const };
  if (statut === "expire") return { label: "Expiré", color: "orange" as const };
  if (statut === "annule") return { label: "Annulé", color: "red" as const };
  return { label: record.statut || "Brouillon", color: "gray" as const };
};

const buildQrDataUrl = async (payload: string) => {
  const size = payload.length;
  const errorCorrectionLevel = size > 800 ? "M" : "H";
  const width = size > 800 ? 280 : 240;
  const margin = size > 800 ? 2 : 1;
  const QRCode = await import("qrcode");
  return QRCode.toDataURL(payload, { errorCorrectionLevel, width, margin });
};

type VerificationUrlParams = {
  reference?: string | null;
  control_number?: string | null;
  hash_sha256?: string | null;
  baseUrl?: string | null;
};

const buildAttestationVerificationUrl = ({
  reference,
  control_number,
  hash_sha256,
  baseUrl,
}: VerificationUrlParams) => {
  const origin =
    typeof window !== "undefined" && window.location
      ? window.location.origin
      : "http://localhost";
  const fallbackUrl = new URL("/verification-attestation", origin);

  let targetUrl = fallbackUrl;
  if (baseUrl && baseUrl.trim()) {
    try {
      targetUrl = new URL(baseUrl, origin);
    } catch {
      targetUrl = fallbackUrl;
    }
  }

  const ref = cleanText(reference || "");
  const control = cleanText(control_number || "");
  const hash = cleanText(hash_sha256 || "");

  if (ref) targetUrl.searchParams.set("ref", ref);
  if (control) targetUrl.searchParams.set("control", control);
  if (hash) targetUrl.searchParams.set("hash", hash);

  return targetUrl.toString();
};

/**
 * Construit l'objet AttestationCoutumiereData pour l'impression
 * Élimine la duplication entre les chemins offline/online
 */
const buildAttestationPrintData = (
  attestationData: {
    reference: string;
    numero_enregistrement?: string | null;
    date_etablissement?: string | null;
    original: boolean;
    statut?: string | null;
    mode_acquisition?: string | null;
    historique_possession?: string | null;
    domicile?: string | null;
    limites_nord?: string | null;
    limites_sud?: string | null;
    limites_est?: string | null;
    limites_ouest?: string | null;
    gps_lat?: number | null;
    gps_lng?: number | null;
    gps_precision?: number | null;
    gps_points?: Record<string, unknown> | null;
    registre_volume?: string | null;
    registre_page?: number | null;
    registre_ligne?: number | null;
    control_number?: string | null;
    qr_payload?: string | null;
    hash_sha256?: string | null;
    validation_agent_nom?: string | null;
    validation_chef_nom?: string | null;
    type?: string | null;
    cedant_nom?: string | null;
    cedant_prenom?: string | null;
    cedant_cni_numero?: string | null;
    cedant_telephone?: string | null;
    cedant_domicile?: string | null;
    chef_empreinte_url?: string | null;
    signatureUrl?: string | null;
    cachetUrl?: string | null;
  },
  lot: FoncierLot,
  config: FoncierConfigMap,
  form: AttestationForm,
  qrDataUrl?: string,
  gpsPointsResult?: Array<{ label: string; lat: number; lng: number }> | null,
  verificationUrl?: string,
) => {
  const gpsLat = form.gps_lat ? parseFloat(form.gps_lat) : null;
  const gpsLng = form.gps_lng ? parseFloat(form.gps_lng) : null;
  const gpsPrecision = form.gps_precision
    ? parseFloat(form.gps_precision)
    : null;
  const isCession = attestationData.type === "cession";
  const registrePage = form.registre_page
    ? parseInt(form.registre_page, 10)
    : null;
  const registreLigne = form.registre_ligne
    ? parseInt(form.registre_ligne, 10)
    : null;

  return {
    reference: attestationData.reference,
    numero_enregistrement:
      attestationData.numero_enregistrement || attestationData.reference,
    date_etablissement: formatDateLong(
      attestationData.date_etablissement || getLocalDateInput(),
    ),
    original: attestationData.original,
    draft: attestationData.statut !== "valide",
    region: config.region || lot.region || "REGION",
    departement: config.departement || lot.departement || "DEPARTEMENT",
    commune: config.commune || lot.commune || "COMMUNE",
    village: config.village || lot.village || "VILLAGE",
    quartier: lot.quartier || "",
    lotissement: lot.nom_lotissement || "",
    numero_lot: lot.numero_lot || "",
    superficie_m2: lot.superficie || 0,
    limites: {
      nord: form.limites_nord || "",
      sud: form.limites_sud || "",
      est: form.limites_est || "",
      ouest: form.limites_ouest || "",
    },
    coordonnees_gps:
      gpsLat != null && gpsLng != null
        ? { lat: gpsLat, lng: gpsLng, precision: gpsPrecision ?? undefined }
        : undefined,
    gps_points: gpsPointsResult || undefined,
    mode_acquisition: form.mode_acquisition || "",
    historique_possession: form.historique_possession || "",
    proprietaire_nom: lot.proprietaire_nom || "",
    proprietaire_prenom: lot.proprietaire_prenom || "",
    proprietaire_naissance_date: lot.proprietaire_naissance_date || "",
    proprietaire_naissance_lieu: lot.proprietaire_naissance_lieu || "",
    proprietaire_domicile: form.domicile || "",
    proprietaire_profession: lot.proprietaire_profession || "",
    proprietaire_cni_numero: lot.proprietaire_cni_numero || "",
    proprietaire_cni_date: lot.proprietaire_cni_date || "",
    proprietaire_cni_lieu: lot.proprietaire_cni_lieu || "",
    proprietaire_telephone: lot.proprietaire_telephone || "",
    cedant_nom: isCession ? form.cedant_nom || "" : "",
    cedant_prenom: isCession ? form.cedant_prenom || "" : "",
    cedant_cni_numero: isCession ? form.cedant_cni_numero || "" : "",
    cedant_telephone: isCession ? form.cedant_telephone || "" : "",
    cedant_domicile: isCession ? form.cedant_domicile || "" : "",
    temoins: (form.temoins || []).map((t) => ({
      nom: t.nom || "",
      prenom: t.prenom || "",
      profession: t.profession || "",
      telephone: t.telephone || "",
      cni: t.cni || "",
    })),
    chef_village: config.chef_village || lot.chef_village || "",
    lieu_signature: config.lieu_signature || lot.village || "",
    registre_volume: form.registre_volume || "",
    registre_page: isNaN(registrePage as number) ? null : registrePage,
    registre_ligne: isNaN(registreLigne as number) ? null : registreLigne,
    control_number: attestationData.control_number || "",
    verification_url:
      verificationUrl ||
      buildAttestationVerificationUrl({
        reference: attestationData.reference,
        control_number: attestationData.control_number || "",
        hash_sha256: attestationData.hash_sha256 || "",
      }),
    qrDataUrl,
    hash_sha256: attestationData.hash_sha256 || "",
    validation_agent_nom:
      attestationData.validation_agent_nom || form.validation_agent_nom || "",
    validation_chef_nom:
      attestationData.validation_chef_nom ||
      form.validation_chef_nom ||
      config.chef_village ||
      "",
    logoUrl: config.logo_url || "",
    village_logo_url: config.village_logo_url || "",
    signatureUrl: attestationData.signatureUrl || "",
    cachetUrl:
      attestationData.cachetUrl || attestationData.chef_empreinte_url || "",
    chef_nom: config.chef_village || lot.chef_village || "",
    attestation_type: attestationData.type || "standard",
    statut: attestationData.statut || "soumis",
    lot_statut: lot.statut,
    date_cession: isCession ? lot.date_cession || "" : "",
    prix_cession: isCession ? lot.prix_cession : undefined,
  };
};

const withBackoff = async <T extends { data: any; error?: any; count?: number }>(
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

const buildVillageStats = (rows: FoncierLot[]) => {
  const map: Record<string, { total: number; count: number }> = {};
  rows.forEach((lot) => {
    const key = lot.village || "—";
    if (!map[key]) {
      map[key] = { total: 0, count: 0 };
    }
    map[key].total += Number(lot.superficie || 0);
    map[key].count += 1;
  });
  return map;
};

export default function Foncier() {
  const { settings } = useSettings();
  const { profile } = useAuth();

  // Use the custom hooks
  const state = useFoncierState();
  const sync = useFoncierSync();

  // Extract state for easier access
  const {
    lots, setLots,
    loading, setLoading,
    search, setSearch,
    filterStatut, setFilterStatut,
    filterVillage, setFilterVillage,
    modalOpen, setModalOpen,
    configModalOpen, setConfigModalOpen,
    editingId, setEditingId,
    form, setForm,
    saving, setSaving,
    configForm, setConfigForm,
    configCache, setConfigCache,
    configLoaded, setConfigLoaded,
    configLoadedVillage, setConfigLoadedVillage,
    configVillage, setConfigVillage,
    villageOptions, setVillageOptions,
    villageOptionsLoaded, setVillageOptionsLoaded,
    villageStats, setVillageStats,
    statsLoading, setStatsLoading,
    statsError, setStatsError,
    savingConfig, setSavingConfig,
    activeTab, setActiveTab,
    pageError, setPageError,
    modalError, setModalError,
    configError, setConfigError,
    attestationModalOpen, setAttestationModalOpen,
    attestationLot, setAttestationLot,
    attestationForm, setAttestationForm,
    attestationSaving, setAttestationSaving,
    attestationError, setAttestationError,
    attestationHasDeletedAt, setAttestationHasDeletedAt,
    workflowModalOpen, setWorkflowModalOpen,
    workflowSelectedLot, setWorkflowSelectedLot,
    attestationHistoryOpen, setAttestationHistoryOpen,
    attestationHistoryLot, setAttestationHistoryLot,
    attestationHistoryRecords, setAttestationHistoryRecords,
    attestationHistoryLoading, setAttestationHistoryLoading,
    attestationHistoryError, setAttestationHistoryError,
    attestationHistoryScans, setAttestationHistoryScans,
    auditModalOpen, setAuditModalOpen,
    auditRecords, setAuditRecords,
    auditLoading, setAuditLoading,
    auditPage, setAuditPage,
    auditTotal, setAuditTotal,
    auditActionFilter, setAuditActionFilter,
    auditError, setAuditError,
    page, setPage,
    totalCount, setTotalCount,
    debouncedSearch, setDebouncedSearch,
    isOnline, setIsOnline,
    syncing, setSyncing,
    syncPending, setSyncPending,
    syncProgress, setSyncProgress,
    syncError, setSyncError,
    showArchived, setShowArchived,
    pageNotice, setPageNotice,
    pageSize,
    auditPageSize,
  } = state;

  const { deviceId } = sync;

  const searchInputRef = useRef<HTMLInputElement>(null);

  const logic = useFoncierLogic(sync.deviceId, profile, attestationHasDeletedAt, setAttestationHasDeletedAt);

  const accessLevel = resolveAccessLevel(profile?.role, profile?.access_level);
  const canManage =
    accessLevel === "admin" ||
    accessLevel === "gestionnaire" ||
    accessLevel === "gerant" ||
    accessLevel === "secretaire";

  useEffect(() => {
    void loadCachedLots();
    void refreshQueueCount();
    void fetchData();
    void loadConfig();
    void loadVillages();
    void fetchVillageStats();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      void syncQueue();
      void refreshCache();
      void loadVillages();
      void fetchVillageStats();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) {
        return;
      }
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
  }, [canManage]);

  useEffect(() => {
    setPage(1);
  }, [filterStatut, filterVillage, showArchived]);

  useEffect(() => {
    void fetchData();
  }, [
    debouncedSearch,
    filterStatut,
    filterVillage,
    showArchived,
    page,
    isOnline,
  ]);

  useEffect(() => {
    void fetchVillageStats();
  }, [showArchived, isOnline]);

  useEffect(() => {
    if (!auditModalOpen) return;
    void fetchAudit();
  }, [auditModalOpen, auditPage, auditActionFilter]);

  const applyLocalFilters = (rows: FoncierLot[]) => {
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
  };

  const loadCachedLots = async () => {
    const cached = await getCachedLots();
    const { paged, total } = applyLocalFilters(cached);
    setLots(paged);
    setTotalCount(total);
    setVillageStats(buildVillageStats(cached));
    setStatsError(null);
  };

  const refreshQueueCount = async () => {
    const count = await countQueueItems();
    setSyncPending(count);
  };

  const loadVillages = async () => {
    if (!isOnline) {
      // En mode hors-ligne, utiliser la liste statique de fallback
      setVillageOptions(villages);
      setVillageOptionsLoaded(false);
      return;
    }

    const { data, error } = await withBackoff(() =>
      supabase
        .from("foncier_villages")
        .select("name")
        .order("name", { ascending: true }),
    );

    if (error) {
      if (import.meta.env.DEV)
        console.error("loadVillages: échec du chargement", error);
      // Fallback sur la liste statique en cas d'erreur
      setVillageOptions(villages);
      setVillageOptionsLoaded(false);
    } else if (data) {
      setVillageOptions(data.map((row: { name: string }) => row.name));
      setVillageOptionsLoaded(true);
    }
  };

  const fetchVillageStats = async () => {
    if (!isOnline) {
      const cached = await getCachedLots();
      setVillageStats(buildVillageStats(cached));
      return;
    }
    setStatsLoading(true);
    setStatsError(null);
    const { data, error } = await withBackoff(() =>
      supabase.rpc("foncier_stats_by_village", {
        p_include_archived: showArchived,
      }),
    );
    if (error) {
      setStatsError("Impossible de charger les statistiques par village.");
    } else {
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
      setVillageStats(map);
    }
    setStatsLoading(false);
  };

  const refreshCache = async () => {
    if (!navigator.onLine) return;
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
        if (err?.code === OFFLINE_STORAGE_FULL) {
          setSyncError(
            "Stockage local plein: impossible de rafraîchir le cache hors-ligne.",
          );
        }
      }
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setPageError(null);
    setPageNotice(null);

    if (!isOnline) {
      await loadCachedLots();
      setLoading(false);
      return;
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
      if (import.meta.env.DEV)
        console.error("search_foncier_lots failed", error);
      // Essayer de charger depuis le cache en cas d'erreur
      setPageError("Impossible de charger les lots fonciers. Réessayez.");
      await loadCachedLots();
    } else {
      const lotsData = (data || []) as FoncierLot[];
      setLots(lotsData);
      // Le total_count est maintenant correctement retourné par la fonction
      const count =
        lotsData.length > 0 && lotsData[0].total_count !== undefined
          ? lotsData[0].total_count
          : 0;
      setTotalCount(count);
      if (lotsData.length > 0) {
        try {
          await upsertCachedLots(lotsData);
        } catch (err: any) {
          if (err?.code === OFFLINE_STORAGE_FULL) {
            setPageError(
              "Stockage local plein: cache hors-ligne non mis à jour.",
            );
          }
        }
      }
    }
    setLoading(false);
  };

  const fetchAudit = async () => {
    setAuditLoading(true);
    setAuditError(null);
    if (!isOnline) {
      setAuditError("Mode hors-ligne : journal d’audit indisponible.");
      setAuditRecords([]);
      setAuditTotal(0);
      setAuditLoading(false);
      return;
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
      setAuditError("Impossible de charger le journal d’audit.");
      setAuditRecords([]);
      setAuditTotal(0);
    } else {
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

      setAuditRecords(normalizedRows);
      setAuditTotal(count ?? 0);
    }
    setAuditLoading(false);
  };

  const syncQueue = async () => {
    if (!navigator.onLine || syncing) return;
    setSyncing(true);
    setSyncError(null);
    const queue = await getQueueItems();
    const conflicts: string[] = [];
    let syncErrors = 0;

    // Initialiser le progress indicator
    setSyncProgress({ current: 0, total: queue.length });

    const sorted = queue.sort((a, b) =>
      (a.client_updated_at || "").localeCompare(b.client_updated_at || ""),
    );
    for (let i = 0; i < sorted.length; i++) {
      const item = sorted[i];
      try {
        // Mettre à jour le progress
        setSyncProgress({ current: i + 1, total: sorted.length });
        if (item.op === "upsert_lot") {
          let payload = item.payload as Partial<FoncierLot> & { id: string };
          if (!payload.lotissement_id || !payload.ilot_id) {
            const { data, error } = await withBackoff(() =>
              supabase.rpc("ensure_foncier_hierarchy", {
                p_village: payload.village || "",
                p_lotissement: payload.nom_lotissement || "",
                p_ilot: payload.numero_ilot || "",
              }),
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
          const { data: server, error: fetchError } = await withBackoff(() =>
            supabase
              .from("foncier_lots")
              .select("id, updated_at, client_updated_at, row_version")
              .eq("id", payload.id)
              .maybeSingle(),
          );

          if (fetchError) {
            if (import.meta.env.DEV)
              console.error(
                "Failed to fetch server lot during sync",
                fetchError,
              );
            syncErrors++;
            continue;
          }

          const serverVersion = Number((server as any)?.row_version || 0);
          const clientVersion = Number((payload as any)?.row_version || 0);
          if (server && serverVersion > clientVersion) {
            // Conflit détecté - la version serveur est plus récente
            conflicts.push(
              `${payload.reference || payload.id} (version serveur plus récente)`,
            );
            if (import.meta.env.DEV)
              console.warn(
                `⚠️ Conflit de synchronisation détecté pour ${payload.reference}: version serveur (${serverVersion}) > version locale (${clientVersion})`,
              );
            // Ne pas supprimer - garder pour résolution manuelle
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
            // Conflit détecté - le serveur a été modifié plus récemment
            conflicts.push(
              `${payload.reference || payload.id} (modifié sur le serveur)`,
            );
            if (import.meta.env.DEV)
              console.warn(
                `⚠️ Conflit de synchronisation détecté pour ${payload.reference}: serveur modifié plus récemment`,
              );
            // Ne pas supprimer - garder pour résolution manuelle
            continue;
          }

          // Utiliser insert ou update selon si le lot existe
          let syncError;
          if (server) {
            const { error } = await withBackoff(() =>
              supabase
                .from("foncier_lots")
                .update(payload)
                .eq("id", payload.id)
                .eq("row_version", (payload as any)?.row_version ?? 1),
            );
            syncError = error;
          } else {
            const { error } = await withBackoff(() =>
              supabase.from("foncier_lots").insert(payload),
            );
            syncError = error;
          }

          if (syncError) {
            if (import.meta.env.DEV)
              console.error("Sync upsert_lot failed", syncError);
            // Ne pas supprimer de la queue en cas d'erreur, réessayer plus tard
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
          const { error } = await withBackoff(() =>
            supabase.rpc("soft_delete_foncier_lot", {
              p_lot_id: payload.id,
              p_reason: payload.deleted_reason || "archivage",
            }),
          );
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
          const { error } = await withBackoff(() =>
            supabase.rpc("restore_foncier_lot", { p_lot_id: payload.id }),
          );
          if (error) {
            if (import.meta.env.DEV)
              console.error("Sync restore_lot failed", error);
            syncErrors++;
            continue;
          }
          await removeQueueItem(item.id);
        }

        if (item.op === "audit_log") {
          const { error } = await withBackoff(() =>
            logFoncierAuditFromPayload(supabase, item.payload),
          );
          if (error) {
            if (import.meta.env.DEV)
              console.error("Sync audit_log failed", error);
            syncErrors++;
            continue;
          }
          await removeQueueItem(item.id);
        }

        if (item.op === "pending_attestation") {
          const {
            attestation,
            temoins,
            control_number,
            payloadToSign,
            desired_status,
          } = item.payload as {
            attestation: Partial<FoncierAttestation> & {
              id: string;
              lot_id: string;
              reference: string;
            };
            temoins: Array<Record<string, unknown>>;
            control_number: string;
            payloadToSign?: Record<string, unknown>;
            desired_status?: string;
          };

          const desiredStatus =
            desired_status || attestation.statut || "soumis";
          const payloadDraft = (payloadToSign ||
            (item.payload as any)?.payloadBase ||
            {}) as Record<string, unknown>;

          const { data: existingAtt, error: fetchAttError } = await withBackoff(
            () =>
              supabase
                .from("foncier_attestations")
                .select("id, signature_numerique, statut, version")
                .eq("id", attestation.id)
                .maybeSingle(),
          );

          if (fetchAttError) {
            if (import.meta.env.DEV)
              console.error("Sync fetch attestation failed", fetchAttError);
            syncErrors++;
            continue;
          }

          const { data: versionRows, error: versionError } = await withBackoff(
            () =>
              supabase
                .from("foncier_attestations")
                .select("version")
                .eq("lot_id", attestation.lot_id)
                .order("version", { ascending: false })
                .limit(1),
          );

          if (!versionError) {
            const maxVersion =
              (versionRows &&
                versionRows[0] &&
                (versionRows[0] as { version?: number }).version) ||
              0;
            const currentVersion = Number(attestation.version || 1);
            if (currentVersion <= maxVersion) {
              attestation.version = maxVersion + 1;
              payloadDraft.version = attestation.version;
            }
          }

          if (!attestation.signature_nonce) {
            attestation.signature_nonce = generateUUID();
          }
          if (!attestation.signature_issued_at) {
            attestation.signature_issued_at = new Date().toISOString();
          }
          payloadDraft.signature_nonce = attestation.signature_nonce;
          payloadDraft.signature_issued_at = attestation.signature_issued_at;

          if (desiredStatus === "valide") {
            payloadDraft.statut = "valide";
          }

          const payloadForHash = { ...payloadDraft };
          delete payloadForHash.hash_sha256;
          const hashSha256 = await sha256Hex(JSON.stringify(payloadForHash));
          const payloadSigned = { ...payloadForHash, hash_sha256: hashSha256 };
          const payloadSignedJson = JSON.stringify(payloadSigned);

          attestation.qr_payload = payloadSignedJson;
          attestation.hash_sha256 = hashSha256;
          attestation.control_number = control_number;
          if (desiredStatus !== "valide") {
            attestation.statut = desiredStatus;
          }

          if (!existingAtt) {
            const { error: insertError, data: insertData } = await withBackoff(
              () =>
                supabase
                  .from("foncier_attestations")
                  .insert(attestation)
                  .select()
                  .single(),
            );
            if (insertError) {
              if (import.meta.env.DEV)
                console.error("❌ Sync insert attestation failed", {
                  error: insertError,
                  message: insertError.message,
                  details: insertError.details,
                  hint: insertError.hint,
                  code: insertError.code,
                  attestationId: attestation.id,
                  lotId: attestation.lot_id,
                  reference: attestation.reference,
                });
              syncErrors++;
              continue;
            }
            if (import.meta.env.DEV)
              console.log("✅ Sync insert attestation success", insertData);
          } else {
            const { error: updateError, data: updateData } = await withBackoff(
              () =>
                supabase
                  .from("foncier_attestations")
                  .update({
                    qr_payload: payloadSignedJson,
                    hash_sha256: hashSha256,
                    control_number,
                    statut:
                      desiredStatus === "valide"
                        ? attestation.statut
                        : desiredStatus,
                    updated_at: new Date().toISOString(),
                    client_updated_at: new Date().toISOString(),
                    last_modified_device_id: deviceId,
                  })
                  .eq("id", attestation.id)
                  .select()
                  .single(),
            );
            if (updateError) {
              if (import.meta.env.DEV)
                console.error("❌ Sync update attestation payload failed", {
                  error: updateError,
                  message: updateError.message,
                  details: updateError.details,
                  hint: updateError.hint,
                  code: updateError.code,
                  attestationId: attestation.id,
                });
              syncErrors++;
              continue;
            }
            if (import.meta.env.DEV)
              console.log("✅ Sync update attestation success", updateData);
          }

          const { data: existingTemoins } = await withBackoff(() =>
            supabase
              .from("foncier_attestation_temoins")
              .select("id")
              .eq("attestation_id", attestation.id)
              .limit(1),
          );
          if (!existingTemoins || existingTemoins.length === 0) {
            const { error: temoinsError } = await withBackoff(() =>
              supabase.from("foncier_attestation_temoins").insert(temoins),
            );
            if (temoinsError) {
              if (import.meta.env.DEV)
                console.error("Sync insert temoins failed", temoinsError);
              syncErrors++;
              continue;
            }
          }

          const shouldSign = desiredStatus === "valide";
          if (
            shouldSign &&
            (!existingAtt?.signature_numerique ||
              existingAtt?.statut !== "valide")
          ) {
            const signature = await signAttestationPayload(
              attestation.id,
              payloadSigned,
            );
            if (!signature) {
              if (import.meta.env.DEV)
                console.error(
                  "Sync signature failed for attestation",
                  attestation.id,
                );
              syncErrors++;
              continue;
            }
            const { error: updateError } = await withBackoff(() =>
              supabase
                .from("foncier_attestations")
                .update({
                  qr_payload: payloadSignedJson,
                  signature_numerique: signature,
                  hash_sha256: hashSha256,
                  control_number,
                  statut: "valide",
                  signature_nonce: attestation.signature_nonce,
                  signature_issued_at: attestation.signature_issued_at,
                  updated_at: new Date().toISOString(),
                  client_updated_at: new Date().toISOString(),
                  last_modified_device_id: deviceId,
                })
                .eq("id", attestation.id),
            );
            if (updateError) {
              if (import.meta.env.DEV)
                console.error("Sync update attestation failed", updateError);
              syncErrors++;
              continue;
            }

            await withBackoff(() =>
              logFoncierAudit(supabase, {
                lotId: attestation.lot_id,
                action: "VALIDATION_CHEF",
                details: {
                  attestation_id: attestation.id,
                  reference: attestation.reference,
                },
              }),
            );
          }

          if (desiredStatus !== "valide") {
            await withBackoff(() =>
              logFoncierAudit(supabase, {
                lotId: attestation.lot_id,
                action: "SOUMISSION_CHEF",
                details: {
                  attestation_id: attestation.id,
                  reference: attestation.reference,
                },
              }),
            );
          }

          await removeQueueItem(item.id);
        }
      } catch (err) {
        if (import.meta.env.DEV)
          console.error("Sync error for item", item.id, err);
        syncErrors++;
        // Ne pas supprimer l'item en cas d'erreur
      }
    }

    if (conflicts.length > 0) {
      setSyncError(
        `Conflits détectés : ${conflicts.length} lot(s). Les versions serveur ont été conservées.`,
      );
    } else if (syncErrors > 0) {
      setSyncError(
        `${syncErrors} erreur(s) de synchronisation. Les items en erreur seront réessayés.`,
      );
    }
    await refreshQueueCount();
    await refreshCache();
    setSyncProgress(null); // Reset progress indicator
    setSyncing(false);
  };

  const openAudit = () => {
    if (!canManage) {
      setPageError("Accès refusé. Vous ne pouvez pas consulter l'audit.");
      return;
    }
    setAuditActionFilter("");
    setAuditPage(1);
    setAuditError(null);
    setAuditModalOpen(true);
  };

  const openWorkflow = (lotId: string) => {
    setWorkflowSelectedLot(lotId);
    setWorkflowModalOpen(true);
  };

  const fetchAttestationScans = async (attestationIds: string[]) => {
    if (!attestationIds.length) {
      setAttestationHistoryScans({});
      return;
    }
    const { data, error } = await withBackoff(() =>
      supabase
        .from("media_usage")
        .select("entity_id, media_files!inner(url, original_name)")
        .eq("entity_type", "foncier_attestation")
        .eq("usage_type", "attestation_scan")
        .in("entity_id", attestationIds),
    );
    if (error) {
      setAttestationHistoryScans({});
      return;
    }
    const map: Record<string, AttestationScan> = {};
    (data || []).forEach((row: any) => {
      const media = row?.media_files;
      if (row?.entity_id && media?.url) {
        map[row.entity_id] = {
          url: media.url,
          original_name: media.original_name || "Scan",
        };
      }
    });
    setAttestationHistoryScans(map);
  };

  const openAttestationHistory = async (lot: FoncierLot) => {
    if (!canManage) {
      setPageError("Accès refusé. Vous ne pouvez pas consulter l'historique.");
      return;
    }
    if (!isOnline) {
      setPageError("Connexion requise pour consulter l’historique.");
      return;
    }
    setAttestationHistoryLot(lot);
    setAttestationHistoryOpen(true);
    setAttestationHistoryLoading(true);
    setAttestationHistoryError(null);

    const selectWithDeleted =
      "id, reference, version, statut, created_at, date_etablissement, deleted_at, validation_chef_date";
    const selectFallback =
      "id, reference, version, statut, created_at, date_etablissement, validation_chef_date";

    const runQuery = (includeDeletedAt: boolean) =>
      withBackoff(() =>
        supabase
          .from("foncier_attestations")
          .select(includeDeletedAt ? selectWithDeleted : selectFallback)
          .eq("lot_id", lot.id)
          .order("created_at", { ascending: false }),
      );

    const includeDeletedAt = attestationHasDeletedAt !== false;
    let { data, error } = await runQuery(includeDeletedAt);

    if (error && isMissingColumnError(error, "deleted_at")) {
      setAttestationHasDeletedAt(false);
      ({ data, error } = await runQuery(false));
    } else if (!error && includeDeletedAt && attestationHasDeletedAt === null) {
      setAttestationHasDeletedAt(true);
    }

    if (error) {
      setAttestationHistoryError(
        "Impossible de charger l’historique des attestations.",
      );
      setAttestationHistoryLoading(false);
      return;
    }

    const records = (data as AttestationHistoryItem[]) || [];
    setAttestationHistoryRecords(records);
    await fetchAttestationScans(records.map((r) => r.id));
    setAttestationHistoryLoading(false);
  };

  const escapeCsv = (value: string) => {
    const safe = value.replace(/"/g, '""');
    return /[;"\n]/.test(safe) ? `"${safe}"` : safe;
  };

  const handleAuditExport = () => {
    if (!auditRecords.length) return;
    const header = [
      "Date",
      "Action",
      "Utilisateur",
      "Référence",
      "Lot",
      "Village",
      "Détails",
    ];
    const lines = auditRecords.map((row) => {
      const lot = Array.isArray(row.foncier_lots)
        ? row.foncier_lots[0]
        : row.foncier_lots;
      return [
        formatDateLong(row.date_action),
        row.action,
        row.utilisateur_nom || "",
        lot?.reference || "",
        lot?.numero_lot || "",
        lot?.village || "",
        JSON.stringify(row.details || {}),
      ]
        .map(escapeCsv)
        .join(";");
    });
    const csv = [header.join(";"), ...lines].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-foncier-${getLocalDateInput()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAuditPrint = () => {
    if (!auditRecords.length) return;
    printAuditReport({
      title: "Journal d'audit foncier",
      generated_at: formatDateLong(getLocalDateInput()),
      rows: auditRecords.map((row) => {
        const lot = Array.isArray(row.foncier_lots)
          ? row.foncier_lots[0]
          : row.foncier_lots;
        return {
          date_action: formatDateLong(row.date_action),
          action: row.action,
          utilisateur_nom: row.utilisateur_nom || "",
          parcelle_reference: lot?.reference || "",
          village: lot?.village || "",
          details: JSON.stringify(row.details || {}),
        };
      }),
      logoUrl: settings.logo_url,
    });
  };

  const loadConfig = async (villageName: string = configVillage) => {
    setConfigError(null);
    if (!isOnline) {
      setConfigError("Mode hors-ligne : configuration non actualisée.");
      return configCache;
    }
    const { data, error } = await withBackoff(() =>
      supabase
        .from("foncier_village_config")
        .select("key, value")
        .eq("village", villageName),
    );
    if (error) {
      setConfigError("Impossible de charger la configuration du village.");
      return null;
    }
    const map: FoncierConfigMap = { ...emptyConfig, village: villageName };
    (data || []).forEach((r: { key: string; value: string | null }) => {
      if (Object.prototype.hasOwnProperty.call(map, r.key)) {
        map[r.key as FoncierConfigKey] = r.value || "";
      }
    });
    setConfigCache(map);
    setConfigLoaded(true);
    setConfigLoadedVillage(villageName);
    setConfigVillage(villageName);
    return map;
  };

  const ensureConfigLoaded = async (villageName: string = configVillage) => {
    if (!isOnline) return configCache;
    if (configLoaded && configLoadedVillage === villageName) return configCache;
    const loaded = await loadConfig(villageName);
    return loaded || configCache;
  };

  const fetchLatestAttestationForLot = async (
    lotId: string,
    options?: { includeArchived?: boolean; select?: string },
  ) => {
    const select = options?.select || "*, foncier_attestation_temoins(*)";
    const includeArchived = options?.includeArchived ?? false;

    const runQuery = (supportsDeletedAt: boolean) =>
      withBackoff(() => {
        let query = supabase
          .from("foncier_attestations")
          .select(select)
          .eq("lot_id", lotId)
          .order("created_at", { ascending: false })
          .limit(1);
        if (!includeArchived && supportsDeletedAt) {
          query = query.is("deleted_at", null);
        }
        return query.maybeSingle();
      });

    const supportsDeletedAt = attestationHasDeletedAt !== false;
    let result = await runQuery(supportsDeletedAt);

    if (result.error && isMissingColumnError(result.error, "deleted_at")) {
      setAttestationHasDeletedAt(false);
      result = await runQuery(false);
    } else if (
      !result.error &&
      supportsDeletedAt &&
      attestationHasDeletedAt === null
    ) {
      setAttestationHasDeletedAt(true);
    }

    return result;
  };

  const openAdd = async () => {
    if (!canManage) {
      setPageError("Accès refusé. Vous ne pouvez pas créer de lot foncier.");
      return;
    }
    const config = await ensureConfigLoaded(configVillage);
    const baseForm = createEmptyForm();
    setForm({
      ...baseForm,
      reference: generateFoncierReference(),
      village: config.village || configVillage,
      commune: config.commune,
      departement: config.departement,
      region: config.region,
      chef_village: config.chef_village,
      arrete_prefectoral: config.arrete_prefectoral,
    });
    setEditingId(null);
    setModalError(null);
    setActiveTab("info");
    setModalOpen(true);
  };

  const openEdit = (lot: FoncierLot) => {
    if (!canManage) {
      setPageError(
        "Accès refusé. Vous ne pouvez pas modifier les lots fonciers.",
      );
      return;
    }
    if (lot.deleted_at) {
      setPageError("Ce lot est archivé. Restaurez-le avant modification.");
      return;
    }
    setForm({
      reference: lot.reference,
      numero_lot: lot.numero_lot,
      numero_ilot: lot.numero_ilot,
      nom_lotissement: lot.nom_lotissement,
      quartier: lot.quartier,
      village: lot.village,
      commune: lot.commune,
      departement: lot.departement,
      region: lot.region,
      superficie: String(lot.superficie),
      code_barre: "",
      proprietaire_nom: lot.proprietaire_nom,
      proprietaire_prenom: lot.proprietaire_prenom,
      proprietaire_naissance_date: lot.proprietaire_naissance_date,
      proprietaire_naissance_lieu: lot.proprietaire_naissance_lieu,
      proprietaire_cni_numero: lot.proprietaire_cni_numero,
      proprietaire_cni_date: lot.proprietaire_cni_date,
      proprietaire_cni_lieu: lot.proprietaire_cni_lieu,
      proprietaire_profession: lot.proprietaire_profession,
      proprietaire_telephone: lot.proprietaire_telephone,
      chef_village: lot.chef_village,
      arrete_prefectoral: lot.arrete_prefectoral,
      arrete_date: lot.arrete_date,
      statut: lot.statut,
      date_cession: lot.date_cession || getLocalDateInput(),
      prix_cession: String(lot.prix_cession),
      notes: lot.notes,
    });
    setEditingId(lot.id);
    setModalError(null);
    setActiveTab("info");
    setModalOpen(true);
  };

  const openConfig = async () => {
    if (!canManage) {
      setPageError(
        "Accès refusé. Vous ne pouvez pas modifier la configuration.",
      );
      return;
    }
    const config = await ensureConfigLoaded(configVillage);
    setConfigForm({ ...config });
    setConfigError(null);
    setConfigModalOpen(true);
  };

  const handleConfigVillageChange = async (villageName: string) => {
    setConfigVillage(villageName);
    const config = await ensureConfigLoaded(villageName);
    setConfigForm({ ...config });
  };

  const openAttestation = async (lot: FoncierLot) => {
    if (!canManage) {
      setPageError("Accès refusé. Vous ne pouvez pas générer d’attestation.");
      return;
    }
    if (lot.deleted_at) {
      setPageError("Lot archivé. Restaurez-le avant génération.");
      return;
    }
    const targetVillage = lot.village || configVillage;
    const config = await ensureConfigLoaded(targetVillage);
    setAttestationLot(lot);
    setAttestationForm({
      ...createAttestationForm(),
      attestation_type: lot.statut === "vendu" ? "cession" : "standard",
      validation_agent_nom: profile?.full_name || "",
      validation_chef_nom: config.nom_chef_signe || config.chef_village || "",
    });
    setAttestationError(null);
    setAttestationModalOpen(true);
  };

  const signAttestationPayload = async (
    attestationId: string,
    payload: Record<string, unknown>,
  ) => {
    try {
      const { data, error } = await withBackoff(() =>
        supabase.functions.invoke("attestation-sign", {
          body: {
            attestation_id: attestationId,
            payload: JSON.stringify(payload),
          },
        }),
      );
      if (error) return "";
      return (data as { signature?: string })?.signature || "";
    } catch {
      return "";
    }
  };

  const updateTemoin = (
    index: number,
    key: keyof AttestationTemoinForm,
    value: string,
  ) => {
    setAttestationForm((prev) => ({
      ...prev,
      temoins: prev.temoins.map((temoin, idx) =>
        idx === index ? { ...temoin, [key]: value } : temoin,
      ),
    }));
  };

  // PHASE 1 - Fonction 1: Validation des prérequis de l'attestation
  const validateAttestationPrerequisites = async (
    lot: FoncierLot,
    form: AttestationForm,
    isOnline: boolean,
  ) => {
    const config = await ensureConfigLoaded(lot.village || configVillage);
    const attestationValidation = validateAttestationForm(form);
    if (!attestationValidation.success && attestationValidation.errors) {
      const firstError = Object.values(attestationValidation.errors)[0];
      return { success: false, error: firstError, config };
    }

    const parsedAttestation = attestationValidation.parsedData;
    if (!parsedAttestation) {
      return {
        success: false,
        error: "Validation de l'attestation impossible.",
        config,
      };
    }

    const attestationType =
      form.attestation_type === "cession" ? "cession" : "standard";
    const isCessionAttestation = attestationType === "cession";

    if (isCessionAttestation && !isOnline) {
      return {
        success: false,
        error: "Connexion requise pour réémettre une attestation de cession.",
        config,
      };
    }

    // Validation OBLIGATOIRE pour les cessions
    if (isCessionAttestation) {
      const cedantNom = cleanText(form.cedant_nom || "");
      const cedantPrenom = cleanText(form.cedant_prenom || "");
      const cedantCni = cleanText(form.cedant_cni_numero || "");
      if (!cedantNom || !cedantPrenom) {
        return {
          success: false,
          error: "Pour une cession, les nom et prénoms du cédant sont requis.",
          config,
        };
      }
      if (!cedantCni) {
        return {
          success: false,
          error: "Pour une cession, la CNI du cédant est requise.",
          config,
        };
      }
    }

    if (!isOnline) {
      return {
        success: false,
        error:
          "Connexion requise : la référence officielle, le numéro de contrôle et le hash sont générés côté serveur dans une transaction sécurisée.",
        config,
      };
    }

    // Validation des champs numériques du registre
    const registrePage = parseNumberInput(form.registre_page);
    const registreLigne = parseNumberInput(form.registre_ligne);

    if (form.registre_page.trim() && registrePage === null) {
      return {
        success: false,
        error: "La page du registre est invalide.",
        config,
      };
    }
    if (form.registre_ligne.trim() && registreLigne === null) {
      return {
        success: false,
        error: "La ligne du registre est invalide.",
        config,
      };
    }

    return {
      success: true,
      config,
      parsedAttestation,
      attestationType,
      isCessionAttestation,
      registrePage,
      registreLigne,
    };
  };

  // PHASE 1 - Fonction 2: Création de l'enregistrement d'attestation
  const createAttestationRecord = async (
    lot: FoncierLot,
    parsedAttestation: any,
    config: FoncierConfigMap,
    attestationType: string,
    isCessionAttestation: boolean,
  ) => {
    let baseAttestation: Pick<
      FoncierAttestation,
      | "id"
      | "reference"
      | "version"
      | "numero_enregistrement"
      | "control_number"
      | "statut"
    > | null = null;

    if (isCessionAttestation) {
      const { data, error } = await fetchLatestAttestationForLot(lot.id, {
        includeArchived: false,
        select:
          "id, reference, version, numero_enregistrement, control_number, statut",
      });
      if (error) {
        return {
          success: false,
          error: "Impossible de charger l'attestation précédente.",
        };
      }
      if (!data) {
        return {
          success: false,
          error: "Aucune attestation active à réémettre pour cette cession.",
        };
      }
      baseAttestation = data as Pick<
        FoncierAttestation,
        | "id"
        | "reference"
        | "version"
        | "numero_enregistrement"
        | "control_number"
        | "statut"
      >;
    }

    const signatureNonce = generateUUID();
    const signatureIssuedAt = new Date().toISOString();
    const agentName = cleanText(
      attestationForm.validation_agent_nom || profile?.full_name || "",
    );
    const chefName = cleanText(
      attestationForm.validation_chef_nom ||
        config.nom_chef_signe ||
        config.chef_village ||
        "",
    );

    const attestationPayload = buildAttestationRpcParams({
      attestationForm: parsedAttestation,
      attestationLot: lot,
      signatureNonce,
      signatureIssuedAt,
      deviceId,
      baseAttestationId: baseAttestation?.id ?? null,
      isCession: isCessionAttestation,
    });

    const { data: attestationRows, error: attestationError } =
      await withBackoff(() =>
        supabase.rpc("create_foncier_attestation_atomic", attestationPayload),
      );

    const createdAttestation = (
      Array.isArray(attestationRows) ? attestationRows[0] : attestationRows
    ) as Pick<
      FoncierAttestation,
      | "id"
      | "lot_id"
      | "reference"
      | "version"
      | "numero_enregistrement"
      | "qr_payload"
      | "hash_sha256"
      | "control_number"
      | "statut"
      | "date_etablissement"
      | "created_at"
    > | null;

    if (attestationError || !createdAttestation) {
      if (import.meta.env.DEV)
        console.error("❌ Attestation atomic creation failed", {
          error: attestationError,
          message: attestationError?.message,
          details: attestationError?.details,
          hint: attestationError?.hint,
          code: attestationError?.code,
        });
      return {
        success: false,
        error:
          attestationError?.message || "Création de l'attestation impossible.",
      };
    }

    // Audit logs pour création
    await withBackoff(() =>
      logFoncierAudit(supabase, {
        lotId: lot.id,
        action: "SOUMISSION_CHEF",
        details: {
          attestation_id: createdAttestation.id,
          reference: createdAttestation.reference,
        },
      }),
    );

    if (isCessionAttestation && baseAttestation) {
      await withBackoff(() =>
        logFoncierAudit(supabase, {
          lotId: lot.id,
          action: "ARCHIVAGE_ATTESTATION",
          details: {
            attestation_id: baseAttestation.id,
            reference: baseAttestation.reference,
          },
        }),
      );

      await withBackoff(() =>
        logFoncierAudit(supabase, {
          lotId: lot.id,
          action: "REEMISSION_CESSION",
          details: {
            attestation_id: createdAttestation.id,
            reference: createdAttestation.reference,
            archived_attestation_id: baseAttestation.id,
          },
        }),
      );
    }

    return {
      success: true,
      createdAttestation,
      baseAttestation,
      agentName,
      chefName,
      attestationType,
    };
  };

  // PHASE 1 - Fonction 3: Signature et génération du QR code
  const signAndGenerateQr = async (createdAttestation: any) => {
    const qrVerificationUrl = buildAttestationVerificationUrl({
      reference: createdAttestation.reference,
      control_number: createdAttestation.control_number || "",
      hash_sha256: createdAttestation.hash_sha256 || "",
    });
    const qrDataUrl = await buildQrDataUrl(qrVerificationUrl);

    let finalStatus = createdAttestation.statut || "soumis";
    const payloadToSign =
      parseAttestationSnapshot(createdAttestation.qr_payload) || {};

    try {
      const signature = await signAttestationPayload(
        createdAttestation.id,
        payloadToSign,
      );
      if (signature) {
        finalStatus = "valide";
      } else {
        setPageNotice(
          "Attestation créée. Signature numérique non appliquée, le document reste soumis.",
        );
      }
    } catch (error) {
      if (import.meta.env.DEV) console.warn("⚠️ Signature error:", error);
      setPageNotice(
        "Attestation créée. Signature numérique en attente ou indisponible.",
      );
    }

    return {
      qrDataUrl,
      qrVerificationUrl,
      finalStatus,
      payloadToSign,
    };
  };

  // PHASE 1 - Fonction 4: Impression et audit final
  const printAndAuditAttestation = async (
    createdAttestation: any,
    lot: FoncierLot,
    config: FoncierConfigMap,
    form: AttestationForm,
    qrDataUrl: string,
    qrVerificationUrl: string,
    finalStatus: string,
    attestationType: string,
    agentName: string,
    chefName: string,
  ) => {
    const onlinePrintData = buildAttestationPrintData(
      {
        ...createdAttestation,
        original: form.original,
        statut: finalStatus,
        type: attestationType,
        validation_agent_nom: agentName,
        validation_chef_nom: chefName,
      },
      lot,
      config,
      form,
      qrDataUrl,
      undefined, // gpsPointsResult
      qrVerificationUrl,
    );

    printAttestationCoutumiere(onlinePrintData);

    // Attempt to attach metadata to DB via RPC (background script may also do this)
    try {
      const pdfMeta = {
        attestation_id: createdAttestation.id,
        pdf_path: undefined,
        hash_sha256: createdAttestation.hash_sha256 || undefined,
        verify_url: undefined,
        printed_by: profile?.id || null,
      };
      // Call client-side RPC (requires service role; best-effort)
      await withBackoff(() =>
        supabase.rpc("attach_foncier_attestation_pdf_metadata", {
          p_attestation_id: pdfMeta.attestation_id,
          p_hash_sha256: pdfMeta.hash_sha256,
          p_verify_url: pdfMeta.verify_url,
          p_pdf_path: pdfMeta.pdf_path,
          p_pdf_generated_at: new Date().toISOString(),
          p_printed_by: pdfMeta.printed_by,
        }),
      );
    } catch {
      // ignore — server script will reconcile metadata if RPC not available
    }

    const { error: printAuditError } = await withBackoff(() =>
      logFoncierAudit(supabase, {
        lotId: lot.id,
        action: "IMPRESSION",
        details: {
          attestation_id: createdAttestation.id,
          reference: createdAttestation.reference,
        },
      }),
    );

    if (printAuditError) {
      try {
        await addQueueItem({
          id: generateUUID(),
          op: "audit_log",
          payload: {
            lot_id: lot.id,
            action: "IMPRESSION",
            details: {
              attestation_id: createdAttestation.id,
              reference: createdAttestation.reference,
            },
          },
          client_updated_at: new Date().toISOString(),
        });
        await refreshQueueCount();
        setPageNotice(
          "Impression OK. Journalisation en attente de synchronisation.",
        );
      } catch {
        setPageNotice("Impression OK, mais journalisation impossible.");
      }
    }
  };

  const handleGenerateAttestation = async () => {
    if (!attestationLot) return;
    setAttestationError(null);

    // PHASE 1 - Étape 1: Validation des prérequis
    const validationResult = await validateAttestationPrerequisites(
      attestationLot,
      attestationForm,
      isOnline,
    );
    if (!validationResult.success) {
      setAttestationError(validationResult.error || "Erreur de validation inconnue");
      return;
    }

    const { config, parsedAttestation, attestationType, isCessionAttestation } =
      validationResult;

    setAttestationSaving(true);

    try {
      // PHASE 1 - Étape 2: Création de l'enregistrement
      const creationResult = await createAttestationRecord(
        attestationLot,
        parsedAttestation,
        config,
        attestationType!,
        isCessionAttestation!,
      );

      if (!creationResult.success) {
        setAttestationSaving(false);
        setAttestationError(creationResult.error || "Erreur de création inconnue");
        return;
      }

      const { createdAttestation, agentName, chefName } = creationResult;

      // PHASE 1 - Étape 3: Signature et génération QR
      const qrResult = await signAndGenerateQr(createdAttestation);

      // PHASE 1 - Étape 4: Impression et audit
      await printAndAuditAttestation(
        createdAttestation,
        attestationLot,
        config,
        attestationForm,
        qrResult.qrDataUrl,
        qrResult.qrVerificationUrl,
        qrResult.finalStatus,
        attestationType!,
        agentName!,
        chefName!,
      );

      // Nettoyage final
      setAttestationSaving(false);
      setAttestationModalOpen(false);
      setAttestationLot(null);
      setAttestationForm(createAttestationForm());
    } catch (error) {
      setAttestationSaving(false);
      setAttestationError(
        "Une erreur inattendue s'est produite lors de la génération de l'attestation.",
      );
      if (import.meta.env.DEV)
        console.error("Attestation generation error:", error);
    }
  };
  const handleSave = async () => {
    setModalError(null);
    if (!canManage) {
      setModalError(
        "Accès refusé. Vous ne pouvez pas modifier les lots fonciers.",
      );
      return;
    }

    setSaving(true);
    const result = await logic.saveLot(form, editingId, lots, isOnline);

    if (!result.success) {
      setModalError(result.error || "Erreur inconnue");
      setSaving(false);
      return;
    }

    if (result.offline) {
      setPageNotice(result.message || "Lot enregistré hors-ligne.");
      await sync.refreshQueueCount();
      await sync.loadCachedLots();
    } else {
      setPageNotice(result.message || "Lot sauvegardé.");
      await sync.refreshCache(isOnline);
      await sync.fetchData(debouncedSearch, filterVillage, filterStatut, showArchived, page, 20, isOnline);
    }

    setSaving(false);
    setModalOpen(false);
    setForm(logic.createEmptyForm());
    setEditingId(null);
  };




  const handleArchive = async (lot: FoncierLot) => {
    if (!canManage) {
      setPageError(
        "Accès refusé. Vous ne pouvez pas archiver les lots fonciers.",
      );
      return;
    }
    if (!confirm("Archiver ce lot foncier ?")) return;
    setPageError(null);
    const nowIso = new Date().toISOString();

    if (!isOnline) {
      const payload = {
        ...lot,
        deleted_at: nowIso,
        deleted_reason: "archivage",
        client_updated_at: nowIso,
      };
      try {
        await upsertCachedLot(payload as FoncierLot);
        await addQueueItem({
          id: generateUUID(),
          op: "soft_delete_lot",
          payload: { id: lot.id, deleted_reason: "archivage" },
          client_updated_at: nowIso,
        });
        await refreshQueueCount();
        setPageNotice("Lot archivé hors-ligne. Synchronisation en attente.");
        await loadCachedLots();
        return;
      } catch (err: any) {
        setPageError(
          err?.code === OFFLINE_STORAGE_FULL
            ? "Stockage local plein. Archivage hors-ligne impossible."
            : "Archivage hors-ligne impossible.",
        );
        return;
      }
    }

    const { error } = await withBackoff(() =>
      supabase.rpc("soft_delete_foncier_lot", {
        p_lot_id: lot.id,
        p_reason: "archivage",
      }),
    );
    if (error) {
      setPageError("Archivage impossible. Vérifiez vos droits ou réessayez.");
      return;
    }
    await refreshCache();
    void fetchData();
  };

  const handleRestore = async (lot: FoncierLot) => {
    if (!canManage) {
      setPageError(
        "Accès refusé. Vous ne pouvez pas restaurer les lots fonciers.",
      );
      return;
    }
    if (!confirm("Restaurer ce lot foncier ?")) return;
    setPageError(null);
    const nowIso = new Date().toISOString();

    if (!isOnline) {
      const payload = {
        ...lot,
        deleted_at: null,
        deleted_reason: null,
        client_updated_at: nowIso,
      };
      try {
        await upsertCachedLot(payload as FoncierLot);
        await addQueueItem({
          id: generateUUID(),
          op: "restore_lot",
          payload: { id: lot.id },
          client_updated_at: nowIso,
        });
        await refreshQueueCount();
        setPageNotice("Lot restauré hors-ligne. Synchronisation en attente.");
        await loadCachedLots();
        return;
      } catch (err: any) {
        setPageError(
          err?.code === OFFLINE_STORAGE_FULL
            ? "Stockage local plein. Restauration hors-ligne impossible."
            : "Restauration hors-ligne impossible.",
        );
        return;
      }
    }

    const { error } = await withBackoff(() =>
      supabase.rpc("restore_foncier_lot", { p_lot_id: lot.id }),
    );
    if (error) {
      setPageError(
        "Restauration impossible. Vérifiez vos droits ou réessayez.",
      );
      return;
    }
    await refreshCache();
    void fetchData();
  };

  const handleSaveConfig = async () => {
    if (!canManage) {
      setConfigError(
        "Accès refusé. Vous ne pouvez pas modifier la configuration.",
      );
      return;
    }
    if (!isOnline) {
      setConfigError("Connexion requise pour sauvegarder la configuration.");
      return;
    }
    setSavingConfig(true);
    setConfigError(null);
    const payload = (
      Object.entries(configForm) as [FoncierConfigKey, string][]
    ).map(([key, value]) => ({
      village: configVillage,
      key,
      value,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await withBackoff(() =>
      supabase
        .from("foncier_village_config")
        .upsert(payload, { onConflict: "village,key" }),
    );
    if (error) {
      setSavingConfig(false);
      setConfigError(
        "Sauvegarde impossible. Vérifiez vos droits ou réessayez.",
      );
      return;
    }
    setSavingConfig(false);
    setConfigModalOpen(false);
    setConfigCache(configForm);
    setConfigLoaded(true);
    setConfigLoadedVillage(configVillage);
  };

  const handlePrintAttestation = async (lot: FoncierLot) => {
    const config = await ensureConfigLoaded(lot.village || configVillage);

    if (!isOnline) {
      setPageError(
        "Hors ligne : utilisez le bouton Attestation pour générer un brouillon.",
      );
      await openAttestation(lot);
      return;
    }

    const { data, error } = await fetchLatestAttestationForLot(lot.id, {
      includeArchived: false,
      select: "*, foncier_attestation_temoins(*)",
    });

    if (error) {
      setPageError("Impossible de charger l’attestation moderne. Réessayez.");
      return;
    }

    if (!data) {
      setPageNotice("Aucune attestation moderne trouvée. Veuillez la créer.");
      await openAttestation(lot);
      return;
    }

    const attestation = data as FoncierAttestation & {
      foncier_attestation_temoins?: FoncierAttestationTemoin[];
    };
    const temoinsPrint = (attestation.foncier_attestation_temoins || []).map(
      (t) => ({
        nom: t.nom,
        prenom: t.prenom,
        profession: t.profession || "",
        telephone: t.telephone || "",
        cni: t.cni || "",
      }),
    );

    const snapshot = parseAttestationSnapshot(attestation.qr_payload);
    const verificationUrl = buildAttestationVerificationUrl({
      reference: attestation.reference,
      control_number: attestation.control_number || "",
      hash_sha256: attestation.hash_sha256 || "",
      baseUrl: String(snapshot?.verification_url || ""),
    });
    const qrDataUrl = await buildQrDataUrl(verificationUrl);
    const snapVillage = (snapshot?.village as Record<string, any>) || {};
    const snapParcelle = (snapshot?.parcelle as Record<string, any>) || {};
    const snapLimites = (snapParcelle.limites as Record<string, any>) || {};
    const snapGps =
      (snapParcelle.coordonnees_gps as {
        lat?: number;
        lng?: number;
        precision?: number;
      } | null) || null;
    const snapGpsPoints = Array.isArray(snapParcelle.gps_points)
      ? snapParcelle.gps_points
      : null;
    const snapTitulaire = (snapshot?.titulaire as Record<string, any>) || {};
    const snapAcquisition =
      (snapshot?.acquisition as Record<string, any>) || {};
    const snapAutorites = (snapshot?.autorites as Record<string, any>) || {};
    const snapValidation = (snapshot?.validation as Record<string, any>) || {};
    const snapRegistre = (snapshot?.registre as Record<string, any>) || {};
    const snapCession = (snapshot?.cession as Record<string, any>) || {};
    const snapCedant = (snapCession.cedant as Record<string, any>) || {};
    const snapType = String(snapshot?.attestation_type || "");
    const resolvedAttestationType = snapType || attestation.type || "";
    const resolvedAttestationTypeLower = resolvedAttestationType.toLowerCase();
    const snapTemoins = Array.isArray(snapshot?.temoins)
      ? (snapshot?.temoins as Array<Record<string, any>>)
      : null;
    const temoinsFinal =
      snapTemoins && snapTemoins.length
        ? snapTemoins.map((t) => ({
            nom: String(t.nom || ""),
            prenom: String(t.prenom || ""),
            profession: String(t.profession || ""),
            telephone: String(t.telephone || ""),
            cni: String(t.cni || ""),
          }))
        : temoinsPrint;

    printAttestationCoutumiere({
      reference: attestation.reference,
      numero_enregistrement:
        (snapshot?.numero_enregistrement as string) ||
        attestation.numero_enregistrement ||
        attestation.reference,
      date_etablissement: formatDateLong(
        attestation.date_etablissement || getLocalDateInput(),
      ),
      original:
        typeof snapshot?.original === "boolean"
          ? (snapshot?.original as boolean)
          : true,
      draft: attestation.statut !== "valide",
      region: String(
        snapVillage.region || config.region || lot.region || "REGION",
      ),
      departement: String(
        snapVillage.departement ||
          config.departement ||
          lot.departement ||
          "DEPARTEMENT",
      ),
      commune: String(
        snapVillage.commune || config.commune || lot.commune || "COMMUNE",
      ),
      village: String(
        snapVillage.village || config.village || lot.village || "VILLAGE",
      ),
      quartier: String(snapVillage.quartier || lot.quartier || ""),
      lotissement: String(snapVillage.lotissement || lot.nom_lotissement || ""),
      numero_lot: String(snapVillage.numero_lot || lot.numero_lot || ""),
      superficie_m2:
        typeof snapParcelle.superficie_m2 === "number"
          ? snapParcelle.superficie_m2
          : lot.superficie || 0,
      limites: {
        nord: String(snapLimites.nord || attestation.limites_nord || ""),
        sud: String(snapLimites.sud || attestation.limites_sud || ""),
        est: String(snapLimites.est || attestation.limites_est || ""),
        ouest: String(snapLimites.ouest || attestation.limites_ouest || ""),
      },
      coordonnees_gps:
        snapGps && snapGps.lat != null && snapGps.lng != null
          ? {
              lat: Number(snapGps.lat),
              lng: Number(snapGps.lng),
              precision: snapGps.precision ?? undefined,
            }
          : attestation.gps_lat != null && attestation.gps_lng != null
            ? {
                lat: Number(attestation.gps_lat),
                lng: Number(attestation.gps_lng),
                precision: attestation.gps_precision ?? undefined,
              }
            : undefined,
      gps_points:
        (snapGpsPoints as any) || (attestation.gps_points as any) || undefined,
      mode_acquisition: String(
        snapAcquisition.mode || attestation.mode_acquisition || "",
      ),
      historique_possession: String(
        snapAcquisition.historique || attestation.historique_possession || "",
      ),
      proprietaire_nom: String(snapTitulaire.nom || lot.proprietaire_nom || ""),
      proprietaire_prenom: String(
        snapTitulaire.prenom || lot.proprietaire_prenom || "",
      ),
      proprietaire_naissance_date: String(
        snapTitulaire.naissance_date || lot.proprietaire_naissance_date || "",
      ),
      proprietaire_naissance_lieu: String(
        snapTitulaire.naissance_lieu || lot.proprietaire_naissance_lieu || "",
      ),
      proprietaire_domicile: String(
        snapTitulaire.domicile || attestation.domicile || "",
      ),
      proprietaire_profession: String(
        snapTitulaire.profession || lot.proprietaire_profession || "",
      ),
      proprietaire_cni_numero: String(
        snapTitulaire.cni_numero || lot.proprietaire_cni_numero || "",
      ),
      proprietaire_cni_date: String(
        snapTitulaire.cni_date || lot.proprietaire_cni_date || "",
      ),
      proprietaire_cni_lieu: String(
        snapTitulaire.cni_lieu || lot.proprietaire_cni_lieu || "",
      ),
      proprietaire_telephone: String(
        snapTitulaire.telephone || lot.proprietaire_telephone || "",
      ),
      cedant_nom: String(snapCedant.nom || attestation.cedant_nom || ""),
      cedant_prenom: String(
        snapCedant.prenom || attestation.cedant_prenom || "",
      ),
      cedant_cni_numero: String(
        snapCedant.cni_numero || attestation.cedant_cni_numero || "",
      ),
      cedant_telephone: String(
        snapCedant.telephone || attestation.cedant_telephone || "",
      ),
      cedant_domicile: String(
        snapCedant.domicile || attestation.cedant_domicile || "",
      ),
      temoins: temoinsFinal,
      chef_village: String(
        snapAutorites.chef_village ||
          config.chef_village ||
          lot.chef_village ||
          "",
      ),
      lieu_signature: String(
        snapAutorites.lieu_signature ||
          config.lieu_signature ||
          lot.village ||
          "",
      ),
      registre_volume: String(
        snapRegistre.volume || attestation.registre_volume || "",
      ),
      registre_page: snapRegistre.page ?? attestation.registre_page,
      registre_ligne: snapRegistre.ligne ?? attestation.registre_ligne,
      control_number: attestation.control_number || "",
      verification_url: verificationUrl,
      qrDataUrl,
      hash_sha256: attestation.hash_sha256 || "",
      validation_agent_nom: String(
        snapValidation.agent_nom || attestation.validation_agent_nom || "",
      ),
      validation_chef_nom: String(
        snapValidation.chef_nom || attestation.validation_chef_nom || "",
      ),
      logoUrl: config.logo_url || "",
      village_logo_url: config.village_logo_url || "",
      chef_nom: String(
        snapValidation.chef_nom ||
          config.chef_village ||
          lot.chef_village ||
          "",
      ),
      attestation_type: resolvedAttestationType,
      statut: attestation.statut,
      lot_statut: lot.statut,
      date_cession: snapCession.date_cession
        ? String(snapCession.date_cession)
        : resolvedAttestationTypeLower === "cession"
          ? String(lot.date_cession || "")
          : "",
      prix_cession:
        typeof snapCession.prix_cession === "number"
          ? snapCession.prix_cession
          : resolvedAttestationTypeLower === "cession"
            ? lot.prix_cession
            : undefined,
    });

    if (isOnline) {
      const { error: auditError } = await withBackoff(() =>
        logFoncierAudit(supabase, {
          lotId: lot.id,
          action: "IMPRESSION",
          details: {
            type: "attestation_moderne",
            reference: attestation.reference,
          },
        }),
      );
      if (auditError) {
        try {
          await addQueueItem({
            id: generateUUID(),
            op: "audit_log",
            payload: {
              lot_id: lot.id,
              action: "IMPRESSION",
              details: {
                type: "attestation_moderne",
                reference: attestation.reference,
              },
            },
            client_updated_at: new Date().toISOString(),
          });
          setPageNotice(
            "Impression OK. Journalisation en attente de synchronisation.",
          );
        } catch {
          setPageError("Impression effectuée, mais journalisation impossible.");
        }
      }
    }
  };

  const handlePrintAttestationAnnex = async (lot: FoncierLot) => {
    const config = await ensureConfigLoaded(lot.village || configVillage);

    if (!isOnline) {
      setPageError(
        "Hors ligne : l'annexe technique nécessite les données complètes.",
      );
      return;
    }

    const { data, error } = await fetchLatestAttestationForLot(lot.id, {
      includeArchived: false,
      select: "*, foncier_attestation_temoins(*)",
    });

    if (error) {
      setPageError("Impossible de charger l'attestation.");
      return;
    }

    if (!data) {
      setPageNotice("Aucune attestation trouvée. Générez-la d'abord.");
      return;
    }

    const attestation = data as FoncierAttestation & {
      foncier_attestation_temoins?: FoncierAttestationTemoin[];
    };
    const snapshot = parseAttestationSnapshot(attestation.qr_payload);
    const verificationUrl = buildAttestationVerificationUrl({
      reference: attestation.reference,
      control_number: attestation.control_number || "",
      hash_sha256: attestation.hash_sha256 || "",
      baseUrl: String(snapshot?.verification_url || ""),
    });
    const qrDataUrl = await buildQrDataUrl(verificationUrl);
    const snapParcelle = (snapshot?.parcelle as Record<string, any>) || {};
    const snapLimites = (snapParcelle.limites as Record<string, any>) || {};
    const snapGps =
      (snapParcelle.coordonnees_gps as {
        lat?: number;
        lng?: number;
        precision?: number;
      } | null) || null;
    const snapGpsPoints = Array.isArray(snapParcelle.gps_points)
      ? snapParcelle.gps_points
      : null;
    const snapTemoins = Array.isArray(snapshot?.temoins)
      ? (snapshot?.temoins as Array<Record<string, any>>)
      : null;
    const temoinsPrint = (attestation.foncier_attestation_temoins || []).map(
      (t) => ({
        nom: t.nom,
        prenom: t.prenom,
        profession: t.profession || "",
        telephone: t.telephone || "",
        cni: t.cni || "",
      }),
    );
    const temoinsFinal =
      snapTemoins && snapTemoins.length
        ? snapTemoins.map((t) => ({
            nom: String(t.nom || ""),
            prenom: String(t.prenom || ""),
            profession: String(t.profession || ""),
            telephone: String(t.telephone || ""),
            cni: String(t.cni || ""),
          }))
        : temoinsPrint;

    printAttestationAnnex({
      reference: attestation.reference,
      numero_enregistrement:
        attestation.numero_enregistrement || attestation.reference,
      date_etablissement: formatDateLong(
        attestation.date_etablissement || getLocalDateInput(),
      ),
      original: true,
      region: config.region || lot.region || "REGION",
      departement: config.departement || lot.departement || "DEPARTEMENT",
      commune: config.commune || lot.commune || "COMMUNE",
      village: config.village || lot.village || "VILLAGE",
      quartier: lot.quartier,
      lotissement: lot.nom_lotissement,
      numero_lot: lot.numero_lot,
      superficie_m2: lot.superficie || 0,
      limites: {
        nord: String(snapLimites.nord || attestation.limites_nord || ""),
        sud: String(snapLimites.sud || attestation.limites_sud || ""),
        est: String(snapLimites.est || attestation.limites_est || ""),
        ouest: String(snapLimites.ouest || attestation.limites_ouest || ""),
      },
      coordonnees_gps:
        snapGps && snapGps.lat != null && snapGps.lng != null
          ? {
              lat: Number(snapGps.lat),
              lng: Number(snapGps.lng),
              precision: snapGps.precision ?? undefined,
            }
          : undefined,
      gps_points:
        (snapGpsPoints as any) || (attestation.gps_points as any) || undefined,
      mode_acquisition: String(attestation.mode_acquisition || ""),
      historique_possession: String(attestation.historique_possession || ""),
      proprietaire_nom: lot.proprietaire_nom || "",
      proprietaire_prenom: lot.proprietaire_prenom || "",
      proprietaire_naissance_date: lot.proprietaire_naissance_date || "",
      proprietaire_naissance_lieu: lot.proprietaire_naissance_lieu || "",
      proprietaire_domicile: String(attestation.domicile || ""),
      proprietaire_profession: lot.proprietaire_profession || "",
      proprietaire_cni_numero: lot.proprietaire_cni_numero || "",
      proprietaire_cni_date: lot.proprietaire_cni_date || "",
      proprietaire_cni_lieu: lot.proprietaire_cni_lieu || "",
      proprietaire_telephone: lot.proprietaire_telephone || "",
      temoins: temoinsFinal,
      chef_village: config.chef_village || lot.chef_village || "",
      lieu_signature: config.lieu_signature || lot.village || "",
      registre_volume: String(attestation.registre_volume || ""),
      registre_page: attestation.registre_page,
      registre_ligne: attestation.registre_ligne,
      control_number: attestation.control_number || "",
      verification_url: verificationUrl,
      qrDataUrl,
      hash_sha256: attestation.hash_sha256 || "",
      validation_agent_nom: String(attestation.validation_agent_nom || ""),
      validation_chef_nom: String(attestation.validation_chef_nom || ""),
      logoUrl: config.logo_url || "",
      village_logo_url: config.village_logo_url || "",
      chef_nom: config.chef_village || lot.chef_village || "",
      attestation_type: attestation.type || "",
      statut: attestation.statut,
      date_cession: lot.date_cession || "",
      prix_cession: lot.prix_cession,
    });
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const totalAuditPages = Math.max(1, Math.ceil(auditTotal / auditPageSize));
  const computedReference = useMemo(
    () => form.reference || generateFoncierReference(),
    [form.reference],
  );

  const isValidDateInput = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return true;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return true;
    return isValidFrDate(trimmed);
  };

  const handleDateBlur = (value: string, label: string) => {
    if (!value.trim()) return;
    if (!isValidDateInput(value)) {
      setModalError(
        `Date invalide pour ${label}. Format attendu JJ / MM / AAAA ou AAAA-MM-JJ.`,
      );
    }
  };

  const inputClass =
    "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400";
  const disabledButtonClass = "disabled:opacity-50 disabled:cursor-not-allowed";

  const tabs = [
    { id: "info" as const, label: "Lot & Localisation" },
    { id: "proprietaire" as const, label: "Propriétaire" },
    { id: "admin" as const, label: "Administratif" },
  ];

  const gpsBoundaryFields: Array<{
    label: string;
    latKey: keyof AttestationForm;
    lngKey: keyof AttestationForm;
  }> = [
    { label: "Nord", latKey: "gps_nord_lat", lngKey: "gps_nord_lng" },
    { label: "Sud", latKey: "gps_sud_lat", lngKey: "gps_sud_lng" },
    { label: "Est", latKey: "gps_est_lat", lngKey: "gps_est_lng" },
    { label: "Ouest", latKey: "gps_ouest_lat", lngKey: "gps_ouest_lng" },
  ];

  const configFields: {
    key: FoncierConfigKey;
    label: string;
    placeholder: string;
  }[] = [
    {
      key: "region",
      label: "Région",
      placeholder: "ex: REGION DE L'AGNEBY-TIASSA",
    },
    {
      key: "departement",
      label: "Département",
      placeholder: "ex: DEPARTEMENT DE TAABO",
    },
    { key: "commune", label: "Commune", placeholder: "ex: COMMUNE DE TAABO" },
    {
      key: "village",
      label: "Village",
      placeholder: "ex: VILLAGE DE KOKOTI-KOUAMEKRO",
    },
    {
      key: "chef_village",
      label: "Nom du Chef du Village",
      placeholder: "ex: Nanan YAO Kouamé Roger",
    },
    {
      key: "arrete_prefectoral",
      label: "N° Arrêté Préfectoral",
      placeholder: "ex: N°21/R.AT/D-TAA/P-TAA/SG/Div I du 05 août 2024",
    },
    {
      key: "nom_chef_signe",
      label: "Nom signataire (majuscules)",
      placeholder: "ex: NANAN YAO KOUAME ROGER",
    },
    {
      key: "lieu_signature",
      label: "Lieu de Signature",
      placeholder: "ex: Kokoti-Kouamékro",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 flex-1 w-full">
          <div className="relative w-full sm:w-auto sm:min-w-[240px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Réf, lot, propriétaire..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 w-full sm:w-64"
            />
          </div>
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-white w-full sm:w-auto"
          >
            <option value="">Tous statuts</option>
            {Object.entries(statutConfig).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
          <select
            value={filterVillage}
            onChange={(e) => setFilterVillage(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-white w-full sm:w-auto"
          >
            <option value="">Tous villages</option>
            {villageOptions.map((village) => (
              <option key={village} value={village}>
                {village}
              </option>
            ))}
          </select>
          {!villageOptionsLoaded && isOnline && (
            <span className="text-xs text-orange-600 flex items-center gap-1">
              <RefreshCcw size={12} className="animate-spin" /> Chargement...
            </span>
          )}
          <label className="inline-flex items-center gap-2 px-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Afficher archivés
          </label>
        </div>
        <div className="flex gap-2">
          <div
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium ${isOnline ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
          >
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            {isOnline ? "En ligne" : "Hors ligne"}
          </div>
          <button
            onClick={() => void syncQueue()}
            disabled={!isOnline || syncing || syncPending === 0}
            title={
              !isOnline
                ? "Hors ligne"
                : syncPending === 0
                  ? "Aucune synchronisation en attente"
                  : undefined
            }
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors ${disabledButtonClass}`}
          >
            <RefreshCcw size={16} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Sync..." : `Sync (${syncPending})`}
          </button>

          {/* Progress indicator pour la synchronisation */}
          {syncProgress && syncProgress.total > 0 && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-medium">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>
                  Sync: {syncProgress.current}/{syncProgress.total}
                </span>
              </div>
              <div className="flex-1 w-24 h-2 bg-blue-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{
                    width: `${(syncProgress.current / syncProgress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
          <button
            onClick={openAudit}
            disabled={!canManage}
            title={!canManage ? "Accès réservé" : undefined}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors ${disabledButtonClass}`}
          >
            <History size={16} /> Audit
          </button>
          <button
            onClick={openConfig}
            disabled={!canManage}
            title={!canManage ? "Accès réservé" : undefined}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors ${disabledButtonClass}`}
          >
            <Settings2 size={16} /> Config Village
          </button>
          <button
            onClick={openAdd}
            disabled={!canManage}
            title={!canManage ? "Accès réservé" : undefined}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity ${disabledButtonClass}`}
            style={{
              backgroundColor: settings.primary_color,
              color: "var(--color-on-primary)",
            }}
          >
            <Plus size={16} /> Nouveau Lot
          </button>
        </div>
      </div>

      {pageError && (
        <div
          role="alert"
          className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700"
        >
          {pageError}
        </div>
      )}
      {pageNotice && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
          {pageNotice}
        </div>
      )}
      {syncError && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          {syncError}
        </div>
      )}
      {statsError && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          {statsError}
        </div>
      )}
      {statsLoading && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600">
          Chargement des statistiques par village...
        </div>
      )}
      {!statsLoading && !statsError && Object.keys(villageStats).length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
          {Object.entries(villageStats).map(([village, stat]) => (
            <div
              key={village}
              className="px-2 py-1 rounded-lg border border-gray-200 bg-white"
            >
              <span className="font-semibold">{village}</span> :{" "}
              {formatMontant(stat.total)} m² ({stat.count})
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2"
              style={{ borderColor: settings.primary_color }}
            ></div>
          </div>
        ) : lots.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Map size={40} className="mb-2 opacity-30" />
            <p className="text-sm">Aucun lot foncier enregistré</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full egs-table">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Référence
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Lot · Îlot
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">
                    Lotissement
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">
                    Propriétaire
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">
                    Superficie
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden xl:table-cell">
                    Prix/m²
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Statut
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lots.map((lot) => {
                  const isArchived = Boolean(lot.deleted_at);
                  const st = isArchived
                    ? { label: "Archivé", color: "gray" as const }
                    : statutConfig[lot.statut] || {
                        label: lot.statut || "Inconnu",
                        color: "gray" as const,
                      };
                  const prixM2 =
                    lot.superficie && lot.prix_cession
                      ? `${formatMontant(lot.prix_cession / lot.superficie)} FCFA`
                      : "—";
                  return (
                    <tr
                      key={lot.id}
                      className={`transition-colors ${isArchived ? "bg-gray-50/50" : "hover:bg-gray-50"}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <QrIcon
                            size={14}
                            className="text-gray-400 flex-shrink-0"
                          />
                          <span className="table-key">{lot.reference}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-800">
                          Lot {lot.numero_lot}
                        </div>
                        <div className="text-xs text-gray-400">
                          Îlot {lot.numero_ilot}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="text-sm text-gray-700">
                          {lot.nom_lotissement}
                        </div>
                        <div className="text-xs text-gray-400">
                          {lot.village}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-sm text-gray-700">
                          {lot.proprietaire_prenom} {lot.proprietaire_nom}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">
                        {lot.superficie ? `${lot.superficie} m²` : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden xl:table-cell">
                        {prixM2}
                      </td>
                      <td className="px-4 py-3">
                        <Badge label={st.label} color={st.color} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => openAttestation(lot)}
                            disabled={!canManage || isArchived}
                            title={
                              !canManage
                                ? "Accès réservé"
                                : isArchived
                                  ? "Lot archivé"
                                  : "Attestation Coutumière"
                            }
                            aria-label={
                              !canManage
                                ? "Accès réservé"
                                : isArchived
                                  ? "Lot archivé"
                                  : "Attestation coutumière"
                            }
                            className={`p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors ${disabledButtonClass}`}
                          >
                            <FileText size={15} />
                          </button>
                          <button
                            onClick={() => openWorkflow(lot.id)}
                            disabled={!canManage || isArchived}
                            title={
                              !canManage
                                ? "Accès réservé"
                                : isArchived
                                  ? "Lot archivé"
                                  : "Validation Chef"
                            }
                            aria-label={
                              !canManage
                                ? "Accès réservé"
                                : isArchived
                                  ? "Lot archivé"
                                  : "Validation Chef"
                            }
                            className={`p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors ${disabledButtonClass}`}
                          >
                            <CheckCircle size={15} />
                          </button>
                          <button
                            onClick={() => handlePrintAttestation(lot)}
                            title="Imprimer attestation officielle"
                            aria-label="Imprimer attestation officielle"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                          >
                            <Printer size={15} />
                          </button>
                          <button
                            onClick={() => handlePrintAttestationAnnex(lot)}
                            title="Imprimer annexe technique (GPS, limites, témoins)"
                            aria-label="Imprimer annexe technique"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                          >
                            <Files size={15} />
                          </button>
                          <button
                            onClick={() => openAttestationHistory(lot)}
                            disabled={!canManage || isArchived}
                            title={
                              !canManage
                                ? "Accès réservé"
                                : isArchived
                                  ? "Lot archivé"
                                  : "Historique attestations"
                            }
                            aria-label={
                              !canManage
                                ? "Accès réservé"
                                : isArchived
                                  ? "Lot archivé"
                                  : "Historique attestations"
                            }
                            className={`p-1.5 rounded-lg text-gray-400 hover:text-slate-600 hover:bg-slate-50 transition-colors ${disabledButtonClass}`}
                          >
                            <History size={15} />
                          </button>
                          <button
                            onClick={() => openEdit(lot)}
                            disabled={!canManage || isArchived}
                            title={
                              !canManage
                                ? "Accès réservé"
                                : isArchived
                                  ? "Lot archivé"
                                  : "Modifier"
                            }
                            aria-label={
                              !canManage
                                ? "Accès réservé"
                                : isArchived
                                  ? "Lot archivé"
                                  : "Modifier"
                            }
                            className={`p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors ${disabledButtonClass}`}
                          >
                            <Edit size={15} />
                          </button>
                          {isArchived ? (
                            <button
                              onClick={() => handleRestore(lot)}
                              disabled={!canManage}
                              title={!canManage ? "Accès réservé" : "Restaurer"}
                              aria-label={
                                !canManage ? "Accès réservé" : "Restaurer"
                              }
                              className={`p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors ${disabledButtonClass}`}
                            >
                              <RotateCcw size={15} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleArchive(lot)}
                              disabled={!canManage}
                              title={!canManage ? "Accès réservé" : "Archiver"}
                              aria-label={
                                !canManage ? "Accès réservé" : "Archiver"
                              }
                              className={`p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors ${disabledButtonClass}`}
                            >
                              <Archive size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && lots.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-gray-500">
          <div>
            Total:{" "}
            <span className="font-medium text-gray-700">{totalCount}</span> lots
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className={`px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors ${disabledButtonClass}`}
            >
              Précédent
            </button>
            <span className="text-gray-600">
              Page {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className={`px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors ${disabledButtonClass}`}
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Modifier le Lot Foncier" : "Nouveau Lot Foncier"}
        size="lg"
      >
        <div className="space-y-4">
          {modalError && (
            <div
              role="alert"
              className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700"
            >
              {modalError}
            </div>
          )}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "info" && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    N° de Lot *
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={form.numero_lot}
                    onChange={(e) =>
                      setForm({ ...form, numero_lot: e.target.value })
                    }
                    className={inputClass}
                    placeholder="ex: 662A"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    N° d'Îlot *
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={form.numero_ilot}
                    onChange={(e) =>
                      setForm({ ...form, numero_ilot: e.target.value })
                    }
                    className={inputClass}
                    placeholder="ex: 62"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Superficie (m²) *
                  </label>
                  <input
                    type="number"
                    value={form.superficie}
                    onChange={(e) =>
                      setForm({ ...form, superficie: e.target.value })
                    }
                    className={inputClass}
                    placeholder="ex: 1229"
                    step="0.01"
                    min="0.01"
                  />
                </div>
              </div>

              {/* Référence générée automatiquement */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <QrIcon size={16} className="text-blue-600" />
                  <label className="block text-xs font-semibold text-blue-800">
                    Référence du Lot (générée automatiquement)
                  </label>
                </div>
                <div className="text-lg font-mono font-bold text-blue-900">
                  {computedReference}
                </div>
                <div className="text-[11px] text-blue-600 mt-1">
                  Format: FONC-YYYY-MM-DD-XXXXX
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Nom du Lotissement *
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={form.nom_lotissement}
                  onChange={(e) =>
                    setForm({ ...form, nom_lotissement: e.target.value })
                  }
                  className={inputClass}
                  placeholder="ex: TAABO-EXTENSION"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Quartier
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={form.quartier}
                    onChange={(e) =>
                      setForm({ ...form, quartier: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Village *
                  </label>
                  <select
                    value={form.village}
                    onChange={(e) =>
                      setForm({ ...form, village: e.target.value })
                    }
                    className={inputClass}
                  >
                    <option value="">Sélectionner un village</option>
                    {form.village && !villageOptions.includes(form.village) && (
                      <option value={form.village}>{form.village}</option>
                    )}
                    {villageOptions.map((village) => (
                      <option key={village} value={village}>
                        {village}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Commune
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={form.commune}
                    onChange={(e) =>
                      setForm({ ...form, commune: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Département
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={form.departement}
                    onChange={(e) =>
                      setForm({ ...form, departement: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Région
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={form.region}
                    onChange={(e) =>
                      setForm({ ...form, region: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Statut
                  </label>
                  <select
                    value={form.statut}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        statut: e.target.value as FoncierLot["statut"],
                      })
                    }
                    className={inputClass}
                  >
                    {Object.entries(statutConfig).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Date de Cession
                  </label>
                  <input
                    type="date"
                    value={form.date_cession}
                    onChange={(e) =>
                      setForm({ ...form, date_cession: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Prix de Cession (FCFA) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.prix_cession}
                    onChange={(e) =>
                      setForm({ ...form, prix_cession: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Sécurité d’attestation
                  </label>
                  <div className="h-10 px-3 rounded-lg border border-blue-200 bg-blue-50 text-xs text-blue-800 flex items-center">
                    QR code de vérification généré automatiquement à l’émission
                    de l’attestation
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "proprietaire" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Prénom
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={form.proprietaire_prenom}
                    onChange={(e) =>
                      setForm({ ...form, proprietaire_prenom: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={form.proprietaire_nom}
                    onChange={(e) =>
                      setForm({ ...form, proprietaire_nom: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Date de Naissance
                  </label>
                  <input
                    type="text"
                    value={form.proprietaire_naissance_date}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        proprietaire_naissance_date: e.target.value,
                      })
                    }
                    onBlur={(e) =>
                      handleDateBlur(e.target.value, "la date de naissance")
                    }
                    className={inputClass}
                    placeholder="ex: 29 / 12 / 1967"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Lieu de Naissance
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={form.proprietaire_naissance_lieu}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        proprietaire_naissance_lieu: e.target.value,
                      })
                    }
                    className={inputClass}
                    placeholder="ex: ANYAMA"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  N° CNI / Passeport / AI / CR / CC
                </label>
                <input
                  type="text"
                  maxLength={20}
                  value={form.proprietaire_cni_numero}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      proprietaire_cni_numero: e.target.value,
                    })
                  }
                  className={inputClass}
                  placeholder="ex: CI 005274109"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Date Émission CNI
                  </label>
                  <input
                    type="text"
                    value={form.proprietaire_cni_date}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        proprietaire_cni_date: e.target.value,
                      })
                    }
                    onBlur={(e) =>
                      handleDateBlur(e.target.value, "la date d'émission CNI")
                    }
                    className={inputClass}
                    placeholder="ex: 20 / 12 / 2022"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Lieu Émission CNI
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={form.proprietaire_cni_lieu}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        proprietaire_cni_lieu: e.target.value,
                      })
                    }
                    className={inputClass}
                    placeholder="ex: Abidjan"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Profession
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={form.proprietaire_profession}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        proprietaire_profession: e.target.value,
                      })
                    }
                    className={inputClass}
                    placeholder="ex: CHEF D'ENTREPRISE"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    maxLength={20}
                    value={form.proprietaire_telephone}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        proprietaire_telephone: e.target.value,
                      })
                    }
                    className={inputClass}
                    placeholder="ex: 0707084041"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "admin" && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
                Ces informations sont pré-remplies depuis la configuration du
                village. Modifiez si nécessaire.
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Chef du Village
                </label>
                <input
                  type="text"
                  maxLength={120}
                  value={form.chef_village}
                  onChange={(e) =>
                    setForm({ ...form, chef_village: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  N° Arrêté Préfectoral
                </label>
                <input
                  type="text"
                  maxLength={150}
                  value={form.arrete_prefectoral}
                  onChange={(e) =>
                    setForm({ ...form, arrete_prefectoral: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Date Arrêté
                </label>
                <input
                  type="text"
                  value={form.arrete_date}
                  onChange={(e) =>
                    setForm({ ...form, arrete_date: e.target.value })
                  }
                  onBlur={(e) =>
                    handleDateBlur(e.target.value, "la date de l’arrêté")
                  }
                  className={inputClass}
                  placeholder="ex: 05 / 08 / 2024"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Notes
                </label>
                <textarea
                  maxLength={1000}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={
                saving ||
                !canManage ||
                !form.numero_lot.trim() ||
                !form.proprietaire_nom.trim()
              }
              className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              style={{
                backgroundColor: settings.primary_color,
                color: "var(--color-on-primary)",
              }}
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        title="Configuration du Village / Attestation"
      >
        <div className="space-y-3">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
            Ces valeurs sont utilisées par défaut lors de la création de lots et
            l'impression d'attestations.
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Village
            </label>
            <select
              value={configVillage}
              onChange={(e) => void handleConfigVillageChange(e.target.value)}
              className={inputClass}
            >
              {villageOptions.map((village) => (
                <option key={village} value={village}>
                  {village}
                </option>
              ))}
            </select>
          </div>
          {configError && (
            <div
              role="alert"
              className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700"
            >
              {configError}
            </div>
          )}
          {configFields.map((field) => (
            <div key={field.key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {field.label}
              </label>
              <input
                type="text"
                value={configForm[field.key] || ""}
                onChange={(e) =>
                  setConfigForm({ ...configForm, [field.key]: e.target.value })
                }
                className={inputClass}
                placeholder={field.placeholder}
              />
            </div>
          ))}

          {/* Section Logo du Village - Nouveau composant premium */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Logo officiel du village
            </label>
            <VillageLogoUploader
              villageName={configVillage}
              currentLogoUrl={configForm.logo_url || ""}
              onLogoUploaded={(logoUrl) =>
                setConfigForm({ ...configForm, logo_url: logoUrl })
              }
              onError={(errorMsg) => setConfigError(errorMsg)}
              disabled={savingConfig || !canManage}
            />

            {/* Affichage du primary_color avec aperçu */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Couleur principale
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={configForm.primary_color || "#1e3a5f"}
                    onChange={(e) =>
                      setConfigForm({
                        ...configForm,
                        primary_color: e.target.value,
                      })
                    }
                    className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={configForm.primary_color || "#1e3a5f"}
                    onChange={(e) =>
                      setConfigForm({
                        ...configForm,
                        primary_color: e.target.value,
                      })
                    }
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono"
                    placeholder="#1e3a5f"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Style de layout
                </label>
                <select
                  value={configForm.layout_preference || "modern"}
                  onChange={(e) =>
                    setConfigForm({
                      ...configForm,
                      layout_preference: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="modern">Moderne (épuré)</option>
                  <option value="classic">Classique (orné)</option>
                  <option value="minimal">Minimaliste</option>
                </select>
              </div>
            </div>

            {/* Aperçu du logo avec la couleur */}
            {(configForm.logo_url || configForm.primary_color) && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-3">
                  Aperçu du rendu :
                </p>
                <div className="flex items-center gap-4">
                  <VillageLogoDisplay
                    logoUrl={configForm.logo_url}
                    villageName={configVillage}
                    size="lg"
                    primaryColor={configForm.primary_color || "#1e3a5f"}
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {configVillage}
                    </p>
                    <p className="text-xs text-gray-500">
                      Style : {configForm.layout_preference || "modern"}
                    </p>
                    <div
                      className="mt-2 w-24 h-6 rounded"
                      style={{
                        backgroundColor: configForm.primary_color || "#1e3a5f",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setConfigModalOpen(false)}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSaveConfig}
              disabled={savingConfig || !canManage}
              className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              style={{
                backgroundColor: settings.primary_color,
                color: "var(--color-on-primary)",
              }}
            >
              {savingConfig ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={attestationModalOpen}
        onClose={() => {
          setAttestationModalOpen(false);
          setAttestationLot(null);
          setAttestationForm(createAttestationForm());
          setAttestationError(null);
        }}
        title="Attestation de Propriété Villageoise"
        size="xl"
      >
        <div className="space-y-6">
          {attestationError && (
            <div
              role="alert"
              className="p-4 bg-red-50 border-l-4 border-red-400 rounded-lg text-xs text-red-800"
            >
              <div className="font-semibold mb-1">⚠️ Erreur</div>
              <div>{attestationError}</div>
            </div>
          )}

          <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-blue-25 p-5">
            <div className="flex flex-col gap-4">
              <div className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                📋 Résumé du lot
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3 text-sm text-blue-900">
                <div>
                  <div className="text-xs font-medium text-blue-600 mb-1">Référence</div>
                  <div className="font-semibold text-blue-950">
                    {attestationLot?.reference || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-blue-600 mb-1">Propriétaire</div>
                  <div className="font-semibold text-blue-950">
                    {attestationLot?.proprietaire_prenom || "—"}{" "}
                    {attestationLot?.proprietaire_nom || ""}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-blue-600 mb-1">Village</div>
                  <div className="font-semibold text-blue-950">
                    {attestationLot?.village || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-blue-600 mb-1">Lotissement</div>
                  <div className="font-semibold text-blue-950">
                    {attestationLot?.nom_lotissement || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-blue-600 mb-1">Numéro lot</div>
                  <div className="font-semibold text-blue-950">
                    {attestationLot?.numero_lot || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-blue-600 mb-1">Superficie</div>
                  <div className="font-semibold text-blue-950">
                    {attestationLot?.superficie
                      ? `${attestationLot.superficie} m²`
                      : "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {attestationLot?.statut === "vendu" && (
            <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs">
              Lot marqué comme vendu. Cette attestation sera générée en mode
              cession.
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
              Type d’attestation
            </div>
            <select
              value={attestationForm.attestation_type}
              onChange={(e) =>
                setAttestationForm({
                  ...attestationForm,
                  attestation_type: e.target
                    .value as AttestationForm["attestation_type"],
                })
              }
              className={inputClass}
            >
              <option value="standard">Propriété coutumière</option>
              <option value="cession">Cession de droits coutumiers</option>
            </select>
            {attestationForm.attestation_type === "cession" && (
              <p className="text-xs text-amber-600 mt-2">
                Réémission avec nouvelle référence officielle, nouveau QR
                sécurisé et archivage de l’ancienne attestation.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-purple-600 rounded-full"></div>
                <div className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Enregistrement
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Volume registre
                  </label>
                  <input
                    type="text"
                    value={attestationForm.registre_volume}
                    onChange={(e) =>
                      setAttestationForm({
                        ...attestationForm,
                        registre_volume: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Page
                  </label>
                  <input
                    type="text"
                    value={attestationForm.registre_page}
                    onChange={(e) =>
                      setAttestationForm({
                        ...attestationForm,
                        registre_page: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Ligne
                  </label>
                  <input
                    type="text"
                    value={attestationForm.registre_ligne}
                    onChange={(e) =>
                      setAttestationForm({
                        ...attestationForm,
                        registre_ligne: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Numéro d'enregistrement
                </label>
                <input
                  type="text"
                  value={attestationForm.numero_enregistrement}
                  onChange={(e) =>
                    setAttestationForm({
                      ...attestationForm,
                      numero_enregistrement: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-indigo-600 rounded-full"></div>
                <div className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Acquisition & Domicile
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Mode d'acquisition
                  </label>
                  <select
                    value={attestationForm.mode_acquisition}
                    onChange={(e) =>
                      setAttestationForm({
                        ...attestationForm,
                        mode_acquisition: e.target.value,
                      })
                    }
                    className={inputClass}
                  >
                    <option value="">Sélectionner</option>
                    <option value="Héritage">Héritage</option>
                    <option value="Donation">Donation</option>
                    <option value="Vente coutumière">Vente coutumière</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Domicile du détenteur
                  </label>
                  <input
                    type="text"
                    value={attestationForm.domicile}
                    onChange={(e) =>
                      setAttestationForm({
                        ...attestationForm,
                        domicile: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Historique de possession
                </label>
                <textarea
                  value={attestationForm.historique_possession}
                  onChange={(e) =>
                    setAttestationForm({
                      ...attestationForm,
                      historique_possession: e.target.value,
                    })
                  }
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>
          </div>

          {attestationForm.attestation_type === "cession" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-amber-600 rounded-full"></div>
                <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  Cédant (droits coutumiers)
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <input
                  type="text"
                  value={attestationForm.cedant_nom}
                  onChange={(e) =>
                    setAttestationForm({
                      ...attestationForm,
                      cedant_nom: e.target.value,
                    })
                  }
                  className={inputClass}
                  placeholder="Nom"
                />
                <input
                  type="text"
                  value={attestationForm.cedant_prenom}
                  onChange={(e) =>
                    setAttestationForm({
                      ...attestationForm,
                      cedant_prenom: e.target.value,
                    })
                  }
                  className={inputClass}
                  placeholder="Prénoms"
                />
                <input
                  type="text"
                  value={attestationForm.cedant_cni_numero}
                  onChange={(e) =>
                    setAttestationForm({
                      ...attestationForm,
                      cedant_cni_numero: e.target.value,
                    })
                  }
                  className={inputClass}
                  placeholder="CNI"
                />
                <input
                  type="text"
                  value={attestationForm.cedant_telephone}
                  onChange={(e) =>
                    setAttestationForm({
                      ...attestationForm,
                      cedant_telephone: e.target.value,
                    })
                  }
                  className={inputClass}
                  placeholder="Téléphone"
                />
                <input
                  type="text"
                  value={attestationForm.cedant_domicile}
                  onChange={(e) =>
                    setAttestationForm({
                      ...attestationForm,
                      cedant_domicile: e.target.value,
                    })
                  }
                  className={inputClass}
                  placeholder="Domicile"
                />
              </div>
              <p className="text-[11px] text-amber-700 mt-2">
                Les informations du cédant sont obligatoires pour une
                attestation de cession.
              </p>
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-cyan-600 rounded-full"></div>
              <div className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Limites & Coordonnées GPS
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Limite Nord
                </label>
                <input
                  type="text"
                  value={attestationForm.limites_nord}
                  onChange={(e) =>
                    setAttestationForm({
                      ...attestationForm,
                      limites_nord: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Limite Sud
                </label>
                <input
                  type="text"
                  value={attestationForm.limites_sud}
                  onChange={(e) =>
                    setAttestationForm({
                      ...attestationForm,
                      limites_sud: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Limite Est
                </label>
                <input
                  type="text"
                  value={attestationForm.limites_est}
                  onChange={(e) =>
                    setAttestationForm({
                      ...attestationForm,
                      limites_est: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Limite Ouest
                </label>
                <input
                  type="text"
                  value={attestationForm.limites_ouest}
                  onChange={(e) =>
                    setAttestationForm({
                      ...attestationForm,
                      limites_ouest: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Latitude
                </label>
                <input
                  type="text"
                  value={attestationForm.gps_lat}
                  onChange={(e) =>
                    setAttestationForm({
                      ...attestationForm,
                      gps_lat: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Longitude
                </label>
                <input
                  type="text"
                  value={attestationForm.gps_lng}
                  onChange={(e) =>
                    setAttestationForm({
                      ...attestationForm,
                      gps_lng: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Précision (m)
                </label>
                <input
                  type="text"
                  value={attestationForm.gps_precision}
                  onChange={(e) =>
                    setAttestationForm({
                      ...attestationForm,
                      gps_precision: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                GPS des limites
              </div>
              <div className="space-y-2">
                {gpsBoundaryFields.map((field) => (
                  <div key={field.label} className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Limite {field.label}
                      </label>
                      <input
                        type="text"
                        value={attestationForm[field.latKey] as string}
                        onChange={(e) =>
                          setAttestationForm({
                            ...attestationForm,
                            [field.latKey]: e.target.value,
                          })
                        }
                        className={inputClass}
                        placeholder="Latitude"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {" "}
                      </label>
                      <input
                        type="text"
                        value={attestationForm[field.lngKey] as string}
                        onChange={(e) =>
                          setAttestationForm({
                            ...attestationForm,
                            [field.lngKey]: e.target.value,
                          })
                        }
                        className={inputClass}
                        placeholder="Longitude"
                      />
                    </div>
                    <div className="col-span-1 flex items-end">
                      <div className="text-xs text-gray-400">
                        Précision &lt; 5m recommandée
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-teal-600 rounded-full"></div>
              <div className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Témoins
              </div>
            </div>
            <div className="space-y-3">
              {attestationForm.temoins.map((temoin, index) => (
                <div
                  key={`temoin-${index}`}
                  className="rounded-lg border border-gray-100 p-3"
                >
                  <div className="text-[11px] font-semibold text-gray-500 mb-2">
                    Témoin {index + 1}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <input
                      type="text"
                      value={temoin.nom}
                      onChange={(e) =>
                        updateTemoin(index, "nom", e.target.value)
                      }
                      className={inputClass}
                      placeholder="Nom"
                    />
                    <input
                      type="text"
                      value={temoin.prenom}
                      onChange={(e) =>
                        updateTemoin(index, "prenom", e.target.value)
                      }
                      className={inputClass}
                      placeholder="Prénom"
                    />
                    <input
                      type="text"
                      value={temoin.profession}
                      onChange={(e) =>
                        updateTemoin(index, "profession", e.target.value)
                      }
                      className={inputClass}
                      placeholder="Profession"
                    />
                    <input
                      type="text"
                      value={temoin.telephone}
                      onChange={(e) =>
                        updateTemoin(index, "telephone", e.target.value)
                      }
                      className={inputClass}
                      placeholder="Téléphone"
                    />
                    <input
                      type="text"
                      value={temoin.cni}
                      onChange={(e) =>
                        updateTemoin(index, "cni", e.target.value)
                      }
                      className={inputClass}
                      placeholder="CNI/Passeport"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-rose-600 rounded-full"></div>
                <div className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Validation
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Agent responsable
                  </label>
                  <input
                    type="text"
                    value={attestationForm.validation_agent_nom}
                    onChange={(e) =>
                      setAttestationForm({
                        ...attestationForm,
                        validation_agent_nom: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Chef du village
                  </label>
                  <input
                    type="text"
                    value={attestationForm.validation_chef_nom}
                    onChange={(e) =>
                      setAttestationForm({
                        ...attestationForm,
                        validation_chef_nom: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="text-[11px] text-gray-500 mt-2">
                La validation est effectuée par le Chef (signature physique),
                puis le scan est ajouté.
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-slate-600 rounded-full"></div>
                <div className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Document
                </div>
              </div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                État
              </label>
              <select
                value={attestationForm.original ? "original" : "copie"}
                onChange={(e) =>
                  setAttestationForm({
                    ...attestationForm,
                    original: e.target.value === "original",
                  })
                }
                className={inputClass}
              >
                <option value="original">Original</option>
                <option value="copie">Copie</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => setAttestationModalOpen(false)}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => handleGenerateAttestation()}
              disabled={attestationSaving || !canManage}
              className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {attestationSaving ? "⏳ Traitement..." : "✓ Soumettre & Imprimer"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={attestationHistoryOpen}
        onClose={() => {
          setAttestationHistoryOpen(false);
          setAttestationHistoryLot(null);
          setAttestationHistoryRecords([]);
          setAttestationHistoryScans({});
          setAttestationHistoryError(null);
        }}
        title="Historique des attestations"
        size="xl"
      >
        <div className="space-y-4">
          {attestationHistoryError && (
            <div
              role="alert"
              className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700"
            >
              {attestationHistoryError}
            </div>
          )}

          {attestationHistoryLot && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
              <span className="font-semibold">Lot:</span>{" "}
              {attestationHistoryLot.numero_lot} ·{" "}
              {attestationHistoryLot.village}
              <span className="mx-2 text-gray-400">|</span>
              <span className="font-semibold">Réf parcelle:</span>{" "}
              {attestationHistoryLot.reference}
            </div>
          )}

          {attestationHistoryLoading ? (
            <div className="flex items-center justify-center h-40">
              <div
                className="animate-spin rounded-full h-8 w-8 border-b-2"
                style={{ borderColor: settings.primary_color }}
              ></div>
            </div>
          ) : attestationHistoryRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <p className="text-sm">Aucune attestation disponible</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-100 rounded-xl">
              <table className="w-full egs-table">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      Version
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      Référence
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      Statut
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      Scan
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {attestationHistoryRecords.map((record) => {
                    const statusInfo = getAttestationStatusInfo(record);
                    const scan = attestationHistoryScans[record.id];
                    const dateLabel =
                      record.date_etablissement || record.created_at;
                    return (
                      <tr
                        key={record.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-gray-700">
                          V{record.version || 1}
                        </td>
                        <td className="px-4 py-3 table-key">
                          {record.reference}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDateLong(dateLabel)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            label={statusInfo.label}
                            color={statusInfo.color}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {scan ? (
                            <a
                              href={scan.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {scan.original_name || "Ouvrir"}
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Workflow de Validation */}
      <Modal
        isOpen={workflowModalOpen}
        onClose={() => setWorkflowModalOpen(false)}
        title="Workflow de Validation"
        size="xl"
      >
        {workflowSelectedLot && (
          <WorkflowValidation
            lotId={workflowSelectedLot}
            userId={profile?.id || null}
            userName={profile?.full_name || null}
            isAdmin={accessLevel === "admin"}
            isOnline={isOnline}
            onWorkflowComplete={() => {
              fetchData();
            }}
          />
        )}
      </Modal>

      <Modal
        isOpen={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
        title="Journal d'audit foncier"
        size="xl"
      >
        <div className="space-y-4">
          {auditError && (
            <div
              role="alert"
              className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700"
            >
              {auditError}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={auditActionFilter}
              onChange={(e) => {
                setAuditActionFilter(e.target.value);
                setAuditPage(1);
              }}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-white"
            >
              <option value="">Toutes actions</option>
              {auditActions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
            <button
              onClick={handleAuditPrint}
              disabled={!auditRecords.length}
              className={`px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors ${disabledButtonClass}`}
            >
              Imprimer (PDF)
            </button>
            <button
              onClick={handleAuditExport}
              disabled={!auditRecords.length}
              className={`px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors ${disabledButtonClass}`}
            >
              Export CSV
            </button>
          </div>

          {auditLoading ? (
            <div className="flex items-center justify-center h-40">
              <div
                className="animate-spin rounded-full h-8 w-8 border-b-2"
                style={{ borderColor: settings.primary_color }}
              ></div>
            </div>
          ) : auditRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <p className="text-sm">Aucun audit disponible</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-100 rounded-xl">
              <table className="w-full egs-table">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      Action
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      Utilisateur
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      Parcelle
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      Village
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {auditRecords.map((record) => {
                    const lot = Array.isArray(record.foncier_lots)
                      ? record.foncier_lots[0]
                      : record.foncier_lots;
                    return (
                      <tr
                        key={record.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDateLong(record.date_action)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {record.action}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {record.utilisateur_nom || "—"}
                        </td>
                        <td className="px-4 py-3 table-key">
                          {lot?.reference || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {lot?.village || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-gray-500">
              Page {auditPage} / {totalAuditPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                disabled={auditPage <= 1}
                className={`px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors ${disabledButtonClass}`}
              >
                Précédent
              </button>
              <button
                onClick={() =>
                  setAuditPage((p) => Math.min(totalAuditPages, p + 1))
                }
                disabled={auditPage >= totalAuditPages}
                className={`px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors ${disabledButtonClass}`}
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

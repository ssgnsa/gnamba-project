import type { FoncierLot } from "../../types";
import type { Village, VillagesData } from "../../types/village";
import villagesData from "../../lib/villages.json";

export const statutConfig: Record<
  string,
  { label: string; color: "green" | "gray" | "red" | "orange" | "blue" }
> = {
  actif: { label: "Actif", color: "green" },
  vendu: { label: "Vendu", color: "blue" },
  litige: { label: "Litige", color: "red" },
  reserve: { label: "Réservé", color: "orange" },
  annule: { label: "Annulé", color: "gray" },
};

// Village data from centralized villages.json
export const villagesDataTyped: VillagesData = villagesData as VillagesData;
export const villagesList: Village[] = villagesDataTyped.villages.filter(
  (v) => v.active,
);

// Backward compatibility: array of village names (deprecated, use villagesList instead)
export const villages = villagesList.map((v) => v.nom);

// Helper to find village by ID
export function findVillageById(id: string): Village | undefined {
  return villagesList.find((v) => v.id === id);
}

// Helper to get village options for dropdown
export function getVillageOptions(): Array<{ value: string; label: string }> {
  return villagesList.map((v) => ({
    value: v.id,
    label: `${v.nom} (${v.commune})`,
  }));
}

export type FoncierConfigKey =
  | "region"
  | "departement"
  | "commune"
  | "village"
  | "chef_village"
  | "arrete_prefectoral"
  | "nom_chef_signe"
  | "lieu_signature"
  | "logo_url"
  | "village_logo_url"
  | "primary_color"
  | "layout_preference";

export type FoncierConfigMap = Record<FoncierConfigKey, string>;

export const emptyConfig: FoncierConfigMap = {
  region: "",
  departement: "",
  commune: "",
  village: "",
  chef_village: "",
  arrete_prefectoral: "",
  nom_chef_signe: "",
  lieu_signature: "",
  logo_url: "",
  village_logo_url: "",
  primary_color: "",
  layout_preference: "",
};

export type AttestationTemoinForm = {
  nom: string;
  prenom: string;
  profession: string;
  telephone: string;
  cni: string;
};

export type AttestationForm = {
  attestation_type: "standard" | "cession";
  mode_acquisition: string;
  historique_possession: string;
  domicile: string;
  cedant_nom: string;
  cedant_prenom: string;
  cedant_cni_numero: string;
  cedant_telephone: string;
  cedant_domicile: string;
  limites_nord: string;
  limites_sud: string;
  limites_est: string;
  limites_ouest: string;
  gps_lat: string;
  gps_lng: string;
  gps_precision: string;
  gps_nord_lat: string;
  gps_nord_lng: string;
  gps_sud_lat: string;
  gps_sud_lng: string;
  gps_est_lat: string;
  gps_est_lng: string;
  gps_ouest_lat: string;
  gps_ouest_lng: string;
  registre_volume: string;
  registre_page: string;
  registre_ligne: string;
  numero_enregistrement: string;
  temoins: AttestationTemoinForm[];
  original: boolean;
  validation_agent_nom: string;
  validation_chef_nom: string;
};

export type AuditRecord = {
  id: string;
  parcelle_id: string | null;
  action: string;
  utilisateur_nom: string | null;
  date_action: string;
  details: Record<string, unknown> | null;
  foncier_lots?:
    | {
        reference: string;
        numero_lot: string;
        village: string;
      }
    | null;
};

export type AttestationHistoryItem = {
  id: string;
  reference: string;
  version: number | null;
  statut: string | null;
  created_at: string;
  date_etablissement: string | null;
  deleted_at: string | null;
  validation_chef_date: string | null;
};

export type AttestationScan = { url: string; original_name: string };

export type AuditQueryRow = {
  id: string;
  lot_id: string;
  action: string;
  performed_by: string | null;
  performed_at: string;
  old_values: any;
  new_values: any;
  foncier_lots: {
    reference: string;
    numero_lot: string;
    village: string;
  } | null;
};

export const auditActions = [
  "CREATION",
  "MODIFICATION",
  "SUPPRESSION",
  "ARCHIVE",
  "RESTORE",
  "TRANSFERT",
  "SOUMISSION",
  "SOUMISSION_CHEF",
  "VALIDATION",
  "VALIDATION_CHEF",
  "SCAN_ORIGINAL",
  "ARCHIVAGE_ATTESTATION",
  "REEMISSION_CESSION",
  "IMPRESSION",
];

export const getLocalDateInput = () => {
  const now = new Date();
  const tzOffsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tzOffsetMs).toISOString().slice(0, 10);
};

export const createEmptyForm = () => ({
  reference: "",
  numero_lot: "",
  numero_ilot: "",
  nom_lotissement: "",
  quartier: "",
  village: "",
  commune: "",
  departement: "",
  region: "",
  superficie: "",
  code_barre: "",
  proprietaire_nom: "",
  proprietaire_prenom: "",
  proprietaire_naissance_date: "",
  proprietaire_naissance_lieu: "",
  proprietaire_cni_numero: "",
  proprietaire_cni_date: "",
  proprietaire_cni_lieu: "",
  proprietaire_profession: "",
  proprietaire_telephone: "",
  chef_village: "",
  arrete_prefectoral: "",
  arrete_date: "",
  statut: "actif" as FoncierLot["statut"],
  date_cession: getLocalDateInput(),
  prix_cession: "",
  notes: "",
});

export const createAttestationForm = (): AttestationForm => ({
  attestation_type: "standard",
  mode_acquisition: "",
  historique_possession: "",
  domicile: "",
  cedant_nom: "",
  cedant_prenom: "",
  cedant_cni_numero: "",
  cedant_telephone: "",
  cedant_domicile: "",
  limites_nord: "",
  limites_sud: "",
  limites_est: "",
  limites_ouest: "",
  gps_lat: "",
  gps_lng: "",
  gps_precision: "",
  gps_nord_lat: "",
  gps_nord_lng: "",
  gps_sud_lat: "",
  gps_sud_lng: "",
  gps_est_lat: "",
  gps_est_lng: "",
  gps_ouest_lat: "",
  gps_ouest_lng: "",
  registre_volume: "",
  registre_page: "",
  registre_ligne: "",
  numero_enregistrement: "",
  temoins: [
    { nom: "", prenom: "", profession: "", telephone: "", cni: "" },
    { nom: "", prenom: "", profession: "", telephone: "", cni: "" },
    { nom: "", prenom: "", profession: "", telephone: "", cni: "" },
  ],
  original: true,
  validation_agent_nom: "",
  validation_chef_nom: "",
});

export const getAttestationStatusInfo = (
  record: AttestationHistoryItem | null,
) => {
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

export const generateControlNumber = (input: string) => {
  const digits = (input.replace(/\D/g, "") + Date.now().toString()).slice(-16);
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return `${digits}${checkDigit}`.slice(-8);
};

export const buildGpsPoints = (form: AttestationForm) => {
  const points = [
    {
      label: "Nord",
      lat: Number.isNaN(Number(form.gps_nord_lat))
        ? null
        : Number(form.gps_nord_lat),
      lng: Number.isNaN(Number(form.gps_nord_lng))
        ? null
        : Number(form.gps_nord_lng),
    },
    {
      label: "Sud",
      lat: Number.isNaN(Number(form.gps_sud_lat))
        ? null
        : Number(form.gps_sud_lat),
      lng: Number.isNaN(Number(form.gps_sud_lng))
        ? null
        : Number(form.gps_sud_lng),
    },
    {
      label: "Est",
      lat: Number.isNaN(Number(form.gps_est_lat))
        ? null
        : Number(form.gps_est_lat),
      lng: Number.isNaN(Number(form.gps_est_lng))
        ? null
        : Number(form.gps_est_lng),
    },
    {
      label: "Ouest",
      lat: Number.isNaN(Number(form.gps_ouest_lat))
        ? null
        : Number(form.gps_ouest_lat),
      lng: Number.isNaN(Number(form.gps_ouest_lng))
        ? null
        : Number(form.gps_ouest_lng),
    },
  ]
    .filter((point) => point.lat != null && point.lng != null)
    .map((point) => ({
      label: point.label,
      lat: point.lat as number,
      lng: point.lng as number,
    }));
  return points.length ? points : null;
};

export const parseAttestationSnapshot = (payload?: string | null) => {
  if (!payload) return null;
  try {
    const parsed = JSON.parse(payload) as Record<string, unknown>;
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    // ignore parse errors
  }
  return null;
};

export const buildVillageStats = (rows: FoncierLot[]) => {
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

export const isMissingColumnError = (error: any, column: string) => {
  const message = typeof error?.message === "string" ? error.message : "";
  const code = typeof error?.code === "string" ? error.code : "";
  return (
    code === "42703" || message.includes(`column "${column}" does not exist`)
  );
};

export const isRateLimitError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const status = (error as { status?: number }).status;
  const message = (error as { message?: string }).message || "";
  return status === 429 || /rate limit|too many requests/i.test(message);
};

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const gpsBoundaryFields: Array<{
  label: string;
  latKey: keyof AttestationForm;
  lngKey: keyof AttestationForm;
}> = [
  { label: "Nord", latKey: "gps_nord_lat", lngKey: "gps_nord_lng" },
  { label: "Sud", latKey: "gps_sud_lat", lngKey: "gps_sud_lng" },
  { label: "Est", latKey: "gps_est_lat", lngKey: "gps_est_lng" },
  { label: "Ouest", latKey: "gps_ouest_lat", lngKey: "gps_ouest_lng" },
];

export const configFields: {
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

export interface VerificationLookup {
  ref?: string | null;
  control?: string | null;
  hash?: string | null;
}

export interface VerificationGpsPoint {
  label?: string;
  lat?: number;
  lng?: number;
}

export interface VerificationWitness {
  nom?: string;
  prenom?: string;
  profession?: string;
  telephone?: string;
  cni?: string;
}

export interface VerificationParcel {
  superficie_m2?: number;
  limites?: {
    nord?: string;
    sud?: string;
    est?: string;
    ouest?: string;
  } | null;
  coordonnees_gps?: {
    lat?: number;
    lng?: number;
    precision?: number;
  } | null;
  gps_points?: VerificationGpsPoint[] | null;
}

export interface VerificationHolder {
  nom?: string;
  prenom?: string;
  naissance_date?: string;
  naissance_lieu?: string;
  domicile?: string;
  profession?: string;
  cni_numero?: string;
  cni_date?: string;
  cni_lieu?: string;
  telephone?: string;
}

export interface VerificationVillageInfo {
  region?: string;
  departement?: string;
  commune?: string;
  village?: string;
  quartier?: string;
  lotissement?: string;
  numero_lot?: string;
  numero_ilot?: string;
}

export interface VerificationValidation {
  agent_nom?: string;
  chef_nom?: string;
}

export interface VerificationResult {
  reference?: string;
  statut?: string;
  date_etablissement?: string;
  numero_enregistrement?: string;
  control_number?: string;
  signature_valid?: boolean;
  hash_valid?: boolean;
  hash_sha256?: string;
  document_authentic?: boolean;
  attestation_type?: string;
  version?: number;
  original?: boolean;
  lot?: {
    reference?: string;
    numero_lot?: string;
    nom_lotissement?: string;
    village?: string;
    proprietaire_prenom?: string;
    proprietaire_nom?: string;
    superficie?: number;
    quartier?: string;
  } | null;
  titulaire?: VerificationHolder | null;
  parcelle?: VerificationParcel | null;
  temoins?: VerificationWitness[];
  village_info?: VerificationVillageInfo | null;
  validation?: VerificationValidation | null;
}

const rawMode = String(import.meta.env.VITE_SUPABASE_MODE || "").toLowerCase();
const supabaseMode =
  rawMode === "local" || rawMode === "cloud" ? rawMode : "auto";

const resolveSupabaseUrl = () => {
  if (supabaseMode === "local") return import.meta.env.VITE_SUPABASE_LOCAL_URL;
  if (supabaseMode === "cloud") return import.meta.env.VITE_SUPABASE_URL;
  return (
    import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_LOCAL_URL
  );
};

const resolveSupabaseAnonKey = () => {
  if (supabaseMode === "local")
    return import.meta.env.VITE_SUPABASE_LOCAL_ANON_KEY;
  if (supabaseMode === "cloud") return import.meta.env.VITE_SUPABASE_ANON_KEY;
  return (
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_LOCAL_ANON_KEY
  );
};

const normalizeLookup = (
  input: string | VerificationLookup,
): VerificationLookup => {
  if (typeof input === "string") {
    return { ref: input };
  }

  return input || {};
};

const sanitizeLookup = (input: VerificationLookup): VerificationLookup => {
  const ref = String(input.ref || "")
    .trim()
    .toUpperCase();
  const control = String(input.control || "").trim();
  const hash = String(input.hash || "")
    .trim()
    .toLowerCase();
  return {
    ref: ref || null,
    control: control || null,
    hash: hash || null,
  };
};

const buildVerificationSearch = (lookup: VerificationLookup) => {
  const params = new URLSearchParams();
  if (lookup.ref) params.set("ref", lookup.ref);
  if (lookup.control) params.set("control", lookup.control);
  if (lookup.hash) params.set("hash", lookup.hash);
  return params.toString();
};

const getFunctionEndpoint = (lookup: VerificationLookup) => {
  const supabaseUrl = resolveSupabaseUrl();
  if (!supabaseUrl) {
    throw new Error("Configuration Supabase manquante.");
  }

  const endpoint = new URL("/functions/v1/attestation-verify", supabaseUrl);
  endpoint.search = buildVerificationSearch(lookup);
  return endpoint.toString();
};

const parseErrorMessage = async (response: Response) => {
  try {
    const payload = await response.json();
    if (payload && typeof payload.error === "string") return payload.error;
  } catch {
    // ignore JSON parse errors
  }
  return `Vérification impossible (${response.status}).`;
};

/**
 * Vérifie l'authenticité d'une attestation via l'Edge Function `attestation-verify`.
 * Accepte ref, control_number ou hash.
 */
export async function verifyAttestation(
  input: string | VerificationLookup,
): Promise<VerificationResult> {
  const normalized = sanitizeLookup(normalizeLookup(input));
  if (!normalized.ref && !normalized.control && !normalized.hash) {
    throw new Error("Référence, numéro de contrôle ou hash requis.");
  }

  const anonKey = resolveSupabaseAnonKey();
  if (!anonKey) {
    throw new Error("Clé Supabase anonyme manquante.");
  }

  const response = await fetch(getFunctionEndpoint(normalized), {
    method: "GET",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const payload = await response.json();
  return (payload || {}) as VerificationResult;
}

/**
 * Génère l'URL publique de vérification pour le QR code.
 */
export function generateVerificationUrl(
  input: string | VerificationLookup,
): string {
  const normalized = sanitizeLookup(normalizeLookup(input));
  const origin =
    typeof window !== "undefined" && window.location
      ? window.location.origin
      : "http://localhost";
  const url = new URL("/verification-attestation", origin);

  if (normalized.ref) url.searchParams.set("ref", normalized.ref);
  if (normalized.control) url.searchParams.set("control", normalized.control);
  if (normalized.hash) url.searchParams.set("hash", normalized.hash);

  return url.toString();
}

/**
 * Génère l'URL canonique de vérification sur un domaine fixe.
 */
export function generateCanonicalVerificationUrl(
  input: string | VerificationLookup,
  domain: string = "portal.gnambaservices.ci",
): string {
  const normalized = sanitizeLookup(normalizeLookup(input));
  const url = new URL("/verification-attestation", `https://${domain}`);

  if (normalized.ref) url.searchParams.set("ref", normalized.ref);
  if (normalized.control) url.searchParams.set("control", normalized.control);
  if (normalized.hash) url.searchParams.set("hash", normalized.hash);

  return url.toString();
}

/**
 * Alias de compatibilité.
 */
export async function fetchAttestationVerification(
  input: string | VerificationLookup,
): Promise<VerificationResult> {
  return verifyAttestation(input);
}

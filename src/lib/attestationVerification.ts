import { getLocalApiBaseUrl } from "./selfHosted";
import apiClient from "../api/client";

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

/**
 * Vérifie l'authenticité d'une attestation via l'API locale versionnée.
 * Accepte ref, control_number ou hash.
 */
export async function verifyAttestation(
  input: string | VerificationLookup,
): Promise<VerificationResult> {
  const normalized = sanitizeLookup(normalizeLookup(input));
  if (!normalized.ref && !normalized.control && !normalized.hash) {
    throw new Error("Référence, numéro de contrôle ou hash requis.");
  }

  const query = buildVerificationSearch(normalized);
  const path = `/api/v1/foncier/attestations/verify${query ? `?${query}` : ""}`;

  const result = await apiClient.request<VerificationResult>(path);
  if (result.error) {
    throw new Error(
      result.error || `Vérification impossible (${result.status}).`,
    );
  }

  return (result.data || {}) as VerificationResult;
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
      : getLocalApiBaseUrl();
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
  domain: string = "gnambaservices.ci",
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

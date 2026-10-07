import DOMPurify from "dompurify";
import type { AttestationForm } from "../components/foncier/FoncierConstants";
import type { FoncierLot } from "../types";
import { parseNumberInput } from "../utils/reference";

export const FONCIER_ATTESTATION_TEMOIN_SELECT =
  "id, attestation_id, nom, prenom, profession, telephone, cni, empreinte_url, created_at";

export const FONCIER_ATTESTATION_SELECT =
  "id, lot_id, reference, version, type, statut, date_etablissement, date_expiration, mode_acquisition, historique_possession, domicile, cedant_nom, cedant_prenom, cedant_cni_numero, cedant_telephone, cedant_domicile, limites_nord, limites_sud, limites_est, limites_ouest, gps_lat, gps_lng, gps_precision, gps_points, registre_volume, registre_page, registre_ligne, numero_enregistrement, qr_payload, signature_numerique, hash_sha256, reference_sequence, control_number, signature_nonce, signature_issued_at, validation_agent_nom, validation_agent_id, validation_agent_date, validation_chef_nom, validation_chef_id, validation_chef_date, proprietaire_photo_url, proprietaire_empreinte_url, chef_signature_manuscrite_requise, chef_empreinte_url, temoin_empreinte_urls, revoke_reason, revoked_at, revoked_by, verify_url, pdf_path, pdf_generated_at, printed_by, printed_at, print_count, created_by, created_at, updated_at, client_updated_at, last_modified_device_id, deleted_at";

export const FONCIER_ATTESTATION_WITH_TEMOINS_SELECT =
  `${FONCIER_ATTESTATION_SELECT}, foncier_attestation_temoins(${FONCIER_ATTESTATION_TEMOIN_SELECT})`;

export const FONCIER_LOT_SELECT =
  "id, reference, numero_lot, numero_ilot, ilot, nom_lotissement, quartier, village, village_id, lotissement_id, ilot_id, commune, departement, region, superficie, code_barre, latitude, longitude, gps_precision, limite_nord_lat, limite_nord_lng, limite_sud_lat, limite_sud_lng, limite_est_lat, limite_est_lng, limite_ouest_lat, limite_ouest_lng, proprietaire_nom, proprietaire_prenom, proprietaire_naissance_date, proprietaire_naissance_lieu, proprietaire_cni_numero, proprietaire_cni_date, proprietaire_cni_lieu, proprietaire_profession, proprietaire_telephone, chef_village, arrete_prefectoral, arrete_date, statut, publier_sur_vitrine, date_cession, prix_cession, notes, created_at, updated_at, deleted_at, deleted_by, deleted_reason, client_updated_at, last_modified_device_id, row_version, retention_until";

export const sanitizeText = (value: string | null | undefined): string => {
  if (!value) return "";
  return DOMPurify.sanitize(value.trim(), {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }).trim();
};

export const normalizeOptionalText = (
  value: string | null | undefined,
): string | null => {
  const sanitized = sanitizeText(value);
  return sanitized ? sanitized : null;
};

export const buildFoncierAttestationWitnessPayload = (
  temoins: AttestationForm["temoins"],
) => {
  return (temoins || []).map((temoin) => ({
    nom: sanitizeText(temoin.nom),
    prenom: sanitizeText(temoin.prenom),
    profession: sanitizeText(temoin.profession || ""),
    telephone: sanitizeText(temoin.telephone || ""),
    cni: sanitizeText(temoin.cni || ""),
  }));
};

export function buildAttestationRpcParams(options: {
  attestationForm: AttestationForm;
  attestationLot: FoncierLot;
  signatureNonce: string;
  signatureIssuedAt: string;
  deviceId: string;
  baseAttestationId?: string | null;
  isCession: boolean;
}) {
  const {
    attestationForm,
    signatureNonce,
    signatureIssuedAt,
    deviceId,
    baseAttestationId,
    isCession,
  } = options;

  const gpsLat = parseNumberInput(attestationForm.gps_lat);
  const gpsLng = parseNumberInput(attestationForm.gps_lng);
  const gpsPrecision = parseNumberInput(attestationForm.gps_precision);
  const gpsPoints = buildGpsPoints(attestationForm);
  const registrePage = parseNumberInput(attestationForm.registre_page);
  const registreLigne = parseNumberInput(attestationForm.registre_ligne);

  return {
    p_lot_id: options.attestationLot.id,
    p_attestation_type: attestationForm.attestation_type,
    p_original: attestationForm.original,
    p_mode_acquisition: normalizeOptionalText(attestationForm.mode_acquisition),
    p_historique_possession: normalizeOptionalText(
      attestationForm.historique_possession,
    ),
    p_domicile: normalizeOptionalText(attestationForm.domicile),
    p_limites_nord: normalizeOptionalText(attestationForm.limites_nord),
    p_limites_sud: normalizeOptionalText(attestationForm.limites_sud),
    p_limites_est: normalizeOptionalText(attestationForm.limites_est),
    p_limites_ouest: normalizeOptionalText(attestationForm.limites_ouest),
    p_gps_lat: gpsLat,
    p_gps_lng: gpsLng,
    p_gps_precision: gpsPrecision,
    p_gps_points: gpsPoints || [],
    p_registre_volume: normalizeOptionalText(attestationForm.registre_volume),
    p_registre_page: registrePage,
    p_registre_ligne: registreLigne,
    p_numero_enregistrement: normalizeOptionalText(
      attestationForm.numero_enregistrement,
    ),
    p_temoins: buildFoncierAttestationWitnessPayload(attestationForm.temoins),
    p_validation_agent_nom: normalizeOptionalText(
      attestationForm.validation_agent_nom,
    ),
    p_validation_chef_nom: normalizeOptionalText(
      attestationForm.validation_chef_nom,
    ),
    p_signature_nonce: signatureNonce,
    p_signature_issued_at: signatureIssuedAt,
    p_previous_attestation_id: baseAttestationId || null,
    p_last_modified_device_id: deviceId,
    p_cedant_nom: isCession
      ? normalizeOptionalText(attestationForm.cedant_nom)
      : null,
    p_cedant_prenom: isCession
      ? normalizeOptionalText(attestationForm.cedant_prenom)
      : null,
    p_cedant_cni_numero: isCession
      ? normalizeOptionalText(attestationForm.cedant_cni_numero)
      : null,
    p_cedant_telephone: isCession
      ? normalizeOptionalText(attestationForm.cedant_telephone)
      : null,
    p_cedant_domicile: isCession
      ? normalizeOptionalText(attestationForm.cedant_domicile)
      : null,
  };
}

function buildGpsPoints(form: AttestationForm) {
  const points = [
    {
      label: "Nord",
      lat: parseNumberInput(form.gps_nord_lat),
      lng: parseNumberInput(form.gps_nord_lng),
    },
    {
      label: "Sud",
      lat: parseNumberInput(form.gps_sud_lat),
      lng: parseNumberInput(form.gps_sud_lng),
    },
    {
      label: "Est",
      lat: parseNumberInput(form.gps_est_lat),
      lng: parseNumberInput(form.gps_est_lng),
    },
    {
      label: "Ouest",
      lat: parseNumberInput(form.gps_ouest_lat),
      lng: parseNumberInput(form.gps_ouest_lng),
    },
  ]
    .filter((point) => point.lat != null && point.lng != null)
    .map((point) => ({
      label: point.label,
      lat: point.lat as number,
      lng: point.lng as number,
    }));
  return points.length ? points : null;
}

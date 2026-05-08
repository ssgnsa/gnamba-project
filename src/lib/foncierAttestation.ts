import DOMPurify from "dompurify";
import type { AttestationForm } from "../components/foncier/FoncierConstants";
import type { FoncierLot } from "../types";
import { parseNumberInput } from "../utils/reference";

export const sanitizeText = (value: string | null | undefined): string => {
  if (!value) return "";
  return DOMPurify.sanitize(value.trim());
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

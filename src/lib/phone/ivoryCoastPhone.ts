/**
 * Utilitaire centralisé pour la validation et la normalisation
 * des numéros de téléphone ivoiriens.
 *
 * Politique canonique retenue :
 * - les valeurs sont traitées comme des chaînes de caractères ;
 * - le format interne est +225XXXXXXXXXX avec le zéro conservé ;
 * - les entrées nationales et internationales sont acceptées avec espaces, tirets et sans séparateurs.
 */

export const IVORIAN_PHONE_REGEX =
  /^(?:(?:\+225|00225)\s*)?(?:01|05|07)(?:[\s.-]?\d{2}){4}$/;

export function validateIvoryCoastPhone(phone: string): string | null {
  if (!phone || !phone.trim()) return null;

  const normalized = normalizeIvoryCoastPhone(phone);
  if (!normalized) {
    return "Format de téléphone invalide. Ex: +225 07 07 38 15 63 ou 0707381563";
  }

  return null;
}

export function normalizeIvoryCoastPhone(phone: string): string | null {
  if (!phone || !phone.trim()) return null;

  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;

  let national = digits;
  if (national.startsWith("225")) {
    national = national.slice(3);
  } else if (national.startsWith("00225")) {
    national = national.slice(5);
  }

  if (!/^(?:01|05|07)\d{8}$/.test(national)) {
    return null;
  }

  return `+225${national}`;
}

export function areEquivalentIvoryCoastPhones(phone1: string, phone2: string): boolean {
  const normalized1 = normalizeIvoryCoastPhone(phone1);
  const normalized2 = normalizeIvoryCoastPhone(phone2);

  if (!normalized1 && !normalized2) return true;
  if (!normalized1 || !normalized2) return false;

  return normalized1 === normalized2;
}

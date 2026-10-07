// /lib/hash.ts — Génération SHA-256 pour l'intégrité des attestations
import { createHash } from "crypto";

/**
 * Calcule le hash SHA-256 d'une attestation
 * Le hash est calculé sur les données canoniques (triées) pour garantir le déterminisme
 *
 * ⚠ IMPORTANT : Ce hash doit être calculé CÔTÉ SERVEUR uniquement
 * Ne jamais calculer le hash côté client
 */
export function computeAttestationHash(data: {
  ref: string;
  villageId: string;
  beneficiaireNom: string;
  beneficiairePrenom: string;
  cniNum: string;
  lotNum: string;
  superficie: number;
  dateEmission: string; // ISO 8601
}): string {
  // Créer un objet canonique avec les clés triées
  const canonical = JSON.stringify(data, Object.keys(data).sort());

  // Calculer le hash SHA-256
  return createHash("sha256").update(canonical).digest("hex");
}

/**
 * Génère un numéro de contrôle unique (8 chiffres)
 * Utilise l'algorithme de Luhn pour la validation
 */
export function generateControlNumber(input: string): string {
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
}

/**
 * Génère un numéro de référence unique pour une attestation
 * Format : ATT-YYYYMMDD-XXXX
 */
export function generateAttestationReference(
  prefix: string = "ATT",
  date?: Date,
): string {
  const d = date || new Date();
  const yearMonthDay = d.toISOString().split("T")[0].replace(/-/g, "");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `${prefix}-${yearMonthDay}-${random}`;
}

/**
 * Vérifie si un hash correspond aux données fournies
 * Utilisé pour la vérification d'intégrité
 */
export function verifyAttestationHash(
  data: {
    ref: string;
    villageId: string;
    beneficiaireNom: string;
    beneficiairePrenom: string;
    cniNum: string;
    lotNum: string;
    superficie: number;
    dateEmission: string;
  },
  expectedHash: string,
): boolean {
  const computedHash = computeAttestationHash(data);
  return computedHash === expectedHash;
}

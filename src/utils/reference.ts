export function generateReference(prefix: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}${month}${day}-${rand}`;
}

// Référence foncière: FONC-YYYY-MM-DD-XXXXX
export function generateFoncierReference(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `FONC-${year}-${month}-${day}-${rand}`;
}

export function normalizeCode(value: string, maxLen: number): string {
  if (!value) return "";
  const ascii = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const cleaned = ascii.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return cleaned.slice(0, maxLen);
}

function formatIlot(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits) return digits.padStart(2, "0").slice(-2);
  return normalizeCode(value, 2);
}

function formatLot(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits) return digits.padStart(2, "0").slice(-2);
  return normalizeCode(value, 2);
}

export function buildFoncierReference(input: {
  village: string;
  lotissement: string;
  ilot: string;
  lot: string;
  villageCode?: string;
  lotissementCode?: string;
  ilotCode?: string;
}): string {
  const village = normalizeCode(input.villageCode || input.village, 3);
  const lotissement = normalizeCode(
    input.lotissementCode || input.lotissement,
    4,
  );
  const ilot = formatIlot(input.ilotCode || input.ilot || "");
  const lot = formatLot(input.lot || "");
  if (!village || !lotissement || !ilot || !lot) return "";
  return `${village}-${lotissement}-${ilot}-${lot}`;
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateLong(dateStr?: string): string {
  if (!dateStr) {
    return new Date().toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatMontant(montant: number): string {
  return montant.toLocaleString("fr-FR");
}

/**
 * Normalise une date au format français (JJ/MM/AAAA) vers ISO (AAAA-MM-JJ)
 * Retourne une chaîne vide si la date est invalide
 */
export function normalizeFrDate(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  // Si déjà ISO, retourner tel quel
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // Convertir FR → ISO
  const match = /^(\d{2})\s*\/\s*(\d{2})\s*\/\s*(\d{4})$/.exec(trimmed);
  if (match) {
    const [, d, m, y] = match;
    const iso = `${y}-${m}-${d}`;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return iso;
  }

  // Date invalide
  return "";
}

/**
 * Vérifie si une date au format français est valide
 */
export function isValidFrDate(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true; // Champ vide considéré comme valide (optionnel)

  const match = /^(\d{2})\s*\/\s*(\d{2})\s*\/\s*(\d{4})$/.exec(trimmed);
  if (!match) return false;

  const [, d, m, y] = match;
  const iso = `${y}-${m}-${d}`;
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return false;

  // Vérifier que la date reconstruite correspond aux valeurs d'origine
  return (
    date.getUTCFullYear() === Number(y) &&
    date.getUTCMonth() + 1 === Number(m) &&
    date.getUTCDate() === Number(d)
  );
}

/**
 * Parse un input numérique (accepte virgule et espace comme séparateurs)
 * Retourne null si invalide
 */
export function parseNumberInput(value: string): number | null {
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Nettoie un texte : supprime les espaces superflus
 */
export function cleanText(value: string): string {
  return value.trim();
}

/**
 * Génère un UUID v4 de manière sécurisée
 * Fallback pour les environnements non-HTTPS où crypto.randomUUID() n'est pas disponible
 */
export function generateUUID(): string {
  // Essayer d'abord crypto.randomUUID() (navigateurs modernes HTTPS)
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    try {
      return crypto.randomUUID();
    } catch {
      // Continuer avec le fallback si erreur
    }
  }

  // Fallback : générer un UUID v4 manuel
  const hex = "0123456789abcdef";
  let uuid = "";
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid += "-";
    } else if (i === 14) {
      uuid += "4"; // Version 4
    } else if (i === 19) {
      uuid += hex[Math.floor(Math.random() * 4) + 8]; // 8, 9, a, ou b
    } else {
      uuid += hex[Math.floor(Math.random() * 16)];
    }
  }
  return uuid;
}

/**
 * Calcule un hash SHA-256 hexadécimal (client-side)
 */
export async function sha256Hex(input: string): Promise<string> {
  if (typeof crypto === "undefined" || !crypto.subtle) return "";
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

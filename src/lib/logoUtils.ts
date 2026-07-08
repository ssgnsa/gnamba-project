/**
 * Logo Utils - Gestion des URLs de logos avec fallback CORS
 * Résout les problèmes d'URL absente/invalide sans dépendre d'un stockage cloud.
 */

// Fallback logo SVG (cercle avec initiales)
export const FALLBACK_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%23e5e7eb"/><text x="50" y="65" font-family="Arial" font-size="40" fill="%236b7280" text-anchor="middle">?</text></svg>`;

/**
 * Conserve l'ancienne signature publique sans effectuer d'appel réseau.
 * Les URLs médias doivent désormais être servies par l'API/stockage local.
 */
export async function convertToSignedUrl(publicUrl: string): Promise<string> {
  return publicUrl || FALLBACK_LOGO_SVG;
}

/**
 * Le frontend self-hosted ne convertit plus d'URL cloud côté client.
 */
export function needsSignedConversion(_url: string): boolean {
  return false;
}

/**
 * Normalise une URL de logo pour éviter les problèmes CORS
 * Retourne toujours une URL valide (avec fallback)
 */
export async function normalizeLogoUrl(url: string): Promise<string> {
  // Si pas d'URL ou URL data/blob, retourner directement
  if (!url) {
    return FALLBACK_LOGO_SVG;
  }
  
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  
  // Si c'est une URL API locale qui nécessite conversion
  if (needsSignedConversion(url)) {
    return await convertToSignedUrl(url);
  }
  
  // Pour les autres URLs, vérifier si valide
  try {
    new URL(url);
    return url;
  } catch {
    return FALLBACK_LOGO_SVG;
  }
}

/**
 * @deprecated Bucket 'village-logos' supprimé.
 * Les logos villages sont désormais dans le bucket 'media' (catégorie foncier_villages)
 * et accessibles via getUsageForSlot('foncier_village', entityId, 'logo').
 */
export function createVillageLogoUrl(_fileName: string): string {
  return FALLBACK_LOGO_SVG;
}

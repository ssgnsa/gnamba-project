/**
 * Logo Utils - Gestion des URLs de logos avec fallback CORS
 * Résout les problèmes OpaqueResponseBlocking et 401 pour les logos Supabase Storage
 */

import { supabase } from './supabase';

// Buckets publics (pas besoin de signed URL)
const PUBLIC_BUCKETS = ['media', 'logos', 'public'];

// Fallback logo SVG (cercle avec initiales)
export const FALLBACK_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%23e5e7eb"/><text x="50" y="65" font-family="Arial" font-size="40" fill="%236b7280" text-anchor="middle">?</text></svg>`;

/**
 * Convertit une ancienne URL publique Supabase Storage en URL signée avec CORS
 * Évite les erreurs OpaqueResponseBlocking
 * Gère les erreurs 401 et Object not found avec fallback
 */
export async function convertToSignedUrl(publicUrl: string): Promise<string> {
  try {
    // Si déjà une URL data/blob, la retourner directement
    if (!publicUrl || publicUrl.startsWith('data:') || publicUrl.startsWith('blob:')) {
      return publicUrl || FALLBACK_LOGO_SVG;
    }

    // Si l'URL est déjà signée mais avec un token expiré, extraire le chemin proprement
    if (publicUrl.includes('/storage/v1/sign/')) {
      const signPattern = /\/storage\/v1\/sign\/([^/]+)\/([^?]+)/;
      const signMatch = publicUrl.match(signPattern);
      
      if (signMatch) {
        const bucket = signMatch[1];
        const filePath = decodeURIComponent(signMatch[2]);
        
        // Créer une nouvelle URL signée fraîche
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(filePath, 31536000);
        
        if (error) {
          // Gérer spécifiquement les erreurs 401 et Object not found
          if (error.message?.includes('Object not found') || error.status === 401 || error.status === 404) {
            console.warn('[LogoUtils] Logo non trouvé ou accès refusé, fallback activé:', filePath);
            return FALLBACK_LOGO_SVG;
          }
          console.warn('[LogoUtils] Erreur recréation URL signée:', error);
          return FALLBACK_LOGO_SVG;
        }
        
        return data.signedUrl;
      }
    }
    
    // Extraire le chemin du fichier de l'URL publique
    const urlPattern = /\/storage\/v1\/object\/(?:public\/)?([^/]+)\/(.+)/;
    const match = publicUrl.match(urlPattern);
    
    if (!match) {
      console.warn('[LogoUtils] URL format non reconnu, fallback:', publicUrl);
      return FALLBACK_LOGO_SVG;
    }
    
    const bucket = match[1];
    const filePath = match[2];
    
    // Bucket public → getPublicUrl (pas d'auth requise)
    if (PUBLIC_BUCKETS.includes(bucket)) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      return data.publicUrl;
    }
    
    // Bucket privé → URL signée (nécessite session)
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 31536000);
    
    if (error) {
      if (error.message?.includes('Object not found') || error.status === 404) {
        console.warn('[LogoUtils] Object not found:', filePath);
        return FALLBACK_LOGO_SVG;
      }
      if (error.status === 401) {
        console.warn('[LogoUtils] Erreur 401 - Token invalide ou expiré');
        return FALLBACK_LOGO_SVG;
      }
      console.warn('[LogoUtils] Erreur création URL signée:', error);
      return FALLBACK_LOGO_SVG;
    }
    
    return data.signedUrl;
  } catch (error) {
    console.error('[LogoUtils] Exception conversion URL:', error);
    return FALLBACK_LOGO_SVG;
  }
}

/**
 * Vérifie si une URL est une URL Supabase Storage qui nécessite une conversion/signing
 * Gère les URLs publiques (object) et les URLs signées expirées (sign)
 */
export function needsSignedConversion(url: string): boolean {
  if (!url || (!url.includes('supabase.co') && !url.includes('supabase.in'))) {
    return false;
  }
  
  // URL déjà publique (/object/public/) → accessible sans auth, pas de conversion
  if (url.includes('/storage/v1/object/public/')) {
    return false;
  }

  // URL objet privé (/object/ sans /public/) → nécessite une signed URL
  if (url.includes('/storage/v1/object/')) {
    return true;
  }
  
  // URL signée existante (peut être expirée, on la rafraîchit)
  if (url.includes('/storage/v1/sign/')) {
    return true;
  }
  
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
  
  // Si c'est une URL Supabase qui nécessite conversion
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

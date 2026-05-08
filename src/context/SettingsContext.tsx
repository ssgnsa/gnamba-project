/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { supabase } from "../lib/supabase";
import { BrandSettings } from "../types";

// ============================================
// CONSTANTES ET CACHE
// ============================================

const CACHE_KEY = "egs:settings:cache:v2";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const defaultSettings: BrandSettings = {
  app_title: "EGS",
  app_subtitle: "Enterprise Gnamba System",
  app_company: "Gnamba Services",
  primary_color: "#1e40af",
  secondary_color: "#16a34a",
  logo_url: "",
  // Contact
  contact_address: "Abidjan, Côte d'Ivoire",
  contact_phone: "+225 XX XX XX XX XX",
  contact_email: "contact@gnambaservices.ci",
  contact_hours: "Lun-Ven : 08h – 18h",
  // Social media
  social_facebook: "",
  social_youtube: "",
  social_linkedin: "",
  social_twitter: "",
  social_instagram: "",
  social_tiktok: "",
  // SEO
  seo_description:
    "Gnamba Services - BTP, Immobilier, Foncier en Côte d'Ivoire",
  seo_keywords:
    "BTP, immobilier, foncier, construction, Abidjan, Côte d'Ivoire",
  // Brand assets
  brand_logo_dark: "",
  brand_favicon_url: "",
  brand_watermark_url: "",
  // Site vitrine backgrounds
  hero_background_url: "",
};

// ============================================
// TYPES
// ============================================

interface SettingsContextType {
  settings: BrandSettings;
  loading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
  updateSetting: (key: keyof BrandSettings, value: string) => Promise<void>;
  updateSettings: (updates: Partial<BrandSettings>) => Promise<void>;
  hasLoadedOnce: boolean;
}

interface CachedSettings {
  data: BrandSettings;
  timestamp: number;
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Récupère les paramètres depuis le cache localStorage
 */
function getCachedSettings(): BrandSettings | null {
  if (typeof window === "undefined") return null;

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const parsed: CachedSettings = JSON.parse(cached);
    const isExpired = Date.now() - parsed.timestamp > CACHE_TTL;

    if (isExpired) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return parsed.data;
  } catch (error) {
    if (import.meta.env.DEV)
      console.warn("Erreur lors de la lecture du cache des paramètres:", error);
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
}

/**
 * Sauvegarde les paramètres dans le cache localStorage
 */
function cacheSettings(settings: BrandSettings): void {
  if (typeof window === "undefined") return;

  try {
    const cached: CachedSettings = {
      data: settings,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch (error) {
    if (import.meta.env.DEV)
      console.warn(
        "Erreur lors de la sauvegarde du cache des paramètres:",
        error,
      );
  }
}

// ============================================
// CONTEXTE
// ============================================

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: false,
  error: null,
  refreshSettings: async () => {},
  updateSetting: async () => {},
  updateSettings: async () => {},
  hasLoadedOnce: false,
});

// ============================================
// PROVIDER
// ============================================

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<BrandSettings>(() => {
    // Essayer de restaurer depuis le cache immédiatement
    const cached = getCachedSettings();
    return cached || defaultSettings;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  /**
   * Charge les paramètres depuis la base de données
   * Optimisé avec requêtes parallèles
   */
  const refreshSettings = useCallback(async () => {
    try {
      setError(null);

      // Charger les paramètres de base
      const { data: settingsData, error: settingsError } = await supabase
        .from("app_settings")
        .select("key, value");

      if (settingsError) {
        if (import.meta.env.DEV)
          console.error(
            "Erreur lors du chargement des paramètres:",
            settingsError,
          );
        setError(`Erreur de chargement: ${settingsError.message}`);
        return;
      }

      const map: Record<string, string> = {};
      settingsData?.forEach((row) => {
        map[row.key] = row.value || "";
      });

      // Charger les assets de marque depuis la media library (requête unique optimisée)
      const { data: mediaData } = await supabase
        .from("media_files")
        .select("url, brand_asset_type")
        .in("brand_asset_type", [
          "logo_principal",
          "favicon",
          "watermark",
          "logo_secondaire",
        ])
        .eq("is_brand_asset", true);

      const mediaMap: Record<string, string> = {};
      mediaData?.forEach((item) => {
        if (!mediaMap[item.brand_asset_type]) {
          mediaMap[item.brand_asset_type] = item.url;
        }
      });

      // Fusionner les paramètres avec fallback sur media_files
      const newSettings: BrandSettings = {
        app_title: map["app_title"] || defaultSettings.app_title,
        app_subtitle: map["app_subtitle"] || defaultSettings.app_subtitle,
        app_company: map["app_company"] || defaultSettings.app_company,
        primary_color: map["primary_color"] || defaultSettings.primary_color,
        secondary_color:
          map["secondary_color"] || defaultSettings.secondary_color,
        logo_url: map["logo_url"] || mediaMap["logo_principal"] || "",
        contact_address:
          map["contact_address"] || defaultSettings.contact_address,
        contact_phone: map["contact_phone"] || defaultSettings.contact_phone,
        contact_email: map["contact_email"] || defaultSettings.contact_email,
        contact_hours: map["contact_hours"] || defaultSettings.contact_hours,
        social_facebook:
          map["social_facebook"] || defaultSettings.social_facebook,
        social_youtube: map["social_youtube"] || defaultSettings.social_youtube,
        social_linkedin:
          map["social_linkedin"] || defaultSettings.social_linkedin,
        social_twitter: map["social_twitter"] || defaultSettings.social_twitter,
        social_instagram:
          map["social_instagram"] || defaultSettings.social_instagram,
        social_tiktok: map["social_tiktok"] || defaultSettings.social_tiktok,
        seo_description:
          map["seo_description"] || defaultSettings.seo_description,
        seo_keywords: map["seo_keywords"] || defaultSettings.seo_keywords,
        brand_logo_dark:
          map["brand_logo_dark"] || mediaMap["logo_secondaire"] || "",
        brand_favicon_url:
          map["brand_favicon_url"] || mediaMap["favicon"] || "",
        brand_watermark_url:
          map["brand_watermark_url"] || mediaMap["watermark"] || "",
        hero_background_url: map["hero_background_url"] || "",
      };

      setSettings(newSettings);
      cacheSettings(newSettings);
      setHasLoadedOnce(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur inconnue";
      if (import.meta.env.DEV)
        console.error(
          "Erreur inattendue lors du chargement des paramètres:",
          err,
        );
      setError(`Erreur inattendue: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Met à jour un seul paramètre
   */
  const updateSetting = async (key: keyof BrandSettings, value: string) => {
    setError(null);

    const { error } = await supabase
      .from("app_settings")
      .upsert(
        { key, value, updated_at: new Date().toISOString() },
        { onConflict: "key" },
      );

    if (error) {
      if (import.meta.env.DEV)
        console.error("Erreur lors de la mise à jour du paramètre:", error);
      setError(`Erreur de sauvegarde: ${error.message}`);
      throw error;
    }

    await refreshSettings();
  };

  /**
   * Met à jour plusieurs paramètres en une seule requête
   */
  const updateSettings = async (updates: Partial<BrandSettings>) => {
    setError(null);

    const updatesList = Object.entries(updates)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => ({
        key,
        value: value as string,
        updated_at: new Date().toISOString(),
      }));

    if (updatesList.length === 0) return;

    const { error } = await supabase
      .from("app_settings")
      .upsert(updatesList, { onConflict: "key" });

    if (error) {
      if (import.meta.env.DEV)
        console.error("Erreur lors de la mise à jour des paramètres:", error);
      setError(`Erreur de sauvegarde: ${error.message}`);
      throw error;
    }

    await refreshSettings();
  };

  // Chargement initial
  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  // ============================================
  // RENDU
  // ============================================

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        error,
        refreshSettings,
        updateSetting,
        updateSettings,
        hasLoadedOnce,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);

  if (context === undefined) {
    throw new Error(
      "useSettings doit être utilisé à l'intérieur d'un SettingsProvider",
    );
  }

  return context;
}

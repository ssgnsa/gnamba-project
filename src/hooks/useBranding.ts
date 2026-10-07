import { useMemo } from "react";
import { useSettings } from "../context/SettingsContext";

/**
 * Hook personnalisé pour accéder aux paramètres de marque de manière centralisée
 * Fournit des valeurs calculées et des utilitaires pour le branding
 */
export function useBranding() {
  const { settings, loading, refreshSettings } = useSettings();

  // Valeurs de couleur avec fallback
  const primaryColor = useMemo(
    () => settings.primary_color || "#1e40af",
    [settings.primary_color],
  );
  const secondaryColor = useMemo(
    () => settings.secondary_color || "#16a34a",
    [settings.secondary_color],
  );

  // URLs des logos avec fallback
  const logoUrl = useMemo(() => settings.logo_url, [settings.logo_url]);
  const logoDarkUrl = useMemo(
    () => settings.brand_logo_dark,
    [settings.brand_logo_dark],
  );
  const faviconUrl = useMemo(
    () => settings.brand_favicon_url,
    [settings.brand_favicon_url],
  );
  const watermarkUrl = useMemo(
    () => settings.brand_watermark_url,
    [settings.brand_watermark_url],
  );

  // Informations de l'entreprise
  const appTitle = useMemo(
    () => settings.app_title || "EGS",
    [settings.app_title],
  );
  const appSubtitle = useMemo(
    () => settings.app_subtitle || "Enterprise Gnamba System",
    [settings.app_subtitle],
  );
  const appCompany = useMemo(
    () => settings.app_company || "Gnamba Services",
    [settings.app_company],
  );

  // Initiales pour fallback logo
  const logoInitials = useMemo(() => {
    return appCompany
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [appCompany]);

  // Informations de contact
  const contact = useMemo(
    () => ({
      address: settings.contact_address || "Abidjan, Côte d'Ivoire",
      phone: settings.contact_phone || "+225 XX XX XX XX XX",
      email: settings.contact_email || "contact@gnambaservices.ci",
      hours: settings.contact_hours || "Lun-Ven : 08h – 18h",
    }),
    [
      settings.contact_address,
      settings.contact_phone,
      settings.contact_email,
      settings.contact_hours,
    ],
  );

  // Réseaux sociaux (seulement ceux qui sont renseignés)
  const socialLinks = useMemo(() => {
    const links: Array<{ key: string; label: string; url: string }> = [];

    if (settings.social_facebook) {
      links.push({
        key: "social_facebook",
        label: "Facebook",
        url: settings.social_facebook,
      });
    }
    if (settings.social_youtube) {
      links.push({
        key: "social_youtube",
        label: "YouTube",
        url: settings.social_youtube,
      });
    }
    if (settings.social_linkedin) {
      links.push({
        key: "social_linkedin",
        label: "LinkedIn",
        url: settings.social_linkedin,
      });
    }
    if (settings.social_twitter) {
      links.push({
        key: "social_twitter",
        label: "Twitter",
        url: settings.social_twitter,
      });
    }
    if (settings.social_instagram) {
      links.push({
        key: "social_instagram",
        label: "Instagram",
        url: settings.social_instagram,
      });
    }
    if (settings.social_tiktok) {
      links.push({
        key: "social_tiktok",
        label: "TikTok",
        url: settings.social_tiktok,
      });
    }

    return links;
  }, [
    settings.social_facebook,
    settings.social_youtube,
    settings.social_linkedin,
    settings.social_twitter,
    settings.social_instagram,
    settings.social_tiktok,
  ]);

  // SEO
  const seo = useMemo(
    () => ({
      description:
        settings.seo_description ||
        "Gnamba Services - BTP, Immobilier, Foncier en Côte d'Ivoire",
      keywords:
        settings.seo_keywords ||
        "BTP, immobilier, foncier, construction, Abidjan, Côte d'Ivoire",
    }),
    [settings.seo_description, settings.seo_keywords],
  );

  // Fonction utilitaire pour vérifier si le branding est complet
  const isBrandingComplete = useMemo(() => {
    return !!(logoUrl && logoDarkUrl && faviconUrl);
  }, [logoUrl, logoDarkUrl, faviconUrl]);

  // Fonction utilitaire pour obtenir le contraste d'une couleur
  const getContrastColor = (hexColor: string): string => {
    const color = hexColor.replace("#", "");
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);

    // Formule de luminosité
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? "#000000" : "#ffffff";
  };

  // Couleurs de contraste pour les textes
  const primaryContrast = useMemo(
    () => getContrastColor(primaryColor),
    [primaryColor],
  );
  const secondaryContrast = useMemo(
    () => getContrastColor(secondaryColor),
    [secondaryColor],
  );

  // Styles inline prédéfinis
  const styles = useMemo(
    () => ({
      primaryButton: {
        backgroundColor: primaryColor,
        color: primaryContrast,
      },
      secondaryButton: {
        backgroundColor: secondaryColor,
        color: secondaryContrast,
      },
      primaryText: {
        color: primaryColor,
      },
      secondaryText: {
        color: secondaryColor,
      },
    }),
    [primaryColor, secondaryColor, primaryContrast, secondaryContrast],
  );

  return {
    // État
    loading,

    // Valeurs de base
    settings,
    primaryColor,
    secondaryColor,
    logoUrl,
    logoDarkUrl,
    faviconUrl,
    watermarkUrl,
    appTitle,
    appSubtitle,
    appCompany,
    logoInitials,
    contact,
    socialLinks,
    seo,

    // État du branding
    isBrandingComplete,

    // Utilitaires
    getContrastColor,
    primaryContrast,
    secondaryContrast,
    styles,

    // Actions
    refreshSettings,
  };
}

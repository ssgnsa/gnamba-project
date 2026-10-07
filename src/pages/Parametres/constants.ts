/**
 * Constantes pour le module Paramètres
 * Séparées pour éviter les re-renders inutiles et faciliter la maintenance
 */

export const SETTINGS_TABS = [
  { id: "general", label: "Général", icon: "Type" },
  { id: "brand", label: "Identité Visuelle", icon: "Image" },
  { id: "contact", label: "Contact", icon: "Phone" },
  { id: "social", label: "Réseaux Sociaux", icon: "Globe" },
  { id: "seo", label: "SEO", icon: "Search" },
  { id: "coordination", label: "Coordination", icon: "Users" },
  { id: "audit", label: "Historique", icon: "History" },
] as const;

export type SettingsTab = typeof SETTINGS_TABS[number]["id"];

export const PRESET_COLORS = [
  { name: "Bleu Marine", value: "#1e40af" },
  { name: "Bleu Royal", value: "#1d4ed8" },
  { name: "Cyan", value: "#0891b2" },
  { name: "Vert Foncé", value: "#15803d" },
  { name: "Vert Émeraude", value: "#059669" },
  { name: "Slate", value: "#334155" },
  { name: "Gris Anthracite", value: "#1f2937" },
  { name: "Rouge", value: "#dc2626" },
  { name: "Orange", value: "#ea580c" },
  { name: "Teal", value: "#0f766e" },
] as const;

export const PRESET_SECONDARY = [
  { name: "Vert", value: "#16a34a" },
  { name: "Émeraude", value: "#059669" },
  { name: "Bleu", value: "#2563eb" },
  { name: "Cyan", value: "#0891b2" },
  { name: "Amber", value: "#d97706" },
  { name: "Orange", value: "#ea580c" },
] as const;

export const SOCIAL_FIELDS = [
  { key: "social_facebook", label: "Facebook", placeholder: "https://facebook.com/votre-page" },
  { key: "social_youtube", label: "YouTube", placeholder: "URL chaîne, playlist, vidéo ou iframe YouTube" },
  { key: "social_linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/votre-societe" },
  { key: "social_twitter", label: "Twitter / X", placeholder: "https://twitter.com/votre-compte" },
  { key: "social_instagram", label: "Instagram", placeholder: "https://instagram.com/votre-compte" },
  { key: "social_tiktok", label: "TikTok", placeholder: "https://tiktok.com/@votre-compte" },
] as const;

export const CONTACT_FIELDS = [
  { key: "contact_address", label: "Adresse", icon: "MapPin", placeholder: "Abidjan, Côte d'Ivoire" },
  { key: "contact_phone", label: "Téléphone", icon: "Phone", placeholder: "+225 XX XX XX XX XX", type: "tel" },
  { key: "contact_email", label: "Email", icon: "Mail", placeholder: "contact@gnambaservices.ci", type: "email" },
  { key: "contact_hours", label: "Heures d'Ouverture", icon: "Clock", placeholder: "Lun-Ven : 08h – 18h" },
] as const;

export const SEO_FIELDS = [
  { key: "seo_description", label: "Méta Description", placeholder: "Description pour les moteurs de recherche", maxLength: 160 },
  { key: "seo_keywords", label: "Mots-clés Principaux", placeholder: "BTP, immobilier, foncier, construction, Abidjan" },
] as const;

export type BrandingStatusItem = {
  label: string;
  ok: boolean;
  hint: string;
};

export const BRANDING_STATUS: BrandingStatusItem[] = [
  { label: "Logo principal", ok: false, hint: "Sidebar, entêtes, documents, pages publiques" },
  { label: "Logo secondaire", ok: false, hint: "Fond sombre (footer, hero, emails)" },
  { label: "Favicon", ok: false, hint: "Onglet navigateur et favoris" },
  { label: "Filigrane", ok: false, hint: "Documents imprimés et exportés" },
];

export const LOGO_COVERAGE = [
  "Sidebar dashboard",
  "En-tête dashboard",
  "Accueil employé",
  "Page de connexion",
  "Site vitrine (navbar + footer)",
  "Registre visiteur",
  "Vérification publique",
  "Documents PDF",
] as const;

export const MODULE_CARDS = [
  { id: "media", label: "Bibliothèque Média", description: "Logos, images et documents centralisés", icon: "Image", adminOnly: false },
  { id: "site-editor", label: "Site Vitrine", description: "Éditez toutes les pages publiques", icon: "Globe", adminOnly: true },
  { id: "utilisateurs", label: "Utilisateurs & Accès", description: "Rôles, permissions et accès modules", icon: "Shield", adminOnly: true },
  { id: "documents", label: "Documents", description: "Modèles et archives administratives", icon: "FileText", adminOnly: false },
] as const;

export const DEFAULT_SETTINGS: Record<string, string> = {
  app_title: "EGS",
  app_subtitle: "Enterprise Gnamba System",
  app_company: "Gnamba Services",
  primary_color: "#1e40af",
  secondary_color: "#16a34a",
  logo_url: "",
  contact_address: "Abidjan, Côte d'Ivoire",
  contact_phone: "+225 XX XX XX XX XX",
  contact_email: "contact@gnambaservices.ci",
  contact_hours: "Lun-Ven : 08h – 18h",
  social_facebook: "",
  social_youtube: "",
  social_linkedin: "",
  social_twitter: "",
  social_instagram: "",
  social_tiktok: "",
  seo_description: "Gnamba Services - BTP, Immobilier, Foncier en Côte d'Ivoire",
  seo_keywords: "BTP, immobilier, foncier, construction, Abidjan, Côte d'Ivoire",
  brand_logo_dark: "",
  brand_favicon_url: "",
  brand_watermark_url: "",
  hero_background_url: "",
  commission_rate: "12",
  rent_due_day: "10",
};

export const CACHE_KEYS = {
  SETTINGS: "egs:settings:cache:v2",
  DRAFT: "egs:settings:draft",
} as const;

export const VALIDATION_CONFIG = {
  MIN_CONTRAST_RATIO: 4.5,
  SEO_DESC_MAX: 160,
} as const;

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Save,
  RefreshCw,
  Palette,
  Type,
  Building,
  Image as ImageIcon,
  CheckCircle,
  X,
  Loader,
  UserCog,
  Phone,
  Mail,
  Clock,
  MapPin,
  Facebook,
  Linkedin,
  Twitter,
  Instagram,
  Video,
  Globe,
  Search,
  Shield,
  FileText,
  Star,
  History,
  AlertTriangle,
  Youtube,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import BrandAssetsManager from "../components/media/BrandAssetsManager";
import SiteMediaAssignments from "../components/media/SiteMediaAssignments";
import BrandLogo from "../components/BrandLogo";
import type { BrandSettings } from "../types";
import type { Page } from "../components/Sidebar";
import {
  validateSettings,
  ValidationError,
  calculateContrastRatio,
} from "../utils/validation";
import {
  getDemoBlockMessage,
  shouldBlockDestructiveAction,
} from "../lib/demoMode";

// ============================================
// CONSTANTES
// ============================================

const PRESET_COLORS = [
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
];

const PRESET_SECONDARY = [
  { name: "Vert", value: "#16a34a" },
  { name: "Émeraude", value: "#059669" },
  { name: "Bleu", value: "#2563eb" },
  { name: "Cyan", value: "#0891b2" },
  { name: "Amber", value: "#d97706" },
  { name: "Orange", value: "#ea580c" },
];

const DEFAULT_SETTINGS: BrandSettings = {
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
  seo_description:
    "Gnamba Services - BTP, Immobilier, Foncier en Côte d'Ivoire",
  seo_keywords:
    "BTP, immobilier, foncier, construction, Abidjan, Côte d'Ivoire",
  brand_logo_dark: "",
  brand_favicon_url: "",
  brand_watermark_url: "",
  hero_background_url: "",
};

type SettingsTab =
  | "general"
  | "brand"
  | "contact"
  | "social"
  | "seo"
  | "coordination"
  | "audit";

interface SectionProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({
  title,
  description,
  icon: Icon,
  children,
  defaultOpen = true,
}: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Icon size={18} className="text-blue-600" />
          </div>
          <div className="text-left">
            <h2 className="font-semibold text-gray-800">{title}</h2>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp size={20} className="text-gray-400" />
        ) : (
          <ChevronDown size={20} className="text-gray-400" />
        )}
      </button>
      {isOpen && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
}

/**
 * Composant d'avertissement de contraste de couleur
 */
function ContrastWarning({ primaryColor }: { primaryColor: string }) {
  const contrastOnWhite = calculateContrastRatio(primaryColor, "#ffffff");
  const contrastOnBlack = calculateContrastRatio(primaryColor, "#000000");
  const minContrast = 4.5;

  const hasWarning =
    contrastOnWhite < minContrast && contrastOnBlack < minContrast;

  if (!hasWarning) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle
          size={18}
          className="text-amber-600 flex-shrink-0 mt-0.5"
        />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-amber-800 mb-1">
            Attention : Contraste de couleur insuffisant
          </h4>
          <p className="text-xs text-amber-700 mb-2">
            La couleur primaire sélectionnée ({primaryColor}) peut ne pas avoir
            un contraste suffisant pour une accessibilité optimale.
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white border border-gray-200 rounded p-2 text-center">
              <div className="font-medium text-gray-700">Sur fond blanc</div>
              <div
                className={`font-bold ${contrastOnWhite >= minContrast ? "text-green-600" : "text-red-600"}`}
              >
                {contrastOnWhite.toFixed(2)}:1
              </div>
            </div>
            <div className="bg-black border border-gray-700 rounded p-2 text-center">
              <div className="font-medium text-gray-300">Sur fond noir</div>
              <div
                className={`font-bold ${contrastOnBlack >= minContrast ? "text-green-400" : "text-red-400"}`}
              >
                {contrastOnBlack.toFixed(2)}:1
              </div>
            </div>
          </div>
          <p className="text-xs text-amber-600 mt-2">
            Recommandation: minimum {minContrast}:1 pour une lisibilité optimale
            (WCAG AA)
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function Parametres() {
  const { settings, refreshSettings, updateSettings } = useSettings();
  const { user, profile } = useAuth();
  const destructiveActionsDisabled = shouldBlockDestructiveAction(
    user,
    profile,
  );
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    [],
  );
  const [showValidationWarnings, setShowValidationWarnings] = useState(false);
  const isAdmin = profile?.role === "admin";

  const changedKeys = useMemo(() => {
    return (Object.keys(form) as (keyof BrandSettings)[]).filter((key) => {
      const current = `${form[key] ?? ""}`;
      const original = `${settings[key] ?? ""}`;
      return current !== original;
    });
  }, [form, settings]);

  const hasChanges = changedKeys.length > 0;

  // ============================================
  // AVERTISSEMENT DE MODIFICATIONS NON SAUVEGARDÉES
  // ============================================
  useEffect(() => {
    if (!hasChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  // ============================================
  // NAVIGATION PAR HASH URL
  // ============================================
  useEffect(() => {
    const validTabs: SettingsTab[] = [
      "general",
      "brand",
      "contact",
      "social",
      "seo",
      "coordination",
      "audit",
    ];

    const syncTabFromHash = () => {
      const hash = window.location.hash;
      if (!hash.startsWith("#parametres-")) return;

      const tabId = hash.replace("#parametres-", "") as SettingsTab;
      if (validTabs.includes(tabId)) {
        setActiveTab((current) => (current === tabId ? current : tabId));
      }
    };

    syncTabFromHash();
    window.addEventListener("hashchange", syncTabFromHash);

    return () => window.removeEventListener("hashchange", syncTabFromHash);
  }, []);

  useEffect(() => {
    const newHash = `#parametres-${activeTab}`;
    if (window.location.hash !== newHash) {
      window.history.replaceState(null, "", newHash);
    }
  }, [activeTab]);

  const loadAuditLogs = useCallback(async () => {
    setLoadingAudit(true);
    const { data, error } = await supabase
      .from("settings_audit")
      .select(
        `
        id,
        setting_key,
        old_value,
        new_value,
        changed_at,
        user_profiles (full_name, email)
      `,
      )
      .order("changed_at", { ascending: false })
      .limit(50);

    if (error) {
      if (import.meta.env.DEV) console.error("Erreur chargement audit:", error);
      setLoadingAudit(false);
      return;
    }

    if (data) {
      setAuditLogs(data);
    }
    setLoadingAudit(false);
  }, []);

  // Charger les logs d'audit
  useEffect(() => {
    if (activeTab === "audit" && isAdmin) {
      void loadAuditLogs();
    }
  }, [activeTab, isAdmin, loadAuditLogs]);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleSave = async () => {
    if (!hasChanges) return;

    // Valider les paramètres
    const validation = validateSettings(form);
    setValidationErrors(validation.errors);

    if (!validation.valid) {
      setShowValidationWarnings(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSaving(true);
    try {
      const updates: Partial<BrandSettings> = {};
      changedKeys.forEach((key) => {
        updates[key] = form[key];
      });
      await updateSettings(updates);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setShowValidationWarnings(false);
      setValidationErrors([]);
    } catch (error) {
      if (import.meta.env.DEV)
        console.error("Erreur lors de la sauvegarde:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (destructiveActionsDisabled) {
      window.alert(getDemoBlockMessage());
      return;
    }
    if (!confirm("Réinitialiser tous les paramètres aux valeurs par défaut ?"))
      return;
    setForm(DEFAULT_SETTINGS);
  };

  const handleReload = async () => {
    setRefreshing(true);
    try {
      await refreshSettings();
    } finally {
      setRefreshing(false);
    }
  };

  const tabs: {
    id: SettingsTab;
    label: string;
    icon: React.ComponentType<{ size?: number | string }>;
  }[] = [
    { id: "general", label: "Général", icon: Type },
    { id: "brand", label: "Identité Visuelle", icon: ImageIcon },
    { id: "contact", label: "Contact", icon: Phone },
    { id: "social", label: "Réseaux Sociaux", icon: Facebook },
    { id: "seo", label: "SEO", icon: Search },
    { id: "coordination", label: "Coordination", icon: UserCog },
    { id: "audit", label: "Historique", icon: History },
  ];

  const moduleCards: {
    id: Page;
    label: string;
    description: string;
    icon: React.ComponentType<{ size?: number | string }>;
    adminOnly?: boolean;
  }[] = [
    {
      id: "media",
      label: "Bibliothèque Média",
      description: "Logos, images et documents centralisés",
      icon: ImageIcon,
    },
    {
      id: "site-editor",
      label: "Site Vitrine",
      description: "Éditez toutes les pages publiques",
      icon: Globe,
      adminOnly: true,
    },
    {
      id: "utilisateurs",
      label: "Utilisateurs & Accès",
      description: "Rôles, permissions et accès modules",
      icon: Shield,
      adminOnly: true,
    },
    {
      id: "documents",
      label: "Documents",
      description: "Modèles et archives administratives",
      icon: FileText,
    },
  ];

  const goToModule = (page: Page) => {
    window.dispatchEvent(new CustomEvent("egs:navigate", { detail: page }));
  };

  const brandingStatus = [
    {
      label: "Logo principal",
      ok: Boolean(form.logo_url),
      hint: "Sidebar, entêtes, documents, pages publiques",
    },
    {
      label: "Logo secondaire",
      ok: Boolean(form.brand_logo_dark),
      hint: "Fond sombre (footer, hero, emails)",
    },
    {
      label: "Favicon",
      ok: Boolean(form.brand_favicon_url),
      hint: "Onglet navigateur et favoris",
    },
    {
      label: "Filigrane",
      ok: Boolean(form.brand_watermark_url),
      hint: "Documents imprimés et exportés",
    },
  ];

  const logoCoverage = [
    "Sidebar dashboard",
    "En-tête dashboard",
    "Accueil employé",
    "Page de connexion",
    "Site vitrine (navbar + footer)",
    "Registre visiteur",
    "Vérification publique",
    "Documents PDF",
  ];

  return (
    <div className="max-w-6xl space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Paramètres de l'Application
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configurez l'identité, les couleurs et les informations de votre
            entreprise
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
              <span>{changedKeys.length} modification(s) en attente</span>
            </div>
          )}
          <button
            onClick={handleReload}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-600 text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />{" "}
            Recharger
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-600 text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Trash2 size={16} /> Réinitialiser
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: form.primary_color }}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>{" "}
                Sauvegarde...
              </>
            ) : (
              <>
                <Save size={16} /> Sauvegarder
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notification de succès */}
      {saved && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
          <CheckCircle size={16} />
          <span className="text-sm font-medium">
            Paramètres sauvegardés avec succès !
          </span>
        </div>
      )}

      {/* Avertissements de validation */}
      {showValidationWarnings && validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-red-800 font-semibold">
            <AlertTriangle size={18} />
            <span>Erreurs de validation</span>
          </div>
          <ul className="text-sm text-red-700 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                <span>{error.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Avertissement de contraste */}
      {hasChanges && <ContrastWarning primaryColor={form.primary_color} />}

      {/* Onglets de navigation */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
                style={isActive ? { backgroundColor: form.primary_color } : {}}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenu des onglets */}
      <div className="space-y-6">
        {/* ==================== ONGLET GÉNÉRAL ==================== */}
        {activeTab === "general" && (
          <Section
            title="Identité de l'Application"
            description="Configurez le nom et la description de votre entreprise"
            icon={Building}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Titre de l'Application <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.app_title}
                  onChange={(e) =>
                    setForm({ ...form, app_title: e.target.value })
                  }
                  placeholder="EGS"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Affiché dans la barre latérale et l'onglet du navigateur
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Sous-titre
                </label>
                <input
                  type="text"
                  value={form.app_subtitle}
                  onChange={(e) =>
                    setForm({ ...form, app_subtitle: e.target.value })
                  }
                  placeholder="Enterprise Gnamba System"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Description courte affichée sous le titre
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nom de l'Entreprise <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.app_company}
                  onChange={(e) =>
                    setForm({ ...form, app_company: e.target.value })
                  }
                  placeholder="Gnamba Services"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Affiché dans l'en-tête et les documents officiels
                </p>
              </div>
            </div>
          </Section>
        )}

        {/* ==================== ONGLET IDENTITÉ VISUELLE ==================== */}
        {activeTab === "brand" && (
          <div className="space-y-6">
            <Section
              title="Gestion des Ressources de Marque"
              description="Logos, favicon et filigrane - utilisé partout dans l'application"
              icon={Star}
            >
              <BrandAssetsManager />
            </Section>

            <Section
              title="Fonds et Images du Site Vitrine"
              description="Assignez des images aux différentes sections du site vitrine (hero, services, etc.)"
              icon={Globe}
            >
              <SiteMediaAssignments />
            </Section>

            <Section
              title="Aperçu des Logos"
              description="Vérifiez le rendu sur fond clair et fond sombre"
              icon={ImageIcon}
              defaultOpen={false}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-gray-200 p-5 bg-white">
                  <p className="text-xs text-gray-500 font-medium mb-3">
                    Fond clair
                  </p>
                  <div className="h-24 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center">
                    <BrandLogo
                      tone="light"
                      alt="Logo principal"
                      className="h-14 object-contain"
                      fallback={
                        <span className="text-gray-400 text-sm font-semibold">
                          Logo manquant
                        </span>
                      }
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    Utilisé pour la plupart des pages internes
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 p-5 bg-slate-900">
                  <p className="text-xs text-slate-200 font-medium mb-3">
                    Fond sombre
                  </p>
                  <div className="h-24 rounded-xl border border-slate-700 bg-slate-800 flex items-center justify-center">
                    <BrandLogo
                      tone="dark"
                      alt="Logo secondaire"
                      className="h-14 object-contain"
                      fallback={
                        <span className="text-slate-300 text-sm font-semibold">
                          Logo sombre manquant
                        </span>
                      }
                    />
                  </div>
                  <p className="text-xs text-slate-300 mt-3">
                    Recommandé pour navbar, footer et documents foncés
                  </p>
                </div>
              </div>
            </Section>

            <Section
              title="Couleurs de la Marque"
              description="Personnalisez les couleurs principales et secondaires"
              icon={Palette}
            >
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Couleur Principale (Sidebar & Actions)
                  </label>
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="color"
                      value={form.primary_color}
                      onChange={(e) =>
                        setForm({ ...form, primary_color: e.target.value })
                      }
                      className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer p-1"
                    />
                    <input
                      type="text"
                      value={form.primary_color}
                      onChange={(e) =>
                        setForm({ ...form, primary_color: e.target.value })
                      }
                      placeholder="#1e40af"
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() =>
                          setForm({ ...form, primary_color: c.value })
                        }
                        title={c.name}
                        className={`w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 ${
                          form.primary_color === c.value
                            ? "border-gray-800 scale-110"
                            : "border-transparent"
                        }`}
                        style={{ backgroundColor: c.value }}
                      />
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Couleur Secondaire (Accents & Finance)
                  </label>
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="color"
                      value={form.secondary_color}
                      onChange={(e) =>
                        setForm({ ...form, secondary_color: e.target.value })
                      }
                      className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer p-1"
                    />
                    <input
                      type="text"
                      value={form.secondary_color}
                      onChange={(e) =>
                        setForm({ ...form, secondary_color: e.target.value })
                      }
                      placeholder="#16a34a"
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_SECONDARY.map((c) => (
                      <button
                        key={c.value}
                        onClick={() =>
                          setForm({ ...form, secondary_color: c.value })
                        }
                        title={c.name}
                        className={`w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 ${
                          form.secondary_color === c.value
                            ? "border-gray-800 scale-110"
                            : "border-transparent"
                        }`}
                        style={{ backgroundColor: c.value }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </Section>

            {/* Aperçu en direct */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <ExternalLink size={18} className="text-blue-600" />
                Aperçu en Direct
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Aperçu Sidebar */}
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-2">
                    Barre Latérale
                  </p>
                  <div className="rounded-xl overflow-hidden border border-gray-200">
                    <div
                      className="p-4 flex items-center gap-3"
                      style={{ backgroundColor: form.primary_color }}
                    >
                      {form.logo_url ? (
                        <img
                          src={form.logo_url}
                          alt="logo"
                          className="w-8 h-8 rounded-lg object-cover bg-white"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {form.app_title.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="text-white font-bold text-sm">
                          {form.app_title || "EGS"}
                        </div>
                        <div className="text-white/60 text-xs">
                          {form.app_subtitle || "Sous-titre"}
                        </div>
                      </div>
                    </div>
                    <div className="p-3 space-y-1 bg-gray-50">
                      {[
                        "Tableau de bord",
                        "Clients",
                        "Projets BTP",
                        "Finances",
                      ].map((item, i) => (
                        <div
                          key={item}
                          className={`px-3 py-2 rounded-lg text-xs font-medium ${
                            i === 0 ? "text-white" : "text-gray-500"
                          }`}
                          style={
                            i === 0
                              ? { backgroundColor: form.primary_color }
                              : {}
                          }
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Aperçu Couleurs */}
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-2">
                    Palette de Couleurs
                  </p>
                  <div className="rounded-xl border border-gray-200 p-4">
                    <div className="flex gap-3 mb-4">
                      <div className="flex-1">
                        <div
                          className="w-full h-16 rounded-lg mb-2"
                          style={{ backgroundColor: form.primary_color }}
                        ></div>
                        <div className="text-xs text-gray-600 font-mono text-center">
                          {form.primary_color}
                        </div>
                        <div className="text-xs text-gray-400 text-center">
                          Principale
                        </div>
                      </div>
                      <div className="flex-1">
                        <div
                          className="w-full h-16 rounded-lg mb-2"
                          style={{ backgroundColor: form.secondary_color }}
                        ></div>
                        <div className="text-xs text-gray-600 font-mono text-center">
                          {form.secondary_color}
                        </div>
                        <div className="text-xs text-gray-400 text-center">
                          Secondaire
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-2">
                        Boutons d'action
                      </p>
                      <div className="flex gap-2">
                        <button
                          className="flex-1 px-3 py-2 rounded-lg text-xs text-white font-medium"
                          style={{ backgroundColor: form.primary_color }}
                        >
                          Principal
                        </button>
                        <button
                          className="flex-1 px-3 py-2 rounded-lg text-xs text-white font-medium"
                          style={{ backgroundColor: form.secondary_color }}
                        >
                          Secondaire
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== ONGLET CONTACT ==================== */}
        {activeTab === "contact" && (
          <Section
            title="Informations de Contact"
            description="Ces informations sont affichées sur le site vitrine et les documents"
            icon={Phone}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <MapPin size={14} className="inline mr-1.5" />
                  Adresse
                </label>
                <input
                  type="text"
                  value={form.contact_address}
                  onChange={(e) =>
                    setForm({ ...form, contact_address: e.target.value })
                  }
                  placeholder="Abidjan, Côte d'Ivoire"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Phone size={14} className="inline mr-1.5" />
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={form.contact_phone}
                  onChange={(e) =>
                    setForm({ ...form, contact_phone: e.target.value })
                  }
                  placeholder="+225 XX XX XX XX XX"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Mail size={14} className="inline mr-1.5" />
                  Email
                </label>
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) =>
                    setForm({ ...form, contact_email: e.target.value })
                  }
                  placeholder="contact@gnambaservices.ci"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Clock size={14} className="inline mr-1.5" />
                  Heures d'Ouverture
                </label>
                <input
                  type="text"
                  value={form.contact_hours}
                  onChange={(e) =>
                    setForm({ ...form, contact_hours: e.target.value })
                  }
                  placeholder="Lun-Ven : 08h – 18h"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors"
                />
              </div>
            </div>
          </Section>
        )}

        {/* ==================== ONGLET RÉSEAUX SOCIAUX ==================== */}
        {activeTab === "social" && (
          <Section
            title="Profils Réseaux Sociaux"
            description="Liens vers vos pages sociales - affichés sur le site vitrine"
            icon={Facebook}
          >
            <div className="space-y-4">
              {[
                {
                  key: "social_facebook" as const,
                  label: "Facebook",
                  icon: Facebook,
                  placeholder: "https://facebook.com/votre-page",
                },
                {
                  key: "social_youtube" as const,
                  label: "YouTube",
                  icon: Youtube,
                  placeholder: "URL chaîne, playlist, vidéo ou iframe YouTube",
                },
                {
                  key: "social_linkedin" as const,
                  label: "LinkedIn",
                  icon: Linkedin,
                  placeholder: "https://linkedin.com/company/votre-societe",
                },
                {
                  key: "social_twitter" as const,
                  label: "Twitter / X",
                  icon: Twitter,
                  placeholder: "https://twitter.com/votre-compte",
                },
                {
                  key: "social_instagram" as const,
                  label: "Instagram",
                  icon: Instagram,
                  placeholder: "https://instagram.com/votre-compte",
                },
                {
                  key: "social_tiktok" as const,
                  label: "TikTok",
                  icon: Video,
                  placeholder: "https://tiktok.com/@votre-compte",
                },
              ].map(({ key, label, icon: Icon, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Icon size={14} className="inline mr-1.5 text-gray-400" />
                    {label}
                  </label>
                  <input
                    type="url"
                    value={form[key]}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                    placeholder={placeholder}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors"
                  />
                  {key === "social_youtube" && (
                    <p className="mt-1 text-xs text-gray-400">
                      Pour une mise à jour automatique fiable, privilégiez une
                      URL de chaîne ou de playlist.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ==================== ONGLET SEO ==================== */}
        {activeTab === "seo" && (
          <Section
            title="Optimisation SEO"
            description="Méta-données pour le référencement naturel de votre site"
            icon={Search}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Globe size={14} className="inline mr-1.5" />
                  Méta Description
                </label>
                <textarea
                  value={form.seo_description}
                  onChange={(e) =>
                    setForm({ ...form, seo_description: e.target.value })
                  }
                  placeholder="Description de votre entreprise pour les moteurs de recherche"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {form.seo_description.length} caractères (recommandé: 150-160)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Search size={14} className="inline mr-1.5" />
                  Mots-clés Principaux
                </label>
                <input
                  type="text"
                  value={form.seo_keywords}
                  onChange={(e) =>
                    setForm({ ...form, seo_keywords: e.target.value })
                  }
                  placeholder="BTP, immobilier, foncier, construction, Abidjan"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Séparez les mots-clés par des virgules
                </p>
              </div>
            </div>
          </Section>
        )}

        {/* ==================== ONGLET COORDINATION ==================== */}
        {activeTab === "coordination" && (
          <div className="space-y-6">
            <Section
              title="Centre de Coordination"
              description="Accès centralisé aux modules clés de configuration"
              icon={UserCog}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {moduleCards.map((module) => {
                  const Icon = module.icon;
                  const disabled = module.adminOnly && !isAdmin;
                  return (
                    <button
                      key={module.id}
                      onClick={() => goToModule(module.id)}
                      disabled={disabled}
                      className={`text-left rounded-2xl border p-4 transition-all ${
                        disabled
                          ? "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                          : "border-gray-200 bg-white hover:border-blue-200 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            disabled
                              ? "bg-gray-100 text-gray-400"
                              : "bg-blue-50 text-blue-600"
                          }`}
                        >
                          <Icon size={18} />
                        </div>
                        <div>
                          <div className="text-sm font-semibold">
                            {module.label}
                          </div>
                          {module.adminOnly && (
                            <div className="text-xs text-amber-600">
                              Accès administrateur requis
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        {module.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section
              title="Harmonisation du Logo"
              description="Suivi du logo sur toutes les pages et supports"
              icon={ImageIcon}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  {brandingStatus.map((status) => (
                    <div
                      key={status.label}
                      className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          status.ok
                            ? "bg-green-50 text-green-600"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        {status.ok ? (
                          <CheckCircle size={16} />
                        ) : (
                          <X size={16} />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">
                          {status.label}
                        </div>
                        <div className="text-xs text-gray-500">
                          {status.hint}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-4">
                  <p className="text-sm font-semibold text-gray-800 mb-3">
                    Pages couvertes
                  </p>
                  <ul className="space-y-2">
                    {logoCoverage.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 text-sm text-gray-600"
                      >
                        <CheckCircle size={14} className="text-green-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
                    Modifiez un logo dans "Identité Visuelle" pour voir l'impact
                    immédiat partout.
                  </div>
                </div>
              </div>
            </Section>
          </div>
        )}

        {/* ==================== ONGLET HISTORIQUE ==================== */}
        {activeTab === "audit" && (
          <div className="space-y-6">
            {!isAdmin ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
                <Shield size={48} className="mx-auto text-amber-500 mb-3" />
                <h3 className="font-semibold text-amber-800 mb-2">
                  Accès Restreint
                </h3>
                <p className="text-sm text-amber-700">
                  Seuls les administrateurs peuvent consulter l'historique des
                  modifications.
                </p>
              </div>
            ) : (
              <>
                <Section
                  title="Historique des Modifications"
                  description="Toutes les modifications apportées aux paramètres sont enregistrées ici"
                  icon={History}
                >
                  {loadingAudit ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader
                        size={24}
                        className="animate-spin text-blue-600"
                      />
                    </div>
                  ) : auditLogs.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText
                        size={48}
                        className="mx-auto text-gray-300 mb-3"
                      />
                      <p className="text-gray-500 text-sm">
                        Aucune modification enregistrée
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {auditLogs.map((log) => (
                        <div
                          key={log.id}
                          className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-blue-200 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                  {log.setting_key}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {new Date(log.changed_at).toLocaleString(
                                    "fr-FR",
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-gray-500">Par:</span>
                                <span className="text-gray-700 font-medium">
                                  {log.user_profiles?.full_name || "Système"}
                                </span>
                              </div>
                              {log.old_value && log.new_value && (
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                  <div className="bg-red-50 rounded-lg p-2">
                                    <p className="text-xs text-red-600 font-medium mb-0.5">
                                      Avant:
                                    </p>
                                    <p className="text-xs text-red-800 line-break-all">
                                      {log.old_value}
                                    </p>
                                  </div>
                                  <div className="bg-green-50 rounded-lg p-2">
                                    <p className="text-xs text-green-600 font-medium mb-0.5">
                                      Après:
                                    </p>
                                    <p className="text-xs text-green-800 line-break-all">
                                      {log.new_value}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>

                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <Shield
                      size={20}
                      className="text-blue-600 flex-shrink-0 mt-0.5"
                    />
                    <div>
                      <h4 className="text-sm font-semibold text-blue-900 mb-1">
                        Système d'Audit
                      </h4>
                      <p className="text-xs text-blue-700">
                        Toutes les modifications apportées aux paramètres sont
                        automatiquement enregistrées avec la date, l'heure et
                        l'utilisateur ayant effectué le changement.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Boutons d'action flottants (mobile) */}
      <div className="fixed bottom-6 right-6 flex items-center gap-2 lg:hidden">
        <button
          onClick={handleReset}
          className="p-3 rounded-full bg-white shadow-lg border border-gray-200 text-gray-600"
        >
          <Trash2 size={20} />
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="p-3 rounded-full text-white shadow-lg disabled:opacity-50"
          style={{ backgroundColor: form.primary_color }}
        >
          {saving ? (
            <Loader size={20} className="animate-spin" />
          ) : (
            <Save size={20} />
          )}
        </button>
      </div>
    </div>
  );
}

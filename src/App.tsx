import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type LazyExoticComponent,
} from "react";
import { SettingsProvider, useSettings } from "./context/SettingsContext";
import { AuthProvider, useAuth, hasAccess } from "./context/AuthContext";
import { useServiceWorker } from "./lib/useServiceWorker";
import { WifiOff } from "lucide-react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Layout from "./components/Layout";
import PublicLayout from "./components/public/PublicLayout";
import type { Page } from "./components/Sidebar";
import type { PublicPage } from "./lib/publicRoutes";
import { PUBLIC_PAGE_PATHS, getPublicPageFromPath } from "./lib/publicRoutes";
import { supabase } from "./lib/supabase";
import type { PageSection } from "./components/page-builder/types";
import PublicPageLayoutRenderer from "./components/public/PublicPageLayoutRenderer";
import PublicSocialWall from "./components/public/PublicSocialWall";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Clients = lazy(() => import("./pages/Clients"));
const Projets = lazy(() => import("./pages/Projets"));
const Immobilier = lazy(() => import("./pages/Immobilier"));
const Foncier = lazy(() => import("./pages/Foncier"));
const Fournitures = lazy(() => import("./pages/Fournitures"));
const Finances = lazy(() => import("./pages/Finances"));
const Employes = lazy(() => import("./pages/Employes"));
const Utilisateurs = lazy(() => import("./pages/Utilisateurs"));
const Fournisseurs = lazy(() => import("./pages/Fournisseurs"));
const Documents = lazy(() => import("./pages/Documents"));
const Taches = lazy(() => import("./pages/Taches"));
const Statistiques = lazy(() => import("./pages/Statistiques"));
const Parametres = lazy(() => import("./pages/Parametres"));
const SiteEditor = lazy(() => import("./pages/admin/SiteEditor"));
const Media = lazy(() => import("./pages/Media"));
const AccueilEmploye = lazy(() => import("./pages/AccueilEmploye"));
const RegistreVisiteur = lazy(() => import("./pages/RegistreVisiteur"));
const Leads = lazy(() => import("./pages/Leads"));
const VerificationAttestation = lazy(
  () => import("./pages/VerificationAttestation"),
);

const PublicHome = lazy(() => import("./pages/public/PublicHome"));
const PublicAbout = lazy(() => import("./pages/public/PublicAbout"));
const PublicServices = lazy(() => import("./pages/public/PublicServices"));
const PublicRealisations = lazy(
  () => import("./pages/public/PublicRealisations"),
);
const PublicContact = lazy(() => import("./pages/public/PublicContact"));
const LoginPage = lazy(() => import("./pages/public/LoginPage"));
const ForgotPasswordPage = lazy(
  () => import("./pages/public/ForgotPasswordPage"),
);
const ResetPasswordPage = lazy(
  () => import("./pages/public/ResetPasswordPage"),
);
const PublicVerification = lazy(
  () => import("./pages/public/PublicVerification"),
);

type EmptyProps = Record<string, never>;
type LazyComponent<TProps extends object = EmptyProps> = LazyExoticComponent<
  ComponentType<TProps>
>;
type PageComponent = ComponentType<EmptyProps> | LazyComponent<EmptyProps>;
type PublicPageComponent =
  | ComponentType<{ onNavigate: (page: PublicPage) => void }>
  | LazyComponent<{ onNavigate: (page: PublicPage) => void }>;

const dashboardPages: Record<Page, PageComponent> = {
  dashboard: Dashboard,
  clients: Clients,
  projets: Projets,
  immobilier: Immobilier,
  foncier: Foncier,
  fournitures: Fournitures,
  finances: Finances,
  employes: Employes,
  utilisateurs: Utilisateurs,
  fournisseurs: Fournisseurs,
  documents: Documents,
  taches: Taches,
  statistiques: Statistiques,
  parametres: Parametres,
  "site-editor": SiteEditor,
  media: Media,
  registre: RegistreVisiteur,
  leads: Leads,
};

const PublicAboutPage: ComponentType<{
  onNavigate: (page: PublicPage) => void;
}> = () => <PublicAbout />;
const PublicRealisationsPage: ComponentType<{
  onNavigate: (page: PublicPage) => void;
}> = () => <PublicRealisations />;
const PublicContactPage: ComponentType<{
  onNavigate: (page: PublicPage) => void;
}> = () => <PublicContact />;

const publicPages: Record<string, PublicPageComponent> = {
  home: PublicHome,
  about: PublicAboutPage,
  services: PublicServices,
  realisations: PublicRealisationsPage,
  contact: PublicContactPage,
  verification: PublicVerification,
};

const publicPageLayoutSlug: Partial<Record<PublicPage, string>> = {
  home: "accueil",
  about: "about",
  services: "services",
  realisations: "realisations",
  contact: "contact",
};

const DASHBOARD_PAGE_PATHS: Record<Page, string> = {
  dashboard: "/dashboard",
  clients: "/clients",
  projets: "/projets",
  immobilier: "/immobilier",
  foncier: "/foncier",
  fournitures: "/fournitures",
  finances: "/finances",
  employes: "/employes",
  utilisateurs: "/utilisateurs",
  fournisseurs: "/fournisseurs",
  documents: "/documents",
  taches: "/taches",
  statistiques: "/statistiques",
  parametres: "/parametres",
  "site-editor": "/site-editor",
  media: "/media",
  registre: "/registre",
  leads: "/leads",
};

const DASHBOARD_PAGE_ALIASES: Record<string, Page> = {
  "/app": "dashboard",
  "/admin": "dashboard",
};

type AppView = "public" | "dashboard";

const normalizePath = (path: string): string => {
  if (!path) return "/";
  const trimmed = path.split("?")[0]?.split("#")[0] || "/";
  if (trimmed === "") return "/";
  if (trimmed.includes(":")) return trimmed;
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (withLeadingSlash.length > 1) {
    return withLeadingSlash.replace(/\/+$/, "");
  }
  return withLeadingSlash;
};

const getDashboardPageFromPath = (path: string): Page | null => {
  const normalized = normalizePath(path);
  if (normalized.includes(":")) return null;
  const directMatch = (Object.keys(DASHBOARD_PAGE_PATHS) as Page[]).find(
    (page) => DASHBOARD_PAGE_PATHS[page] === normalized,
  );
  if (directMatch) return directMatch;
  return DASHBOARD_PAGE_ALIASES[normalized] || null;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "").trim();
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  if (full.length !== 6) return null;
  const int = Number.parseInt(full, 16);
  if (Number.isNaN(int)) return null;
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
};

const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("")}`;

const mixHex = (base: string, mix: string, weight: number) => {
  const b = hexToRgb(base);
  const m = hexToRgb(mix);
  if (!b || !m) return base;
  const w = clamp(weight, 0, 1);
  return rgbToHex(
    b.r * (1 - w) + m.r * w,
    b.g * (1 - w) + m.g * w,
    b.b * (1 - w) + m.b * w,
  );
};

const getLuminance = (hex: string) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5;
  const toLinear = (value: number) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const r = toLinear(rgb.r);
  const g = toLinear(rgb.g);
  const b = toLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const getOnPrimary = (hex: string) =>
  getLuminance(hex) > 0.6 ? "#0f172a" : "#ffffff";

const buildThemeCss = (primary: string, secondary: string) => {
  const base = primary || "#1e40af";
  const scale = {
    50: mixHex(base, "#ffffff", 0.92),
    100: mixHex(base, "#ffffff", 0.85),
    200: mixHex(base, "#ffffff", 0.7),
    300: mixHex(base, "#ffffff", 0.5),
    400: mixHex(base, "#ffffff", 0.3),
    500: base,
    600: mixHex(base, "#000000", 0.12),
    700: mixHex(base, "#000000", 0.22),
    800: mixHex(base, "#000000", 0.32),
    900: mixHex(base, "#000000", 0.42),
  } as const;
  const onPrimary = getOnPrimary(base);
  const secondaryBase = secondary || "#16a34a";

  return (
    `:root {\n` +
    `  --color-primary: ${base};\n` +
    `  --color-secondary: ${secondaryBase};\n` +
    `  --color-primary-50: ${scale[50]};\n` +
    `  --color-primary-100: ${scale[100]};\n` +
    `  --color-primary-200: ${scale[200]};\n` +
    `  --color-primary-300: ${scale[300]};\n` +
    `  --color-primary-400: ${scale[400]};\n` +
    `  --color-primary-500: ${scale[500]};\n` +
    `  --color-primary-600: ${scale[600]};\n` +
    `  --color-primary-700: ${scale[700]};\n` +
    `  --color-primary-800: ${scale[800]};\n` +
    `  --color-primary-900: ${scale[900]};\n` +
    `  --color-on-primary: ${onPrimary};\n` +
    `}`
  );
};

const PageLoader = ({ label = "Chargement..." }: { label?: string }) => (
  <div className="min-h-[50vh] flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700 mx-auto mb-4" />
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  </div>
);

function AppContent() {
  const { loading: settingsLoading, settings } = useSettings();
  const { user, profile, loading: authLoading } = useAuth();
  const sw = useServiceWorker();
  const [view, setView] = useState<AppView>("public");
  const [publicPage, setPublicPage] = useState<PublicPage>("home");
  const [dashPage, setDashPage] = useState<Page>("dashboard");
  const [publishedLayoutSections, setPublishedLayoutSections] = useState<
    PageSection[] | null
  >(null);
  const [publishedLayoutLoading, setPublishedLayoutLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  // État pour page d'accueil employé
  // Initialisé à true pour afficher la page d'accueil par défaut après connexion
  const [showAccueil, setShowAccueil] = useState(true);
  const POST_LOGIN_PATH_KEY = "egs:post_login_path";
  const isLocalhost =
    typeof window !== "undefined"
      ? ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname)
      : false;
  const showProdBanner = import.meta.env.PROD && isLocalhost;
  const buildTime = __BUILD_TIME__;
  const themeCss = useMemo(
    () => buildThemeCss(settings.primary_color, settings.secondary_color),
    [settings.primary_color, settings.secondary_color],
  );

  // ============================================
  // GESTION DYNAMIQUE DU FAVICON
  // ============================================
  useEffect(() => {
    // Fonction pour mettre à jour le favicon
    const updateFavicon = () => {
      // Chercher le lien favicon existant ou en créer un nouveau
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;

      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }

      // Utiliser le favicon des paramètres s'il existe, sinon utiliser le favicon par défaut
      if (settings.brand_favicon_url) {
        link.href = settings.brand_favicon_url;
        link.type = settings.brand_favicon_url.endsWith(".svg")
          ? "image/svg+xml"
          : "image/png";
      } else {
        // Favicon par défaut (vite.svg ou un favicon généré)
        link.href = "/default-logo.svg";
        link.type = "image/svg+xml";
      }
    };

    // Mettre à jour au chargement
    updateFavicon();
  }, [settings.brand_favicon_url]);

  // ============================================
  // GESTION DYNAMIQUE DU TITRE DE L'ONGLET
  // ============================================
  useEffect(() => {
    const fallbackTitle = `${settings.app_company || "Gnamba Services"} - BTP, Immobilier & Foncier`;
    const baseTitle = settings.app_title || fallbackTitle;

    // Build page-specific title
    let pageTitle = "";

    if (view === "dashboard" && dashPage) {
      const pageTitles: Record<Page, string> = {
        dashboard: "Tableau de Bord",
        clients: "Clients",
        projets: "Projets BTP",
        immobilier: "Gestion Immobilière",
        foncier: "Dossiers Fonciers",
        fournitures: "Fournitures",
        finances: "Finances",
        employes: "Employés",
        utilisateurs: "Utilisateurs",
        fournisseurs: "Fournisseurs",
        documents: "Documents",
        media: "Média",
        taches: "Tâches",
        statistiques: "Statistiques",
        parametres: "Paramètres",
        "site-editor": "Site Vitrine",
        registre: "Registre Visiteur",
        leads: "Leads & Campagnes",
      };
      pageTitle = `${pageTitles[dashPage]} - `;
    } else if (view === "public" && publicPage) {
      const publicPageTitles: Record<PublicPage, string> = {
        home: "Accueil",
        about: "À Propos",
        services: "Services",
        realisations: "Réalisations",
        contact: "Contact",
        login: "Connexion",
        verification: "Vérification",
      };
      pageTitle = `${publicPageTitles[publicPage]} - `;
    }

    document.title = `${pageTitle}${baseTitle}`;
  }, [settings.app_title, settings.app_company, view, dashPage, publicPage]);

  // ============================================
  // GESTION DES META TAGS SEO
  // ============================================
  useEffect(() => {
    // Meta description
    let metaDescription = document.querySelector(
      'meta[name="description"]',
    ) as HTMLMetaElement;
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    }
    metaDescription.content =
      settings.seo_description ||
      `${settings.app_company || "Gnamba Services"} - BTP, Immobilier & Foncier en Côte d'Ivoire.`;

    // Meta keywords
    let metaKeywords = document.querySelector(
      'meta[name="keywords"]',
    ) as HTMLMetaElement;
    if (!metaKeywords) {
      metaKeywords = document.createElement("meta");
      metaKeywords.setAttribute("name", "keywords");
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.content =
      settings.seo_keywords ||
      "BTP, immobilier, foncier, construction, Côte d'Ivoire, Gnamba Services";

    // Open Graph tags
    let ogTitle = document.querySelector(
      'meta[property="og:title"]',
    ) as HTMLMetaElement;
    if (!ogTitle) {
      ogTitle = document.createElement("meta");
      ogTitle.setAttribute("property", "og:title");
      document.head.appendChild(ogTitle);
    }
    ogTitle.content =
      settings.app_title ||
      `${settings.app_company || "Gnamba Services"} - BTP, Immobilier & Foncier`;

    let ogDescription = document.querySelector(
      'meta[property="og:description"]',
    ) as HTMLMetaElement;
    if (!ogDescription) {
      ogDescription = document.createElement("meta");
      ogDescription.setAttribute("property", "og:description");
      document.head.appendChild(ogDescription);
    }
    ogDescription.content =
      settings.seo_description ||
      `${settings.app_company || "Gnamba Services"} - BTP, Immobilier & Foncier en Côte d'Ivoire.`;
  }, [
    settings.app_title,
    settings.app_company,
    settings.seo_description,
    settings.seo_keywords,
  ]);

  const role = profile?.role;
  const accessLevel = profile?.access_level;

  const resolveDashboardTarget = useCallback(
    (page: Page): Page => {
      if (hasAccess(role, page, accessLevel)) return page;
      const fallback = (Object.keys(dashboardPages) as Page[]).find(
        (candidate) => hasAccess(role, candidate, accessLevel),
      );
      return fallback || "dashboard";
    },
    [role, accessLevel],
  );

  const syncRootPath = useCallback((mode: "push" | "replace" = "replace") => {
    if (typeof window === "undefined") return;

    const nextPath = "/";
    if (window.location.pathname === nextPath) return;
    if (mode === "replace") {
      window.history.replaceState(null, "", nextPath);
    } else {
      window.history.pushState(null, "", nextPath);
    }
  }, []);

  const syncDashboardPath = useCallback(
    (page: Page, mode: "push" | "replace" = "push") => {
      if (typeof window === "undefined") return;
      const nextPath = DASHBOARD_PAGE_PATHS[page] || "/dashboard";
      if (window.location.pathname === nextPath) return;
      if (mode === "replace") {
        window.history.replaceState(null, "", nextPath);
      } else {
        window.history.pushState(null, "", nextPath);
      }
    },
    [],
  );

  const syncPublicPath = useCallback(
    (page: PublicPage, mode: "push" | "replace" = "push") => {
      if (typeof window === "undefined") return;
      const nextPath = PUBLIC_PAGE_PATHS[page] || "/";
      if (window.location.pathname === nextPath) return;
      if (mode === "replace") {
        window.history.replaceState(null, "", nextPath);
      } else {
        window.history.pushState(null, "", nextPath);
      }
    },
    [],
  );

  const resolveRouteFromLocation = useCallback(() => {
    const path = window.location.pathname;
    const normalizedPath = normalizePath(path);

    if (normalizedPath === "/forgot-password") {
      setView("public");
      setPublicPage("login");
      setShowForgotPassword(true);
      setShowAccueil(false);
      return;
    }

    if (normalizedPath === "/reset-password") {
      setView("public");
      setPublicPage("login");
      setShowForgotPassword(false);
      setShowAccueil(false);
      return;
    }

    if (normalizedPath.startsWith("/verification-attestation")) {
      setView("public");
      setPublicPage("verification");
      setShowAccueil(false);
      return;
    }

    // New route for hash-based verification (e.g., /verify/abc123)
    if (normalizedPath.startsWith("/verify/")) {
      setView("public");
      setPublicPage("verification");
      setShowAccueil(false);
      return;
    }

    // Accueil employé par défaut si connecté et path racine
    if (normalizedPath === "/" && user) {
      setView("dashboard");
      setDashPage("dashboard");
      setShowAccueil(true);
      return;
    }

    const dashboardFromPath = getDashboardPageFromPath(normalizedPath);
    if (dashboardFromPath) {
      if (user) {
        const targetPage = resolveDashboardTarget(dashboardFromPath);
        setView("dashboard");
        setDashPage(targetPage);
        setShowAccueil(false);
        syncDashboardPath(targetPage, "replace");
      } else {
        window.localStorage.setItem(POST_LOGIN_PATH_KEY, normalizedPath);
        setView("public");
        setPublicPage("login");
        setShowAccueil(false);
        syncPublicPath("login", "replace");
      }
      return;
    }

    const publicFromPath = getPublicPageFromPath(normalizedPath);
    if (publicFromPath) {
      if (publicFromPath === "login" && user) {
        setView("dashboard");
        setDashPage("dashboard");
        setShowAccueil(true);
        syncRootPath("replace");
        return;
      }
      setView("public");
      setPublicPage(publicFromPath);
      setShowForgotPassword(false);
      setShowAccueil(false);
      return;
    }

    // Sinon, afficher l'accueil employé ou le dashboard
    if (user) {
      setView("dashboard");
      setDashPage("dashboard");
      setShowAccueil(true);
      syncRootPath("replace");
      return;
    }

    setView("public");
    setPublicPage("home");
    syncPublicPath("home", "replace");
  }, [
    user,
    syncDashboardPath,
    syncRootPath,
    syncPublicPath,
    resolveDashboardTarget,
  ]);

  // Gestion du bouton retour/avant du navigateur
  useEffect(() => {
    resolveRouteFromLocation();
    window.addEventListener("popstate", resolveRouteFromLocation);
    return () =>
      window.removeEventListener("popstate", resolveRouteFromLocation);
  }, [resolveRouteFromLocation]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const canonicalFromEnv = import.meta.env.VITE_CANONICAL_ORIGIN;
    const canonicalKey = "egs:canonical_origin";
    const normalizeOrigin = (value: string | null) => {
      if (!value) return null;
      try {
        return new URL(value).origin;
      } catch {
        return null;
      }
    };
    const stored = normalizeOrigin(window.localStorage.getItem(canonicalKey));
    const envOrigin = normalizeOrigin(canonicalFromEnv);
    const currentOrigin = window.location.origin;
    const hostname = window.location.hostname;
    const isLocalhost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]";

    let canonical = envOrigin || stored;
    if (!canonical && !isLocalhost) {
      canonical = currentOrigin;
    }

    if (!envOrigin && canonical && canonical === currentOrigin && !stored) {
      window.localStorage.setItem(canonicalKey, canonical);
    }

    if (canonical && currentOrigin !== canonical) {
      const target = `${canonical}${window.location.pathname}${window.location.search}${window.location.hash}`;
      window.location.replace(target);
    }
  }, []);

  const isLoading = settingsLoading || authLoading;

  useEffect(() => {
    const layoutSlug = publicPageLayoutSlug[publicPage];

    if (!layoutSlug) {
      setPublishedLayoutSections(null);
      setPublishedLayoutLoading(false);
      return;
    }

    let cancelled = false;
    setPublishedLayoutSections(null);
    setPublishedLayoutLoading(true);

    void (async () => {
      const { data, error } = await supabase
        .from("page_layouts")
        .select("layout_json")
        .eq("page_slug", layoutSlug)
        .eq("is_published", true)
        .maybeSingle();

      if (cancelled) return;

      const sections = Array.isArray(data?.layout_json)
        ? (data.layout_json as PageSection[])
        : [];
      if (error || sections.length === 0) {
        setPublishedLayoutSections(null);
        setPublishedLayoutLoading(false);
        return;
      }

      setPublishedLayoutSections(sections);
      setPublishedLayoutLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [publicPage]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (typeof detail !== "string") return;
      if (detail === "accueil") {
        syncRootPath("replace");
        setView("dashboard");
        setDashPage("dashboard");
        setShowAccueil(true);
        return;
      }
      if (detail === "registre") {
        const target = resolveDashboardTarget("registre");
        syncDashboardPath(target);
        setView("dashboard");
        setDashPage(target);
        setShowAccueil(false);
        return;
      }
      // Pour toute autre page du dashboard, on quitte l'accueil employé
      if (detail in dashboardPages) {
        const target = resolveDashboardTarget(detail as Page);
        syncDashboardPath(target);
        setView("dashboard");
        setDashPage(target);
        setShowAccueil(false);
        return;
      }
    };
    window.addEventListener("egs:navigate", handler as EventListener);
    return () =>
      window.removeEventListener("egs:navigate", handler as EventListener);
  }, [syncDashboardPath, syncRootPath, resolveDashboardTarget]);

  // NOTE: route resolution handled by resolveRouteFromLocation
  useEffect(() => {
    if (view !== "dashboard" || !user) return;
    const target = resolveDashboardTarget(dashPage);
    if (target !== dashPage) {
      setDashPage(target);
      syncDashboardPath(target, "replace");
    }
  }, [view, user, dashPage, resolveDashboardTarget, syncDashboardPath]);

  if (isLoading) {
    return (
      <>
        {showProdBanner && (
          <div className="bg-amber-100 text-amber-800 text-xs px-3 py-2 border-b border-amber-200">
            Mode production local détecté. Pour le dev, utilisez npm run dev
            (port 5173). Build: {buildTime}
          </div>
        )}
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
              style={{ borderColor: settings.primary_color || "#1e40af" }}
            />
            <p className="text-gray-500 text-sm">
              Chargement de {settings.app_title || "EGS"}...
            </p>
            {!sw.online && (
              <div className="mt-4 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-xs inline-flex items-center gap-2">
                <WifiOff size={14} aria-hidden="true" />
                <span>Mode hors ligne activé</span>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  const handlePublicNav = (page: PublicPage) => {
    if (page === "login") {
      setPublicPage("login");
      setShowForgotPassword(false);
    } else {
      setPublicPage(page);
      setShowForgotPassword(false);
    }
    syncPublicPath(page);
  };

  const handleLoginSuccess = () => {
    const pendingPath =
      typeof window !== "undefined"
        ? window.localStorage.getItem(POST_LOGIN_PATH_KEY)
        : null;
    if (pendingPath) {
      const targetPage = getDashboardPageFromPath(pendingPath);
      window.localStorage.removeItem(POST_LOGIN_PATH_KEY);
      if (targetPage) {
        const resolved = resolveDashboardTarget(targetPage);
        setView("dashboard");
        setDashPage(resolved);
        setShowAccueil(false);
        syncDashboardPath(resolved, "replace");
        return;
      }
    }
    setView("dashboard");
    setDashPage("dashboard");
    setShowAccueil(true);
    syncRootPath("replace");
  };

  const handleDashNav = (page: Page) => {
    const targetPage = resolveDashboardTarget(page);
    syncDashboardPath(targetPage);
    setDashPage(targetPage);
    setShowAccueil(false);
  };

  const goToPublic = () => {
    syncRootPath("replace");
    setView("public");
    setPublicPage("home");
    syncPublicPath("home", "replace");
  };

  const getPageTitle = (page: Page): string => {
    const titles: Record<Page, string> = {
      dashboard: "Tableau de Bord",
      clients: "Clients",
      projets: "Projets BTP",
      immobilier: "Immobilier",
      foncier: "Foncier",
      fournitures: "Fournitures",
      finances: "Finances",
      employes: "Employés",
      utilisateurs: "Utilisateurs",
      fournisseurs: "Fournisseurs",
      documents: "Documents",
      taches: "Tâches",
      statistiques: "Statistiques",
      parametres: "Paramètres",
      "site-editor": "Site Vitrine",
      media: "Média",
      registre: "Registre Visiteur",
      leads: "Leads & Campagnes",
    };
    return titles[page];
  };

  if (view === "dashboard" && user) {
    // TOUS les utilisateurs (admin, gestionnaire, employé) -> Page d'accueil employé en premier
    if (showAccueil) {
      return (
        <>
          {showProdBanner && (
            <div className="bg-amber-100 text-amber-800 text-xs px-3 py-2 border-b border-amber-200">
              Mode production local détecté. Pour le dev, utilisez npm run dev
              (port 5173). Build: {buildTime}
            </div>
          )}
          <style>{themeCss}</style>
          <Suspense
            fallback={<PageLoader label="Chargement de l'accueil employé..." />}
          >
            <AccueilEmploye />
          </Suspense>
        </>
      );
    }

    // Page Registre Visiteur (via dashPage)
    if (dashPage === "registre") {
      return (
        <>
          {showProdBanner && (
            <div className="bg-amber-100 text-amber-800 text-xs px-3 py-2 border-b border-amber-200">
              Mode production local détecté. Pour le dev, utilisez npm run dev
              (port 5173). Build: {buildTime}
            </div>
          )}
          <style>{themeCss}</style>
          <Suspense
            fallback={<PageLoader label="Chargement du registre visiteur..." />}
          >
            <RegistreVisiteur />
          </Suspense>
        </>
      );
    }

    // Ensuite, afficher le Dashboard avec Layout
    const PageComponent = dashboardPages[dashPage];
    return (
      <>
        {showProdBanner && (
          <div className="bg-amber-100 text-amber-800 text-xs px-3 py-2 border-b border-amber-200">
            Mode production local détecté. Pour le dev, utilisez npm run dev
            (port 5173). Build: {buildTime}
          </div>
        )}
        <style>{themeCss}</style>
        <Layout
          activePage={dashPage}
          onNavigate={handleDashNav}
          onGoPublic={goToPublic}
        >
          <Suspense fallback={<PageLoader label="Chargement du module..." />}>
            <ErrorBoundary moduleName={getPageTitle(dashPage)} key={dashPage}>
              <PageComponent />
            </ErrorBoundary>
          </Suspense>
        </Layout>
      </>
    );
  }

  // Page de réinitialisation du mot de passe (depuis email)
  if (
    typeof window !== "undefined" &&
    window.location.hash.includes("type=recovery")
  ) {
    return (
      <>
        {showProdBanner && (
          <div className="bg-amber-100 text-amber-800 text-xs px-3 py-2 border-b border-amber-200">
            Mode production local détecté. Pour le dev, utilisez npm run dev
            (port 5173). Build: {buildTime}
          </div>
        )}
        <style>{themeCss}</style>
        <Suspense fallback={<PageLoader label="Chargement..." />}>
          <ResetPasswordPage onSuccess={handleLoginSuccess} />
        </Suspense>
      </>
    );
  }

  if (publicPage === "login") {
    // FIX: Removed setView from render - now handled by useEffect above
    if (showForgotPassword) {
      return (
        <>
          {showProdBanner && (
            <div className="bg-amber-100 text-amber-800 text-xs px-3 py-2 border-b border-amber-200">
              Mode production local détecté. Pour le dev, utilisez npm run dev
              (port 5173). Build: {buildTime}
            </div>
          )}
          <style>{themeCss}</style>
          <Suspense fallback={<PageLoader label="Chargement..." />}>
            <ForgotPasswordPage
              onBack={() => {
                setShowForgotPassword(false);
                syncPublicPath("login", "replace");
              }}
            />
          </Suspense>
        </>
      );
    }
    return (
      <>
        {showProdBanner && (
          <div className="bg-amber-100 text-amber-800 text-xs px-3 py-2 border-b border-amber-200">
            Mode production local détecté. Pour le dev, utilisez npm run dev
            (port 5173). Build: {buildTime}
          </div>
        )}
        <style>{themeCss}</style>
        <Suspense
          fallback={<PageLoader label="Chargement de la connexion..." />}
        >
          <LoginPage
            onSuccess={handleLoginSuccess}
            onForgotPassword={() => {
              setShowForgotPassword(true);
              if (
                typeof window !== "undefined" &&
                window.location.pathname !== "/forgot-password"
              ) {
                window.history.pushState(null, "", "/forgot-password");
              }
            }}
          />
        </Suspense>
      </>
    );
  }

  const PublicPageComponent = publicPages[publicPage] || PublicHome;
  const hasPublishedLayout =
    !!publishedLayoutSections && publishedLayoutSections.length > 0;
  const showPublicFooter = !publishedLayoutSections?.some(
    (section) => section.type === "footer",
  );

  // Check if we're on the hash-based verification route
  const isHashVerificationRoute =
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/verify/");

  return (
    <>
      {showProdBanner && (
        <div className="bg-amber-100 text-amber-800 text-xs px-3 py-2 border-b border-amber-200">
          Mode production local détecté. Pour le dev, utilisez npm run dev (port
          5173). Build: {buildTime}
        </div>
      )}
      <style>{themeCss}</style>
      {isHashVerificationRoute ? (
        <Suspense
          fallback={<PageLoader label="Chargement de la vérification..." />}
        >
          <VerificationAttestation />
        </Suspense>
      ) : (
        <PublicLayout
          activePage={publicPage}
          onNavigate={handlePublicNav}
          showFooter={showPublicFooter}
        >
          {publishedLayoutLoading ? (
            <div className="min-h-[50vh] flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700 mx-auto mb-4" />
                <p className="text-sm text-gray-500">
                  Chargement du site public...
                </p>
              </div>
            </div>
          ) : hasPublishedLayout ? (
            <>
              <PublicPageLayoutRenderer
                sections={publishedLayoutSections}
                onNavigate={handlePublicNav}
              />
              {publicPage === "home" && <PublicSocialWall />}
            </>
          ) : (
            <Suspense
              fallback={<PageLoader label="Chargement du site public..." />}
            >
              <PublicPageComponent onNavigate={handlePublicNav} />
            </Suspense>
          )}
        </PublicLayout>
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </AuthProvider>
  );
}

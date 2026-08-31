import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type LazyExoticComponent,
} from "react";
import { SettingsProvider, useSettings } from "./context/SettingsContext";
import { AuthProvider, useAuth, hasAccess } from "./context/AuthContext";
import {
  NotificationProvider,
  useNotifications,
} from "./context/NotificationContext";
import ToastContainer from "./components/ui/Toast";
import { useServiceWorker } from "./lib/useServiceWorker";
import { WifiOff } from "lucide-react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { OfflineIndicator } from "./offline/ui/offline-indicator";
import Layout from "./components/Layout";
import PublicLayout from "./components/public/PublicLayout";
import type { Page } from "./components/Sidebar";
import type { PublicPage } from "./lib/publicRoutes";
import { PUBLIC_PAGE_PATHS, getPublicPageFromPath } from "./lib/publicRoutes";
import { apiClient } from "./api/client";
import { useContentVersion } from "./hooks/useContentVersion";
import type { PageSection } from "./components/page-builder/types";
import PublicPageLayoutRenderer from "./components/public/PublicPageLayoutRenderer";
import PublicSocialWall from "./components/public/PublicSocialWall";
import { OFFICIAL_CONTACT } from "./lib/officialContact";
import OneSignal from "react-onesignal";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Clients = lazy(() => import("./pages/Clients"));
const Projets = lazy(() => import("./pages/Projets"));
const Immobilier = lazy(() => import("./pages/Immobilier"));
const Foncier = lazy(() => import("./pages/Foncier"));
const CatalogueLots = lazy(() => import("./pages/CatalogueLots"));
const Fournitures = lazy(() => import("./pages/Fournitures"));
const Finances = lazy(() => import("./pages/Finances"));
const Employes = lazy(() => import("./pages/Employes"));
const Utilisateurs = lazy(() => import("./pages/Utilisateurs"));
const Fournisseurs = lazy(() => import("./pages/Fournisseurs"));
const Documents = lazy(() => import("./pages/Documents"));
const Taches = lazy(() => import("./pages/Taches"));
const Statistiques = lazy(() => import("./pages/Statistiques"));
const Parametres = lazy(() => import("./pages/Parametres"));
const CodexAssistant = lazy(() => import("./pages/CodexAssistant"));
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
const PublicImmobilier = lazy(() => import("./pages/public/PublicImmobilier"));
const PublicFoncier = lazy(() => import("./pages/public/PublicFoncier"));
const PublicLotissement = lazy(
  () => import("./pages/public/PublicLotissement"),
);
const PublicBtpConstruction = lazy(
  () => import("./pages/public/PublicBtpConstruction"),
);
const PublicRealisations = lazy(
  () => import("./pages/public/PublicRealisations"),
);
const PublicTestimonials = lazy(
  () => import("./pages/public/PublicTestimonials"),
);
const PublicBlog = lazy(() => import("./pages/public/PublicBlog"));
const PublicContact = lazy(() => import("./pages/public/PublicContact"));
const PublicFAQ = lazy(() => import("./pages/public/PublicFAQ"));
const PublicLegal = lazy(() => import("./pages/public/PublicLegal"));
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
const PublicLots = lazy(() => import("./pages/public/PublicLots"));

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
  "catalogue-lots": CatalogueLots,
  fournitures: Fournitures,
  finances: Finances,
  employes: Employes,
  utilisateurs: Utilisateurs,
  fournisseurs: Fournisseurs,
  documents: Documents,
  taches: Taches,
  statistiques: Statistiques,
  parametres: Parametres,
  "codex-assistant": CodexAssistant,
  "site-editor": SiteEditor,
  media: Media,
  registre: RegistreVisiteur,
  leads: Leads,
};

const PublicAboutPage: ComponentType<{
  onNavigate: (page: PublicPage) => void;
}> = (_props) => <PublicAbout />;
const PublicImmobilierPage: ComponentType<{
  onNavigate: (page: PublicPage) => void;
}> = (props) => <PublicImmobilier onNavigate={props.onNavigate} />;
const PublicFoncierPage: ComponentType<{
  onNavigate: (page: PublicPage) => void;
}> = (props) => <PublicFoncier onNavigate={props.onNavigate} />;
const PublicLotissementPage: ComponentType<{
  onNavigate: (page: PublicPage) => void;
}> = (props) => <PublicLotissement onNavigate={props.onNavigate} />;
const PublicBtpConstructionPage: ComponentType<{
  onNavigate: (page: PublicPage) => void;
}> = (props) => <PublicBtpConstruction onNavigate={props.onNavigate} />;
const PublicRealisationsPage: ComponentType<{
  onNavigate: (page: PublicPage) => void;
}> = (_props) => <PublicRealisations />;
const PublicTestimonialsPage: ComponentType<{
  onNavigate: (page: PublicPage) => void;
}> = (props) => <PublicTestimonials onNavigate={props.onNavigate} />;
const PublicBlogPage: ComponentType<{
  onNavigate: (page: PublicPage) => void;
}> = (props) => <PublicBlog onNavigate={props.onNavigate} />;
const PublicContactPage: ComponentType<{
  onNavigate: (page: PublicPage) => void;
}> = (_props) => <PublicContact />;
const PublicFAQPage: ComponentType<{
  onNavigate: (page: PublicPage) => void;
}> = (props) => <PublicFAQ onNavigate={props.onNavigate} />;
const PublicLegalPage: ComponentType<{
  onNavigate: (page: PublicPage) => void;
}> = (_props) => <PublicLegal />;

const publicPages: Record<string, PublicPageComponent> = {
  home: PublicHome,
  about: PublicAboutPage,
  services: PublicServices,
  immobilier: PublicImmobilierPage,
  foncier: PublicFoncierPage,
  lotissement: PublicLotissementPage,
  "btp-construction": PublicBtpConstructionPage,
  realisations: PublicRealisationsPage,
  temoignages: PublicTestimonialsPage,
  blog: PublicBlogPage,
  contact: PublicContactPage,
  faq: PublicFAQPage,
  "mentions-legales": PublicLegalPage,
  verification: PublicVerification,
  lots: PublicLots,
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
  "catalogue-lots": "/lots-a-vendre",
  fournitures: "/fournitures",
  finances: "/finances",
  employes: "/employes",
  utilisateurs: "/utilisateurs",
  fournisseurs: "/fournisseurs",
  documents: "/documents",
  taches: "/taches",
  statistiques: "/statistiques",
  parametres: "/parametres",
  "codex-assistant": "/codex-assistant",
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

function NotificationToastWrapper() {
  const { toasts, removeToast } = useNotifications();
  return <ToastContainer toasts={toasts} onClose={removeToast} />;
}

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

type SeoConfig = {
  title: string;
  description: string;
  keywords: string;
  noindex?: boolean;
};

const PUBLIC_SEO_CONFIG: Partial<Record<PublicPage, SeoConfig>> = {
  home: {
    title: "GNAMBA SERVICES | Immobilier, Foncier & BTP en Côte d'Ivoire",
    description:
      "GNAMBA SERVICES, votre expert foncier, immobilier et BTP à Sikensi. Achat de terrain sécurisé, construction de villa, lotissement. Devis gratuit 48h.",
    keywords:
      "achat terrain Sikensi, terrain à vendre Côte d'Ivoire, sécurisation foncière Côte d'Ivoire, lotissement Agnéby-Tiassa, construction villa Abidjan, GNAMBA SERVICES",
  },
  about: {
    title: "À propos de GNAMBA SERVICES | Expert Foncier & Immobilier Sikensi",
    description:
      "Fondée en 2021, GNAMBA SERVICES accompagne particuliers et entreprises en Côte d'Ivoire. Foncier, immobilier, BTP, lotissement. Transparence et expertise.",
    keywords:
      "GNAMBA SERVICES, expert foncier Sikensi, entreprise immobilière Côte d'Ivoire, BTP, lotissement, équipe, expertise",
  },
  services: {
    title: "Services Foncier, Immobilier, Lotissement & BTP | GNAMBA SERVICES",
    description:
      "Immobilier, foncier sécurisé, lotissement, BTP & construction et fournitures professionnelles en Côte d'Ivoire. Un seul interlocuteur, devis rapide.",
    keywords:
      "services immobiliers, sécurisation foncière, lotissement Sikensi, BTP Côte d'Ivoire, fournitures professionnelles, GNAMBA SERVICES",
  },
  realisations: {
    title: "Réalisations de GNAMBA SERVICES | Projets terrain en Côte d'Ivoire",
    description:
      "Parcourez nos réalisations pour évaluer notre savoir-faire en BTP, immobilier, foncier et fournitures en Côte d'Ivoire.",
    keywords:
      "réalisations BTP, références immobilières, projets fonciers, portfolio Côte d'Ivoire, GNAMBA SERVICES",
  },
  immobilier: {
    title: "Immobilier | Gestion, vente et valorisation | GNAMBA SERVICES",
    description:
      "Gestion locative, vente, achat et accompagnement immobilier en Côte d'Ivoire. GNAMBA SERVICES vous aide à valoriser votre patrimoine.",
    keywords:
      "immobilier Côte d'Ivoire, gestion locative, vente de biens, estimation immobilière, GNAMBA SERVICES",
  },
  foncier: {
    title: "Foncier | Sécurisation et suivi des dossiers | GNAMBA SERVICES",
    description:
      "Sécurisation foncière, bornage, régularisation et constitution de dossiers pour vos terrains. Une approche claire et opérationnelle.",
    keywords:
      "foncier Côte d'Ivoire, sécurisation terrain, bornage, régularisation foncière, GNAMBA SERVICES",
  },
  lotissement: {
    title: "Lotissement | Parcelles et commercialisation | GNAMBA SERVICES",
    description:
      "Lotissement, découpage et mise en marché de parcelles à vendre avec une présentation claire et commerciale.",
    keywords:
      "lotissement Côte d'Ivoire, parcelles à vendre, commercialisation foncière, GNAMBA SERVICES",
  },
  "btp-construction": {
    title:
      "BTP & Construction | Chantier, rénovation et suivi | GNAMBA SERVICES",
    description:
      "Construction, rénovation et suivi de chantier avec une équipe orientée résultat et un accompagnement de proximité.",
    keywords:
      "BTP Côte d'Ivoire, construction villa, rénovation, suivi de chantier, GNAMBA SERVICES",
  },
  contact: {
    title:
      "Contact & Devis Gratuit — BTP, Immobilier, Foncier Sikensi | GNAMBA SERVICES",
    description:
      "Contactez GNAMBA SERVICES pour un devis gratuit. Téléphone, WhatsApp (+225 07 77 96 01 49) ou email. Réponse sous 48h ouvrées.",
    keywords:
      "contact GNAMBA SERVICES, devis BTP, WhatsApp entreprise, Sikensi, Côte d'Ivoire, immobilier, foncier",
  },
  faq: {
    title: "FAQ Lots à vendre et services | GNAMBA SERVICES",
    description:
      "Retrouvez les réponses aux questions fréquentes sur nos lots à vendre, la réservation, les documents et le suivi commercial.",
    keywords:
      "FAQ lots à vendre, questions fréquentes, réservation terrain, GNAMBA SERVICES",
  },
  temoignages: {
    title: "Témoignages clients | GNAMBA SERVICES",
    description:
      "Retours clients sur nos services BTP, immobilier et foncier en Côte d'Ivoire.",
    keywords:
      "témoignages clients, avis GNAMBA SERVICES, retours expérience, BTP, immobilier, foncier",
  },
  blog: {
    title: "Blog conseils | GNAMBA SERVICES",
    description:
      "Conseils pratiques et contenus utiles autour du foncier, de l'immobilier et du BTP.",
    keywords: "blog immobilier, conseils foncier, blog BTP, GNAMBA SERVICES",
  },
  "mentions-legales": {
    title: "Mentions légales | GNAMBA SERVICES",
    description:
      "Consultez les informations légales officielles de GNAMBA SERVICES, ainsi que nos coordonnées et références administratives.",
    keywords: "mentions légales, GNAMBA SERVICES, RCCM, NCC, Côte d'Ivoire",
  },
  lots: {
    title: "Lots à Vendre Sikensi, Bingerville, Grand-Bassam | GNAMBA SERVICES",
    description:
      "Parcelles vérifiées, bornées et documentées à vendre en Côte d'Ivoire. Consultez nos lots disponibles ou contactez-nous pour des offres privées.",
    keywords:
      "lots fonciers, terrain à vendre, investissement foncier, Sikensi, Côte d'Ivoire, GNAMBA SERVICES",
  },
};

const AUTH_SEO_CONFIG: SeoConfig = {
  title: "Connexion",
  description:
    "Accédez à l'espace interne Gnamba Services. Page réservée aux utilisateurs autorisés.",
  keywords: "connexion, espace interne, Gnamba Services",
  noindex: true,
};

const VERIFICATION_SEO_CONFIG: SeoConfig = {
  title: "Vérification d'attestation",
  description:
    "Vérifiez une attestation Gnamba Services de manière sécurisée et rapide.",
  keywords: "vérification attestation, Gnamba Services",
  noindex: true,
};

const DASHBOARD_SEO_CONFIG: SeoConfig = {
  title: "Espace interne",
  description:
    "Tableau de bord interne Gnamba Services pour la gestion commerciale, opérationnelle et administrative.",
  keywords: "espace interne, tableau de bord, Gnamba Services",
  noindex: true,
};

const ensureMeta = (name: string, attribute: "name" | "property") => {
  let element = document.querySelector(
    `meta[${attribute}="${name}"]`,
  ) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  return element;
};

const ensureLink = (rel: string) => {
  let element = document.querySelector(
    `link[rel="${rel}"]`,
  ) as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }
  return element;
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
  const oneSignalInitializedRef = useRef(false);
  const oneSignalBlockedRef = useRef(false);
  const contentVersion = useContentVersion();
  const { showToast } = useNotifications();
  const [view, setView] = useState<AppView>("public");
  const [publicPage, setPublicPage] = useState<PublicPage>("home");
  const [dashPage, setDashPage] = useState<Page>("dashboard");

  const isOneSignalAllowedByCsp = useCallback(() => {
    if (typeof document === "undefined") return false;
    const cspMeta = document.querySelector(
      'meta[http-equiv="Content-Security-Policy"]',
    ) as HTMLMetaElement | null;
    if (!cspMeta) return true;
    const content = cspMeta.getAttribute("content") || "";
    return (
      /https:\/\/cdn\.onesignal\.com/.test(content) ||
      /https:\/\/static\.cloudflareinsights\.com/.test(content) ||
      /https:\/\/cloudflareinsights\.com/.test(content)
    );
  }, []);
  const [publishedLayoutSections, setPublishedLayoutSections] = useState<
    PageSection[] | null
  >(null);
  const [publishedLayoutLoading, setPublishedLayoutLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [, setOneSignalBlocked] = useState(false);
  // État pour page d'accueil employé
  // Initialisé à true pour afficher la page d'accueil par défaut après connexion
  const [showAccueil, setShowAccueil] = useState(true);
  const POST_LOGIN_PATH_KEY = "egs:post_login_path";
  // Local/dev detection is controlled by build-time env to avoid embedding
  // literal private hostnames in the production bundle.
  const isLocalhost = import.meta.env.DEV
    ? import.meta.env.VITE_ENABLE_LOCAL_DEV === "true"
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

  // Démarrer le service de synchronisation en background
  useEffect(() => {
    try {
      // lazy require to avoid SSR issues
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { startManualSyncService } = require("./lib/manualSyncService");
      const stop = startManualSyncService({
        onError: (err: Error) => {
          try {
            showToast("error", "Sync automatique", err.message || String(err));
          } catch (e) {
            // ignore
          }
        },
      });
      return () => stop();
    } catch (e) {
      // ignore in non-browser environments
    }
  }, []);

  // ============================================
  // GESTION DYNAMIQUE DU TITRE DE L'ONGLET
  // ============================================
  useEffect(() => {
    const fallbackTitle = `${settings.app_company || OFFICIAL_CONTACT.companyName} - BTP, Immobilier & Foncier`;
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
          "catalogue-lots": "Catalogue Commercial",
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
        "codex-assistant": "Assistant Codex",
        registre: "Registre Visiteur",
        leads: "Leads & Campagnes",
      };
      pageTitle = `${pageTitles[dashPage]} - `;
    } else if (view === "public" && publicPage) {
      const publicPageTitles: Record<PublicPage, string> = {
        home: "Accueil",
        about: "À Propos",
        services: "Services",
        immobilier: "Immobilier",
        foncier: "Foncier",
        lotissement: "Lotissement",
        "btp-construction": "BTP & Construction",
        realisations: "Réalisations",
        temoignages: "Témoignages",
        blog: "Blog",
        contact: "Contact",
        faq: "FAQ",
        "mentions-legales": "Mentions légales",
        login: "Connexion",
        verification: "Vérification",
        lots: "Lots à vendre",
      };
      pageTitle = `${publicPageTitles[publicPage]} - `;
    }

    document.title = `${pageTitle}${baseTitle}`;
  }, [settings.app_title, settings.app_company, view, dashPage, publicPage]);

  // ============================================
  // GESTION DES META TAGS SEO
  // ============================================
  useEffect(() => {
    const canonicalHost = "gnambaservices.ci";
    const currentPath =
      typeof window !== "undefined"
        ? normalizePath(window.location.pathname)
        : "/";

    const brandName =
      view === "public"
        ? OFFICIAL_CONTACT.companyName
        : settings.app_company || OFFICIAL_CONTACT.companyName;
    const publicSeo: SeoConfig =
      PUBLIC_SEO_CONFIG[publicPage] ?? PUBLIC_SEO_CONFIG.home!;
    const internalSeo =
      view === "dashboard"
        ? DASHBOARD_SEO_CONFIG
        : currentPath === "/login" ||
            currentPath === "/forgot-password" ||
            currentPath === "/reset-password"
          ? AUTH_SEO_CONFIG
          : currentPath.startsWith("/verification-attestation") ||
              currentPath.startsWith("/verify/")
            ? VERIFICATION_SEO_CONFIG
            : null;

    let seoConfig: SeoConfig;
    if (view === "public") {
      if (
        currentPath === "/verification-attestation" ||
        currentPath.startsWith("/verify/")
      ) {
        seoConfig = VERIFICATION_SEO_CONFIG;
      } else if (
        currentPath === "/login" ||
        currentPath === "/forgot-password" ||
        currentPath === "/reset-password"
      ) {
        seoConfig = AUTH_SEO_CONFIG;
      } else {
        seoConfig = publicSeo;
      }
    } else {
      seoConfig = internalSeo || DASHBOARD_SEO_CONFIG;
    }

    const pageTitle = `${seoConfig.title} | ${brandName}`;
    document.title = pageTitle;

    const description =
      view === "public"
        ? seoConfig.description
        : settings.seo_description?.trim() || seoConfig.description;
    const keywords =
      view === "public"
        ? seoConfig.keywords
        : settings.seo_keywords?.trim() || seoConfig.keywords;
    const robotsContent = seoConfig.noindex
      ? "noindex,nofollow"
      : "index,follow,max-image-preview:large,max-snippet:-1";

    ensureMeta("description", "name").content = description;
    ensureMeta("keywords", "name").content = keywords;
    ensureMeta("robots", "name").content = robotsContent;
    ensureMeta("theme-color", "name").content =
      settings.primary_color || "#1e40af";

    const canonicalPath =
      view === "public"
        ? publicPage === "login"
          ? "/login"
          : publicPage === "verification"
            ? "/verification-attestation"
            : PUBLIC_PAGE_PATHS[publicPage] || currentPath || "/"
        : currentPath;
    const canonicalUrl = `https://${canonicalHost}${canonicalPath}`;

    ensureLink("canonical").href = canonicalUrl;

    const ogImage =
      settings.brand_logo_dark || settings.brand_favicon_url || "/og-image.png";
    const ogImageUrl = (() => {
      try {
        return new URL(ogImage, canonicalUrl).toString();
      } catch {
        return ogImage;
      }
    })();

    ensureMeta("og:type", "property").content = "website";
    ensureMeta("og:title", "property").content = pageTitle;
    ensureMeta("og:description", "property").content = description;
    ensureMeta("og:url", "property").content = canonicalUrl;
    ensureMeta("og:image", "property").content = ogImageUrl;
    ensureMeta("og:locale", "property").content = "fr_FR";
    ensureMeta("twitter:card", "name").content = "summary_large_image";
    ensureMeta("twitter:title", "name").content = pageTitle;
    ensureMeta("twitter:description", "name").content = description;
    ensureMeta("twitter:image", "name").content = ogImageUrl;

    let schemaScript = document.getElementById(
      "egs-organization-schema",
    ) as HTMLScriptElement | null;
    if (!schemaScript) {
      schemaScript = document.createElement("script");
      schemaScript.id = "egs-organization-schema";
      schemaScript.type = "application/ld+json";
      document.head.appendChild(schemaScript);
    }

    if (view === "public" && !seoConfig.noindex) {
      const socialSameAs = [
        settings.social_facebook,
        settings.social_instagram,
        settings.social_linkedin,
        settings.social_youtube,
        settings.social_twitter,
        settings.social_tiktok,
      ].filter(Boolean);
      const schema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: brandName,
        url: canonicalUrl,
        description,
        areaServed: {
          "@type": "Country",
          name: "Côte d'Ivoire",
        },
        sameAs: socialSameAs,
      };
      schemaScript.textContent = JSON.stringify(schema);
    } else {
      schemaScript.textContent = "";
    }
  }, [
    publicPage,
    view,
    settings.app_title,
    settings.app_company,
    settings.seo_description,
    settings.seo_keywords,
    settings.primary_color,
    settings.brand_logo_dark,
    settings.brand_favicon_url,
    settings.social_facebook,
    settings.social_instagram,
    settings.social_linkedin,
    settings.social_youtube,
    settings.social_twitter,
    settings.social_tiktok,
  ]);

  // ============================================
  // INITIALISATION ONESIGNAL
  // ============================================
  useEffect(() => {
    const initOneSignal = async () => {
      const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;
      const selfHostedEnabled = import.meta.env.VITE_SELFHOSTED_MODE === "true";
      if (
        !user ||
        oneSignalInitializedRef.current ||
        oneSignalBlockedRef.current ||
        !appId ||
        selfHostedEnabled ||
        import.meta.env.VITE_ENABLE_ONESIGNAL === "false" ||
        typeof window === "undefined" ||
        typeof navigator === "undefined" ||
        !isOneSignalAllowedByCsp()
      ) {
        return;
      }

      const supportsPush =
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      if (!supportsPush) {
        return;
      }

      try {
        await OneSignal.init({
          appId,
          allowLocalhostAsSecureOrigin: true,
          notifyButton: {
            enable: true,
            size: "medium",
            position: "bottom-right",
            prenotify: false,
            showCredit: false,
            text: {
              "dialog.blocked.message":
                "Activez les notifications dans votre navigateur.",
              "dialog.blocked.title": "Notifications bloquées",
              "dialog.main.button.subscribe": "S'abonner",
              "dialog.main.button.unsubscribe": "Se désabonner",
              "dialog.main.title": "Recevoir les notifications",
              "message.action.resubscribed": "Vous êtes de nouveau abonné.",
              "message.action.subscribed": "Abonnement activé.",
              "message.action.subscribing": "Abonnement en cours...",
              "message.action.unsubscribed": "Abonnement désactivé.",
              "message.prenotify": "Recevez les alertes importantes.",
              "tip.state.blocked": "Notifications bloquées",
              "tip.state.subscribed": "Abonné",
              "tip.state.unsubscribed": "Non abonné",
            },
          },
        });
        oneSignalInitializedRef.current = true;

        // Capturer le player_id quand l'utilisateur s'abonne
        OneSignal.User.PushSubscription.addEventListener("change", (change) => {
          if (change.current.optedIn && user) {
            const playerId = change.current.id;
            if (playerId) {
              // Sauvegarder playerId pour les propriétés de l'utilisateur
              // Note: Cette logique peut être adaptée selon vos besoins
              console.log("OneSignal playerId:", playerId);
            }
          }
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error ?? "");
        const isExpectedBlock =
          message.includes("script failed to load") ||
          message.includes("ERR_BLOCKED_BY_CLIENT") ||
          message.includes("blocked by client");

        if (isExpectedBlock) {
          oneSignalBlockedRef.current = true;
          setOneSignalBlocked(true);
          if (import.meta.env.DEV) {
            console.info("OneSignal bloqué par le navigateur, ignoré.");
          }
          return;
        }

        console.error("Erreur initialisation OneSignal:", error);
      }
    };

    initOneSignal();
  }, [user, isOneSignalAllowedByCsp]);

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
      const canonicalPublicPath = PUBLIC_PAGE_PATHS[publicFromPath] || "/";
      if (normalizedPath !== canonicalPublicPath) {
        syncPublicPath(publicFromPath, "replace");
      }
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

    const canonicalHost = "gnambaservices.ci";
    const hostname = window.location.hostname;
    const aliasHosts = new Set([
      "www.gnambaservices.ci",
      "portal.gnambaservices.ci",
      "erp.gnambaservices.ci",
      "www.erp.gnambaservices.ci",
      "immobilier.gnambaservices.ci",
      "foncier.gnambaservices.ci",
    ]);

    if (!aliasHosts.has(hostname) || hostname === canonicalHost) {
      return;
    }

    const target = `https://${canonicalHost}${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.replace(target);
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
      const { data, error } = await apiClient.pageLayouts.get(layoutSlug);

      if (cancelled) return;

      if (error || !data || !data.is_published) {
        setPublishedLayoutSections(null);
        setPublishedLayoutLoading(false);
        return;
      }

      const sections = Array.isArray(data.layout_json)
        ? (data.layout_json as PageSection[])
        : [];
      if (sections.length === 0) {
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
  }, [publicPage, contentVersion]);

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
    setShowForgotPassword(false);
    setPublicPage("home");

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
      "catalogue-lots": "Catalogue commercial",
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
      "codex-assistant": "Assistant Codex",
      media: "Média",
      registre: "Registre Visiteur",
      leads: "Leads & Campagnes",
    };
    return titles[page];
  };

  if (view === "dashboard" && !user) {
    return (
      <>
        {showProdBanner && (
          <div className="bg-amber-100 text-amber-800 text-xs px-3 py-2 border-b border-amber-200">
            Mode production local détecté. Pour le dev, utilisez npm run dev
            (port 5173). Build: {buildTime}
          </div>
        )}
        <style>{themeCss}</style>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
              style={{ borderColor: settings.primary_color || "#1e40af" }}
            />
            <p className="text-gray-600 text-sm font-medium">
              Ouverture de l'espace interne...
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Validation de votre session en cours.
            </p>
          </div>
        </div>
      </>
    );
  }

  if ((view === "dashboard" || publicPage === "login") && user) {
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
          <div className="fixed top-4 right-4 z-50">
            <OfflineIndicator showDetails={false} />
          </div>
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
      <NotificationToastWrapper />
    </>
  );
}

export function App() {
  return (
    <ErrorBoundary moduleName="Application EGS">
      <AuthProvider>
        <SettingsProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </SettingsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

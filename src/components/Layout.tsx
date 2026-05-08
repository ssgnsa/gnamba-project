import { ReactNode, useEffect, useRef, useState } from "react";
import Sidebar, { type Page } from "./Sidebar";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import { useMobile } from "../hooks/useMobile";
import { Bell, ChevronLeft, Menu } from "lucide-react";
import BrandLogo from "./BrandLogo";
import AICopilot from "./AICopilot";
import { isOllamaEnabled } from "../lib/ollama";
import "../lib/lead-capture"; // Auto-inject lead capture on all pages

const pageTitles: Record<Page, string> = {
  dashboard: "Tableau de Bord",
  clients: "Gestion des Clients",
  projets: "Projets BTP",
  immobilier: "Gestion Immobilière",
  foncier: "Dossiers Fonciers",
  fournitures: "Gestion des Fournitures",
  finances: "Gestion Financière",
  employes: "Ressources Humaines",
  utilisateurs: "Gestion des Utilisateurs",
  fournisseurs: "Fournisseurs",
  documents: "Documents",
  media: "Bibliothèque Média",
  taches: "Gestion des Tâches",
  statistiques: "Statistiques",
  parametres: "Paramètres",
  "site-editor": "Éditeur du Site Vitrine",
  registre: "Registre Visiteur",
  leads: "Leads & Campagnes",
};

interface LayoutProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  onGoPublic?: () => void;
  children: ReactNode;
}

export default function Layout({
  activePage,
  onNavigate,
  onGoPublic,
  children,
}: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const previousBodyOverflow = useRef("");
  const { isDesktop: isDesktopViewport } = useMobile();
  const { settings } = useSettings();
  const { profile } = useAuth();
  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const initials = profile?.full_name
    ? profile.full_name.charAt(0).toUpperCase()
    : "U";
  const logoInitials = (settings.app_title || "EG").slice(0, 2).toUpperCase();

  // Use isDesktopViewport for desktop-specific behavior
  const isDesktop = isDesktopViewport;

  const goToAccueil = () => {
    window.dispatchEvent(
      new CustomEvent("egs:navigate", { detail: "accueil" }),
    );
  };
  const handleNavigate = (page: Page) => {
    setMobileOpen(false);
    onNavigate(page);
  };
  const handleGoPublic = () => {
    setMobileOpen(false);
    onGoPublic?.();
  };
  const handleGoAccueil = () => {
    setMobileOpen(false);
    goToAccueil();
  };

  useEffect(() => {
    if (isDesktop) setMobileOpen(false);
  }, [isDesktop]);

  useEffect(() => {
    setMobileOpen(false);
  }, [activePage]);

  useEffect(() => {
    if (mobileOpen && !isDesktop) {
      previousBodyOverflow.current = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = previousBodyOverflow.current;
    }

    return () => {
      document.body.style.overflow = previousBodyOverflow.current;
    };
  }, [isDesktop, mobileOpen]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fafc_0%,_#f3f4f6_55%,_#eef2f7_100%)]">
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        collapsed={collapsed}
        isDesktop={isDesktop}
        mobileOpen={mobileOpen}
        onToggle={() => setCollapsed(!collapsed)}
        onCloseMobile={() => setMobileOpen(false)}
        onGoPublic={handleGoPublic}
        onGoAccueil={handleGoAccueil}
      />
      {mobileOpen && (
        <button
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Fermer le menu"
        />
      )}
      <div
        className={`transition-all duration-300 ml-0 ${collapsed ? "lg:ml-16" : "lg:ml-64"}`}
      >
        <header
          className="bg-white/92 backdrop-blur border-b border-slate-200/90 px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm gap-2 sm:gap-3 md:gap-4"
          style={{ paddingTop: "max(0.5rem, var(--sat))" }}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 sm:p-2.5 rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary-300)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Ouvrir le menu"
            >
              <Menu size={20} />
            </button>
            <button
              onClick={goToAccueil}
              className="flex items-center gap-1 px-1.5 sm:px-2 py-1.5 sm:py-2 rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary-300)] transition-colors min-h-[44px]"
              title="Retour à l'accueil employé"
            >
              <ChevronLeft size={16} />
              <span className="hidden sm:inline text-sm">Accueil</span>
            </button>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
              <BrandLogo
                tone="light"
                alt={settings.app_title || "Logo"}
                className="w-full h-full object-contain"
                fallback={
                  <span className="text-xs font-bold text-gray-600">
                    {logoInitials}
                  </span>
                }
              />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg font-semibold text-slate-800 truncate">
                {pageTitles[activePage]}
              </h1>
              <p className="text-xs text-slate-500 capitalize hidden sm:block">
                {today}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button className="relative p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary-300)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{
                  backgroundColor: settings.primary_color,
                  color: "var(--color-on-primary)",
                }}
              >
                {initials}
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-medium text-slate-700">
                  {profile?.full_name || "Utilisateur"}
                </div>
                <div className="text-xs text-slate-500">
                  {settings.app_company}
                </div>
              </div>
            </div>
          </div>
        </header>
        <main
          className={`${activePage === "site-editor" ? "p-0" : "p-3 sm:p-4 md:p-6"}`}
          style={{
            paddingBottom:
              activePage === "site-editor"
                ? undefined
                : "max(0.75rem, var(--sab))",
          }}
        >
          {children}
        </main>
      </div>
      {isOllamaEnabled && <AICopilot />}
    </div>
  );
}

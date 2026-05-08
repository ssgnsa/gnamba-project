import {
  LayoutDashboard,
  Users,
  HardHat,
  Building2,
  Map,
  Package,
  DollarSign,
  UserCog,
  Truck,
  FileText,
  CheckSquare,
  BarChart2,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Home,
  Globe,
  Shield,
  Images,
  Megaphone,
} from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import BrandLogo from "./BrandLogo";
import {
  useAuth,
  hasAccess,
  ACCESS_LEVEL_LABELS,
  resolveAccessLevel,
} from "../context/AuthContext";

export type Page =
  | "dashboard"
  | "clients"
  | "projets"
  | "immobilier"
  | "foncier"
  | "fournitures"
  | "finances"
  | "employes"
  | "utilisateurs"
  | "fournisseurs"
  | "documents"
  | "taches"
  | "statistiques"
  | "parametres"
  | "site-editor"
  | "media"
  | "registre"
  | "leads";

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  collapsed: boolean;
  isDesktop: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onCloseMobile: () => void;
  onGoPublic?: () => void;
  onGoAccueil?: () => void;
}

const navItems: {
  id: Page;
  label: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  adminOnly?: boolean;
}[] = [
  { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { id: "clients", label: "Clients", icon: Users },
  { id: "projets", label: "Projets BTP", icon: HardHat },
  { id: "immobilier", label: "Immobilier", icon: Building2 },
  { id: "foncier", label: "Foncier", icon: Map },
  { id: "fournitures", label: "Fournitures", icon: Package },
  { id: "finances", label: "Finances", icon: DollarSign },
  { id: "employes", label: "Employés", icon: UserCog },
  { id: "utilisateurs", label: "Utilisateurs", icon: Shield, adminOnly: true },
  { id: "fournisseurs", label: "Fournisseurs", icon: Truck },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "media", label: "Bibliothèque Média", icon: Images },
  { id: "taches", label: "Tâches", icon: CheckSquare },
  { id: "statistiques", label: "Statistiques", icon: BarChart2 },
  { id: "parametres", label: "Paramètres", icon: Settings },
  { id: "site-editor", label: "Site Vitrine", icon: Globe, adminOnly: true },
  { id: "registre", label: "Registre Visiteur", icon: Users },
  { id: "leads", label: "Leads & Campagnes", icon: Megaphone },
];

export default function Sidebar({
  activePage,
  onNavigate,
  collapsed,
  isDesktop,
  mobileOpen,
  onToggle,
  onCloseMobile,
  onGoPublic,
  onGoAccueil,
}: SidebarProps) {
  const { settings } = useSettings();
  const { signOut, profile } = useAuth();
  const role = profile?.role;
  const accessLevel = resolveAccessLevel(profile?.role, profile?.access_level);
  const logoInitials = (settings.app_title || "EG").slice(0, 2).toUpperCase();
  const effectiveCollapsed = isDesktop ? collapsed : false;

  const visibleItems = navItems.filter((item) => {
    if (item.adminOnly) return accessLevel === "admin";
    return hasAccess(role, item.id, profile?.access_level);
  });

  // Calculate sidebar width for mobile drawer
  const mobileWidth = "w-72 max-w-[85vw]";
  const desktopWidth = effectiveCollapsed ? "lg:w-16" : "lg:w-64";

  return (
    <aside
      className={`fixed left-0 top-0 h-[100dvh] flex flex-col z-40 transition-all duration-300 shadow-xl overscroll-contain border-r border-white/10 ${mobileWidth} ${desktopWidth} ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 rounded-r-2xl lg:rounded-none`}
      style={{
        background:
          "linear-gradient(165deg, var(--color-primary-900) 0%, var(--color-primary-800) 100%)",
        paddingTop: "max(0px, var(--sat))",
        paddingBottom: "max(0px, var(--sab))",
      }}
    >
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
        {!effectiveCollapsed && (
          <div className="flex items-center gap-3 min-w-0">
            <BrandLogo
              tone="dark"
              alt="logo"
              className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
              fallback={
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">
                    {logoInitials}
                  </span>
                </div>
              }
            />
            <div className="min-w-0">
              <div className="text-white font-bold text-sm truncate">
                {settings.app_title}
              </div>
              <div className="text-white/60 text-xs truncate">
                {settings.app_subtitle}
              </div>
            </div>
          </div>
        )}
        {effectiveCollapsed && (
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mx-auto overflow-hidden">
            <BrandLogo
              tone="dark"
              alt="logo"
              className="w-full h-full object-cover"
              fallback={
                <span className="text-white font-bold text-xs">
                  {logoInitials}
                </span>
              }
            />
          </div>
        )}
        {isDesktop ? (
          <button
            onClick={onToggle}
            className={`p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/60 transition-colors flex-shrink-0 ${effectiveCollapsed ? "mx-auto mt-2" : ""}`}
            aria-label={
              effectiveCollapsed ? "Déployer le menu" : "Réduire le menu"
            }
          >
            {effectiveCollapsed ? <Menu size={16} /> : <X size={16} />}
          </button>
        ) : (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/60 transition-colors flex-shrink-0"
            aria-label="Fermer le menu"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {!effectiveCollapsed && profile && (
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {profile.full_name
                  ? profile.full_name.charAt(0).toUpperCase()
                  : "?"}
              </span>
            </div>
            <div className="min-w-0">
              <div className="text-white text-xs font-semibold truncate">
                {profile.full_name || "Utilisateur"}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <Shield size={9} className="text-white/50" />
                <span className="text-white/50 text-xs">
                  {ACCESS_LEVEL_LABELS[accessLevel] || profile.role}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {onGoAccueil && (
          <button
            onClick={onGoAccueil}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 text-white/90 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 min-h-[48px]"
            title={effectiveCollapsed ? "Accueil employés" : undefined}
          >
            <Home size={20} className="flex-shrink-0" />
            {!effectiveCollapsed && (
              <span className="flex-1 text-left text-sm font-semibold truncate">
                Accueil employés
              </span>
            )}
          </button>
        )}
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 group min-h-[48px]
                ${
                  isActive
                    ? "bg-white/20 text-white shadow-sm"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                } focus-visible:ring-2 focus-visible:ring-white/60`}
              title={effectiveCollapsed ? item.label : undefined}
            >
              <Icon size={20} className="flex-shrink-0" />
              {!effectiveCollapsed && (
                <>
                  <span className="flex-1 text-left text-sm font-medium truncate">
                    {item.label}
                  </span>
                  {isActive && (
                    <ChevronRight size={14} className="flex-shrink-0" />
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-2 pb-4 border-t border-white/10 pt-3 space-y-1">
        {onGoPublic && (
          <button
            onClick={onGoPublic}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-white/70 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 transition-colors min-h-[48px]"
            title={effectiveCollapsed ? "Site public" : undefined}
          >
            <Globe size={20} className="flex-shrink-0" />
            {!effectiveCollapsed && (
              <span className="text-sm font-medium">Voir le site</span>
            )}
          </button>
        )}
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-white/70 hover:bg-red-500/20 hover:text-white focus-visible:ring-2 focus-visible:ring-red-300 transition-colors min-h-[48px]"
          title={effectiveCollapsed ? "Déconnexion" : undefined}
        >
          <LogOut size={20} className="flex-shrink-0" />
          {!effectiveCollapsed && (
            <span className="text-sm font-medium">Déconnexion</span>
          )}
        </button>
      </div>
    </aside>
  );
}

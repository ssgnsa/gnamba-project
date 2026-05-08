"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  LineChart,
  Beef,
  Sprout,
  Stethoscope,
  Wheat,
  Tractor,
  ClipboardList,
  Building2,
  Wrench,
  HardHat,
  Package,
  ArrowLeftRight,
  ShoppingCart,
  DollarSign,
  CheckSquare,
  Globe,
  Settings,
  X,
  type LucideIcon,
} from "lucide-react";

const moduleIcons: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  analytics: LineChart,
  livestock: Beef,
  crops: Sprout,
  health: Stethoscope,
  fields: Wheat,
  interventions: Tractor,
  harvests: ClipboardList,
  constructions: Building2,
  buildings: Building2,
  maintenance: Wrench,
  projects: HardHat,
  inventory: Package,
  "inventory-movements": ArrowLeftRight,
  sales: ShoppingCart,
  finance: DollarSign,
  tasks: CheckSquare,
  vitrine: Globe,
  settings: Settings,
};

const navItems: { label: string; href: string }[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Analytics IA", href: "/analytics" },
  { label: "Lots", href: "/livestock/lots" },
  { label: "Animaux", href: "/livestock/animals" },
  { label: "Santé", href: "/livestock/health" },
  { label: "Parcelles", href: "/crops/fields" },
  { label: "Interventions", href: "/crops/interventions" },
  { label: "Récoltes", href: "/crops/harvests" },
  { label: "Bâtiments", href: "/constructions/buildings" },
  { label: "Maintenance", href: "/constructions/maintenance" },
  { label: "Projets", href: "/constructions/projects" },
  { label: "Inventaire", href: "/inventory" },
  { label: "Mouvements", href: "/inventory/movements" },
  { label: "Ventes", href: "/sales" },
  { label: "Finance", href: "/finance" },
  { label: "Tâches", href: "/tasks" },
  { label: "Vitrine", href: "/vitrine" },
  { label: "Paramètres", href: "/settings" },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
  logoUrl?: string | null;
}

export default function Sidebar({
  mobileOpen = false,
  onClose,
  logoUrl,
}: SidebarProps) {
  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 w-72 flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-300 md:relative md:shadow-none
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
        ${mobileOpen ? "flex" : "hidden md:flex"}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 p-4 md:hidden">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
          Navigation
        </p>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Fermer le menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Logo Section */}
      <div className="mb-4 md:mb-6 px-4 pt-4 md:pt-0">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-950 via-emerald-800 to-lime-600 p-4 text-white shadow-lg">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="h-12 w-12 rounded-2xl bg-white/10 object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-xs font-semibold uppercase tracking-[0.2em]">
                SA
              </div>
            )}
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">
                SomAgro ERP
              </p>
              <h2 className="mt-1 text-xl font-semibold font-display">
                Premium Ops
              </h2>
            </div>
          </div>
          <p className="mt-3 text-xs text-white/80">Pilotage multi-metiers</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
        {navItems.map((item) => {
          const Icon = moduleIcons[item.href.split("/")[1]] || LayoutDashboard;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700 min-h-[48px]"
            >
              <Icon size={20} className="flex-shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

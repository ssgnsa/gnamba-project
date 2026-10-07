import type { LucideIcon } from "lucide-react";
import type { UserRole } from "../types";

export type { UserRole };

// Dashboard Types - Extracted for reusability
export interface MonthlyAgg {
  month: string;
  recettes: number;
  depenses: number;
}

export interface CategoryAgg {
  label: string;
  value: number;
  color: string;
}

export interface RecentTx {
  id: string;
  type_transaction: "recette" | "depense";
  description: string;
  categorie: string;
  montant: number;
  date_transaction: string;
}

export interface AlertItem {
  id: string;
  type: "warning" | "danger" | "info" | "success";
  message: string;
  sub?: string;
}

export interface ServiceLink {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: LucideIcon;
  color: string;
  category: "application" | "database" | "api" | "tool";
  status: "online" | "offline";
}

export interface DashboardData {
  currentRecettes: number;
  prevRecettes: number;
  currentDepenses: number;
  prevDepenses: number;
  beneficeNet: number;
  totalClients: number;
  projetsActifs: number;
  biensImmobiliers: number;
  loyersEnAttente: number;
  tachesUrgentes: number;
  monthly: MonthlyAgg[];
  recettesByCategory: CategoryAgg[];
  depensesByCategory: CategoryAgg[];
  recentTransactions: RecentTx[];
  alerts: AlertItem[];
}

export type KPIColor = "teal" | "blue" | "emerald" | "amber" | "red" | "slate";

// Formatting utilities - DRY
export function formatCompact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "k";
  return n.toFixed(0);
}

export function formatCFA(n: number): string {
  return `${formatCompact(n)} FCFA`;
}

export function formatPercent(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

// Chart color constants
export const CHART_COLORS = {
  recettes: {
    primary: "#14b8a6",
    bars: ["#14b8a6", "#0ea5e9", "#22c55e", "#a3e635", "#f59e0b", "#e879f9"],
    areaStart: "rgba(20, 184, 166, 0.18)",
    areaEnd: "rgba(20, 184, 166, 0)",
  },
  depenses: {
    primary: "#f87171",
    bars: ["#f87171", "#fb923c", "#fbbf24", "#a78bfa", "#60a5fa", "#34d399"],
  },
  categories: {
    recettes: ["#14b8a6", "#0ea5e9", "#22c55e", "#a3e635", "#f59e0b", "#e879f9"],
    depenses: ["#f87171", "#fb923c", "#fbbf24", "#a78bfa", "#60a5fa", "#34d399"],
  },
} as const;

// Config constants
export const DASHBOARD_CONFIG = {
  refreshInterval: 5 * 60 * 1000, // 5 minutes
  serviceCheckInterval: 60 * 1000, // 1 minute
  chartMonths: 6,
  maxRecentTransactions: 8,
  maxCategories: 5,
  dateFormat: { month: "short" } as const,
} as const;

// Alert type styling - using string class names instead of dynamic imports
export const ALERT_STYLES: Record<AlertItem["type"], {
  bg: string;
  border: string;
  icon: string;
}> = {
  danger: {
    bg: "bg-red-50",
    border: "border-red-200",
    icon: "text-red-500",
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: "text-amber-500",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "text-blue-500",
  },
  success: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: "text-emerald-500",
  },
};

// KPI Card color map
export const KPI_COLORS: Record<KPIColor, { icon: string; accent: string }> = {
  teal: { icon: "bg-teal-100 text-teal-700", accent: "bg-teal-500" },
  blue: { icon: "bg-sky-100 text-sky-700", accent: "bg-sky-500" },
  emerald: { icon: "bg-emerald-100 text-emerald-700", accent: "bg-emerald-500" },
  amber: { icon: "bg-amber-100 text-amber-700", accent: "bg-amber-500" },
  red: { icon: "bg-rose-100 text-rose-700", accent: "bg-rose-500" },
  slate: { icon: "bg-slate-100 text-slate-700", accent: "bg-slate-500" },
};

// Service link color classes
export const SERVICE_COLOR_CLASSES: Record<string, string> = {
  blue: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
  emerald: "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100",
  slate: "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100",
  purple: "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100",
  amber: "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100",
};
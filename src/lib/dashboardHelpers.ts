/**
 * DATA LAYER — Dashboard Helpers
 * Normalizes and computes dashboard aggregate data from raw transaction data
 */

import type { MonthlyAgg, CategoryAgg, AlertItem, DashboardData } from "../pages/Dashboard";

interface RawTransaction {
  type_transaction: "recette" | "depense";
  categorie: string;
  montant: number | string;
  date_transaction: string;
}

const CAT_COLORS_REC = [
  "#14b8a6",
  "#0ea5e9",
  "#22c55e",
  "#a3e635",
  "#f59e0b",
  "#e879f9",
];
const CAT_COLORS_DEP = [
  "#f87171",
  "#fb923c",
  "#fbbf24",
  "#a78bfa",
  "#60a5fa",
  "#34d399",
];

export function computeMonthlyAggregates(
  transactions: RawTransaction[],
  months: number = 6,
): MonthlyAgg[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const monthly: MonthlyAgg[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(y, m - i, 1);
    const label = d.toLocaleDateString("fr-FR", { month: "short" });
    const mm = d.toISOString().slice(0, 7);
    const txM = transactions.filter((t) => t.date_transaction.startsWith(mm));

    monthly.push({
      month: label,
      recettes: txM
        .filter((t) => t.type_transaction === "recette")
        .reduce((s, t) => s + Number(t.montant), 0),
      depenses: txM
        .filter((t) => t.type_transaction === "depense")
        .reduce((s, t) => s + Number(t.montant), 0),
    });
  }

  return monthly;
}

export function computeCategoryAggregates(
  transactions: RawTransaction[],
): { recettes: CategoryAgg[]; depenses: CategoryAgg[] } {
  const recCatMap: Record<string, number> = {};
  const depCatMap: Record<string, number> = {};

  transactions.forEach((t) => {
    const amount = Number(t.montant) || 0;
    if (t.type_transaction === "recette") {
      recCatMap[t.categorie] = (recCatMap[t.categorie] || 0) + amount;
    } else {
      depCatMap[t.categorie] = (depCatMap[t.categorie] || 0) + amount;
    }
  });

  const recettesByCategory: CategoryAgg[] = Object.entries(recCatMap)
    .sort((a, b) => b[1] - a[1])
    .map((e, i) => ({
      label: e[0],
      value: e[1],
      color: CAT_COLORS_REC[i % CAT_COLORS_REC.length],
    }));

  const depensesByCategory: CategoryAgg[] = Object.entries(depCatMap)
    .sort((a, b) => b[1] - a[1])
    .map((e, i) => ({
      label: e[0],
      value: e[1],
      color: CAT_COLORS_DEP[i % CAT_COLORS_DEP.length],
    }));

  return { recettes: recettesByCategory, depenses: depensesByCategory };
}

export function computePeriodStats(
  transactions: RawTransaction[],
  startDate: string,
  endDate?: string,
): { recettes: number; depenses: number } {
  const filtered = transactions.filter((t) => {
    if (t.date_transaction < startDate) return false;
    if (endDate && t.date_transaction > endDate) return false;
    return true;
  });

  return {
    recettes: filtered
      .filter((t) => t.type_transaction === "recette")
      .reduce((s, t) => s + Number(t.montant), 0),
    depenses: filtered
      .filter((t) => t.type_transaction === "depense")
      .reduce((s, t) => s + Number(t.montant), 0),
  };
}

export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export function normalizeDashboardData(
  rawTx: RawTransaction[],
  totalClients: number,
  projetsActifs: number,
  biensImmobiliers: number,
  loyersEnAttente: number,
  tachesUrgentes: number,
  recentTransactions: any[],
): Omit<
  DashboardData,
  | "currentRecettes"
  | "prevRecettes"
  | "currentDepenses"
  | "prevDepenses"
  | "beneficeNet"
> & {
  currentRecettes: number;
  prevRecettes: number;
  currentDepenses: number;
  prevDepenses: number;
  beneficeNet: number;
} {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const firstCurr = new Date(y, m, 1).toISOString().split("T")[0];
  const firstPrev = new Date(y, m - 1, 1).toISOString().split("T")[0];
  const lastPrev = new Date(y, m, 0).toISOString().split("T")[0];
  const sixMonths = new Date(y, m - 5, 1).toISOString().split("T")[0];

  // Filter transactions to last 6 months
  const allTx = rawTx.filter((t) => t.date_transaction >= sixMonths);

  // Current month stats
  const currStats = computePeriodStats(allTx, firstCurr);

  // Previous month stats
  const prevStats = computePeriodStats(allTx, firstPrev, lastPrev);

  // Monthly aggregates
  const monthly = computeMonthlyAggregates(allTx);

  // Category aggregates
  const { recettes: recettesByCategory, depenses: depensesByCategory } =
    computeCategoryAggregates(allTx);

  // Calculate alerts
  const alerts: AlertItem[] = [];
  if (loyersEnAttente > 0) {
    alerts.push({
      id: "rents",
      type: "warning",
      message: `${loyersEnAttente.toLocaleString("fr-FR")} FCFA de loyers en attente`,
      sub: "Relancer les locataires concernés",
    });
  }
  if (tachesUrgentes > 0) {
    alerts.push({
      id: "tasks",
      type: "danger",
      message: `${tachesUrgentes} tâche(s) urgente(s) non terminée(s)`,
      sub: "Vérifier le tableau des tâches",
    });
  }
  if (alerts.length === 0) {
    alerts.push({
      id: "health",
      type: "success",
      message: "Tout est en ordre",
      sub: "Aucune alerte active",
    });
  }

  return {
    currentRecettes: currStats.recettes,
    prevRecettes: prevStats.recettes,
    currentDepenses: currStats.depenses,
    prevDepenses: prevStats.depenses,
    beneficeNet: currStats.recettes - currStats.depenses,
    totalClients,
    projetsActifs,
    biensImmobiliers,
    loyersEnAttente,
    tachesUrgentes,
    monthly,
    recettesByCategory,
    depensesByCategory,
    recentTransactions: recentTransactions as any[],
    alerts,
  };
}

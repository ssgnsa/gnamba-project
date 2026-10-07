import { useCallback, useEffect, useRef, useState } from "react";
import { clientsRepository } from '../lib/dbClient.service';
import { apiClient } from '../api/client';
import { resolveAccessLevel, useAuth } from "../context/AuthContext";
import type {
  DashboardData,
  MonthlyAgg,
  CategoryAgg,
  AlertItem,
  UserRole,
} from "../types/dashboard";
import {
  formatCFA,
  CHART_COLORS,
  DASHBOARD_CONFIG as CONFIG,
} from "../types/dashboard";

interface UseDashboardDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseDashboardDataReturn {
  data: DashboardData | null;
  loading: boolean;
  error: Error | null;
  lastRefresh: Date | null;
  refetch: () => Promise<void>;
}

// Helper to check if user can view finances
function canViewFinances(profile: { role?: UserRole; access_level?: string } | null | undefined): boolean {
  if (!profile?.role) return false;
  const accessLevel = resolveAccessLevel(profile.role, profile.access_level);
  return (
    profile.role === "admin" ||
    profile.role === "gestionnaire" ||
    accessLevel === "admin" ||
    accessLevel === "gerant" ||
    accessLevel === "gestionnaire"
  );
}

// Generate alerts from data
function generateAlerts(
  data: Pick<DashboardData, "loyersEnAttente" | "tachesUrgentes" | "currentRecettes" | "currentDepenses" | "beneficeNet">,
  canViewFin: boolean
): AlertItem[] {
  const alerts: AlertItem[] = [];

  if (data.loyersEnAttente > 0) {
    alerts.push({
      id: "rent-pending",
      type: "warning",
      message: `${formatCFA(data.loyersEnAttente)} de loyers en attente`,
      sub: "Relancer les locataires concernés",
    });
  }

  if (data.tachesUrgentes > 0) {
    alerts.push({
      id: "urgent-tasks",
      type: "danger",
      message: `${data.tachesUrgentes} tâche(s) urgente(s) non terminée(s)`,
      sub: "Vérifier le tableau des tâches",
    });
  }

  if (canViewFin && data.currentDepenses > data.currentRecettes && data.currentRecettes > 0) {
    alerts.push({
      id: "deficit",
      type: "info",
      message: "Dépenses supérieures aux recettes ce mois",
      sub: `Déficit de ${formatCFA(data.currentDepenses - data.currentRecettes)}`,
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: "all-clear",
      type: "success",
      message: canViewFin ? "Tout est en ordre" : "Aucune alerte active",
      sub: canViewFin ? "Aucune alerte financière active" : "Tout est en ordre",
    });
  }

  return alerts;
}

// Type for financial transaction
interface FinanceTx {
  type_transaction: string;
  categorie: string;
  montant: number | string;
  date_transaction: string;
}
interface PrevFinanceTx {
  type_transaction: string;
  montant: number | string;
}
interface RecentFinanceTx {
  id: string;
  type_transaction: "recette" | "depense";
  description: string;
  categorie: string;
  montant: number | string;
  date_transaction: string;
}

// Process financial transactions into dashboard data
function processFinancialData(
  allTx: FinanceTx[],
  prevTx: PrevFinanceTx[],
  currentMonthStart: string
): Pick<DashboardData, "currentRecettes" | "prevRecettes" | "currentDepenses" | "prevDepenses" | "beneficeNet" | "monthly" | "recettesByCategory" | "depensesByCategory"> {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  const currTx = allTx.filter((t) => t.date_transaction >= currentMonthStart);
  const currentRecettes = currTx
    .filter((t) => t.type_transaction === "recette")
    .reduce((s, t) => s + Number(t.montant), 0);
  const currentDepenses = currTx
    .filter((t) => t.type_transaction === "depense")
    .reduce((s, t) => s + Number(t.montant), 0);

  const prevRecettes = prevTx
    .filter((t) => t.type_transaction === "recette")
    .reduce((s, t) => s + Number(t.montant), 0);
  const prevDepenses = prevTx
    .filter((t) => t.type_transaction === "depense")
    .reduce((s, t) => s + Number(t.montant), 0);

  // Monthly aggregation
  const monthly: MonthlyAgg[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(y, m - i, 1);
    const label = d.toLocaleDateString("fr-FR", CONFIG.dateFormat);
    const mm = d.toISOString().slice(0, 7);
    const txM = allTx.filter((t) => t.date_transaction.startsWith(mm));
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

  // Categories
  const recCatMap: Record<string, number> = {};
  const depCatMap: Record<string, number> = {};
  allTx.forEach((t) => {
    if (t.type_transaction === "recette") recCatMap[t.categorie] = (recCatMap[t.categorie] || 0) + Number(t.montant);
    else depCatMap[t.categorie] = (depCatMap[t.categorie] || 0) + Number(t.montant);
  });

  const recettesByCategory: CategoryAgg[] = Object.entries(recCatMap)
    .sort((a, b) => b[1] - a[1])
    .map((e, i) => ({
      label: e[0],
      value: e[1],
      color: CHART_COLORS.categories.recettes[i % CHART_COLORS.categories.recettes.length],
    }));

  const depensesByCategory: CategoryAgg[] = Object.entries(depCatMap)
    .sort((a, b) => b[1] - a[1])
    .map((e, i) => ({
      label: e[0],
      value: e[1],
      color: CHART_COLORS.categories.depenses[i % CHART_COLORS.categories.depenses.length],
    }));

  return {
    currentRecettes,
    prevRecettes,
    currentDepenses,
    prevDepenses,
    beneficeNet: currentRecettes - currentDepenses,
    monthly,
    recettesByCategory,
    depensesByCategory,
  };
}

export function useDashboardData({ autoRefresh = false, refreshInterval = CONFIG.refreshInterval }: UseDashboardDataOptions = {}): UseDashboardDataReturn {
  const { profile } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const refreshTimeoutRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canViewFinRef = useRef(canViewFinances(profile));
  const isMountedRef = useRef(true);

  // Update canViewFinRef when profile changes
  useEffect(() => {
    canViewFinRef.current = canViewFinances(profile);
  }, [profile]);

  const fetchData = useCallback(async () => {
    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Don't show loading spinner if we already have data (background refresh)
    if (!data) setLoading(true);
    setError(null);

    try {
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth();
      const firstCurr = new Date(y, m, 1).toISOString().split("T")[0];
      const firstPrev = new Date(y, m - 1, 1).toISOString().split("T")[0];
      const lastPrev = new Date(y, m, 0).toISOString().split("T")[0];
      const sixMonths = new Date(y, m - 5, 1).toISOString().split("T")[0];

      const canViewFin = canViewFinRef.current;

      // Build query parameters for filtered queries
      const financeParams = new URLSearchParams();
      financeParams.append('date_transaction_gte', sixMonths);
      financeParams.append('order_by', 'date_transaction');
      financeParams.append('ascending', 'false');

      const prevFinanceParams = new URLSearchParams();
      prevFinanceParams.append('date_transaction_gte', firstPrev);
      prevFinanceParams.append('date_transaction_lte', lastPrev);

      const recentFinanceParams = new URLSearchParams();
      recentFinanceParams.append('order_by', 'date_transaction');
      recentFinanceParams.append('ascending', 'false');
      recentFinanceParams.append('limit', String(CONFIG.maxRecentTransactions));

      const rentParams = new URLSearchParams();
      rentParams.append('statut_in', 'en_attente,retard,partiel');

      const projectParams = new URLSearchParams();
      projectParams.append('statut_eq', 'en_cours');
      projectParams.append('select', 'id');
      projectParams.append('count', 'exact');

      const propertyParams = new URLSearchParams();
      propertyParams.append('select', 'id');
      propertyParams.append('count', 'exact');

      const taskParams = new URLSearchParams();
      taskParams.append('priorite_eq', 'urgente');
      taskParams.append('statut_neq', 'terminee');
      taskParams.append('select', 'id');
      taskParams.append('count', 'exact');

      // Parallel queries with proper error handling using apiClient.request
      const [
        clientRes,
        projets,
        biens,
        loyers,
        taches,
        fAll,
        fPrev,
        recentTx,
      ] = await Promise.all([
        clientsRepository.getAll(),
        apiClient.request<any>(`/projects?${projectParams.toString()}`),
        apiClient.request<any>(`/immobilier/properties?${propertyParams.toString()}`),
        apiClient.request<any>(`/finance?${rentParams.toString()}`),
        apiClient.request<any>(`/tasks?${taskParams.toString()}`),
        canViewFin ? apiClient.request<any>(`/finance?${financeParams.toString()}`) : Promise.resolve({ data: [], error: null, count: 0 }),
        canViewFin ? apiClient.request<any>(`/finance?${prevFinanceParams.toString()}`) : Promise.resolve({ data: [], error: null, count: 0 }),
        canViewFin ? apiClient.request<any>(`/finance?${recentFinanceParams.toString()}`) : Promise.resolve({ data: [], error: null, count: 0 }),
      ]);

      // Check for abort
      if (signal.aborted) return;

      // Extract data with proper error handling
      const totalClients = clientRes.data?.length ?? 0;
      const projetsActifs = projets.count ?? 0;
      const biensImmobiliers = biens.count ?? 0;
      const loyersEnAttente = (loyers.data || []).reduce(
        (s: number, l: { montant?: number | string | null }) => s + Number(l.montant),
        0
      );
      const tachesUrgentes = taches.count ?? 0;

      let financialData: ReturnType<typeof processFinancialData> = {
        currentRecettes: 0,
        prevRecettes: 0,
        currentDepenses: 0,
        prevDepenses: 0,
        beneficeNet: 0,
        monthly: [],
        recettesByCategory: [],
        depensesByCategory: [],
      };

      if (canViewFin && fAll && fPrev) {
        financialData = processFinancialData(
          (fAll.data || []) as FinanceTx[],
          (fPrev.data || []) as PrevFinanceTx[],
          firstCurr
        );
      }

      const recentTransactions = canViewFin
        ? ((recentTx.data || []) as RecentFinanceTx[]).map(tx => ({
            ...tx,
            type_transaction: tx.type_transaction as "recette" | "depense",
            montant: Number(tx.montant),
          }))
        : [];

      const alerts = generateAlerts(
        { loyersEnAttente, tachesUrgentes, ...financialData },
        canViewFin
      );

      const newData: DashboardData = {
        ...financialData,
        totalClients,
        projetsActifs,
        biensImmobiliers,
        loyersEnAttente,
        tachesUrgentes,
        recentTransactions,
        alerts,
      };

      if (!signal.aborted && isMountedRef.current) {
        setData(newData);
        setLastRefresh(new Date());
      }
    } catch (err) {
      if (!signal.aborted && isMountedRef.current) {
        // Ignore abort errors
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err);
          console.error("[Dashboard] Fetch error:", err);
        }
      }
    } finally {
      if (!signal.aborted && isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [data]);

  // Initial fetch and auto-refresh
  useEffect(() => {
    isMountedRef.current = true;
    fetchData();

    if (autoRefresh) {
      refreshTimeoutRef.current = setInterval(fetchData, refreshInterval);
    }

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (refreshTimeoutRef.current) clearInterval(refreshTimeoutRef.current);
    };
  }, [fetchData, autoRefresh, refreshInterval]);

  return { data, loading, error, lastRefresh, refetch: fetchData };
}

// Eager getter for quick access to current canViewFinances
export function getCanViewFinances(profile: { role?: UserRole; access_level?: string } | null | undefined): boolean {
  return canViewFinances(profile);
}
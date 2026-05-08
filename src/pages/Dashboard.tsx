import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Briefcase,
  Building2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  RefreshCw,
  Lock,
  Sparkles,
  Loader2,
  Globe,
  Database,
  ExternalLink,
  Server,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { isOllamaEnabled, ollama } from "../lib/ollama";
import KPICard from "../components/dashboard/KPICard";
import RevenueChart from "../components/dashboard/RevenueChart";
import CategoryDonutChart from "../components/dashboard/CategoryDonutChart";
import AlertsWidget from "../components/dashboard/AlertsWidget";

interface MonthlyAgg {
  month: string;
  recettes: number;
  depenses: number;
}
interface CategoryAgg {
  label: string;
  value: number;
  color: string;
}
interface RecentTx {
  id: string;
  type_transaction: "recette" | "depense";
  description: string;
  categorie: string;
  montant: number;
  date_transaction: string;
}
interface AlertItem {
  id: string;
  type: "warning" | "danger" | "info" | "success";
  message: string;
  sub?: string;
}

interface ServiceLink {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: any;
  color: string;
  category: "application" | "database" | "api" | "tool";
  status: "online" | "offline";
}

interface DashboardData {
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

function fShort(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "k";
  return n.toFixed(0);
}

function fCFA(n: number): string {
  return fShort(n) + " FCFA";
}

function pct(curr: number, prev: number): number {
  if (prev === 0) return 0;
  return ((curr - prev) / prev) * 100;
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

const SERVICES_LINKS: ServiceLink[] = [
  {
    id: "egs-frontend",
    name: "EGS Frontend",
    description: "Interface principale EGS - Enterprise Gnamba System",
    url: "http://localhost:8080",
    icon: Globe,
    color: "blue",
    category: "application",
    status: "online",
  },
  {
    id: "somagro-frontend",
    name: "SomAgro Frontend",
    description: "Application SomAgro - Gestion agricole",
    url: "http://localhost:8082",
    icon: Globe,
    color: "emerald",
    category: "application",
    status: "online",
  },
  {
    id: "somagro-supabase-studio",
    name: "SomAgro Supabase Studio",
    description: "Interface d'administration base de données SomAgro",
    url: "http://127.0.0.1:55323",
    icon: Database,
    color: "slate",
    category: "database",
    status: "online",
  },
  {
    id: "somagro-supabase-api",
    name: "SomAgro Supabase API",
    description: "API REST Supabase pour SomAgro",
    url: "http://127.0.0.1:55321",
    icon: Server,
    color: "purple",
    category: "api",
    status: "online",
  },
];

export default function Dashboard() {
  const { profile } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceLink[]>(SERVICES_LINKS);

  // Vérifier les droits d'accès aux finances
  const canViewFinances =
    profile?.role === "admin" ||
    profile?.role === "gestionnaire" ||
    profile?.access_level === "admin" ||
    profile?.access_level === "gerant";

  const checkServicesStatus = useCallback(async () => {
    const updatedServices = await Promise.all(
      SERVICES_LINKS.map(async (service) => {
        try {
          // For web services, try to fetch with a timeout
          if (service.url.startsWith("http")) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

            await fetch(service.url, {
              method: "HEAD",
              signal: controller.signal,
              mode: "no-cors", // Allow cross-origin
            });
            clearTimeout(timeoutId);
            return { ...service, status: "online" as const };
          } else {
            // For non-HTTP services, assume online if defined
            return { ...service, status: "online" as const };
          }
        } catch (error) {
          return { ...service, status: "offline" as const };
        }
      }),
    );
    setServices(updatedServices);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth();
      const firstCurr = new Date(y, m, 1).toISOString().split("T")[0];
      const firstPrev = new Date(y, m - 1, 1).toISOString().split("T")[0];
      const lastPrev = new Date(y, m, 0).toISOString().split("T")[0];
      const sixMonths = new Date(y, m - 5, 1).toISOString().split("T")[0];

      // Si l'utilisateur ne peut pas voir les finances, on ne charge que les données non sensibles
      if (!canViewFinances) {
        const [clients, projets, biens, loyers, taches] = await Promise.all([
          supabase.from("clients").select("id", { count: "exact", head: true }),
          supabase
            .from("projects")
            .select("id", { count: "exact", head: true })
            .eq("statut", "en_cours"),
          supabase
            .from("properties")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("rent_payments")
            .select("montant")
            .in("statut", ["en_attente", "retard", "partiel"]),
          supabase
            .from("tasks")
            .select("id", { count: "exact", head: true })
            .eq("priorite", "urgente")
            .neq("statut", "termine"),
        ]);

        const loyersEnAttente = (loyers.data || []).reduce(
          (s, l) => s + Number(l.montant),
          0,
        );

        const alerts: AlertItem[] = [];
        if (loyersEnAttente > 0)
          alerts.push({
            id: "1",
            type: "warning",
            message: `${loyersEnAttente.toLocaleString("fr-FR")} FCFA de loyers en attente`,
            sub: "Relancer les locataires concernés",
          });
        if ((taches.count ?? 0) > 0)
          alerts.push({
            id: "2",
            type: "danger",
            message: `${taches.count} tâche(s) urgente(s) non terminée(s)`,
            sub: "Vérifier le tableau des tâches",
          });
        if (alerts.length === 0)
          alerts.push({
            id: "4",
            type: "success",
            message: "Tout est en ordre",
            sub: "Aucune alerte active",
          });

        setData({
          currentRecettes: 0,
          prevRecettes: 0,
          currentDepenses: 0,
          prevDepenses: 0,
          beneficeNet: 0,
          totalClients: clients.count ?? 0,
          projetsActifs: projets.count ?? 0,
          biensImmobiliers: biens.count ?? 0,
          loyersEnAttente,
          tachesUrgentes: taches.count ?? 0,
          monthly: [],
          recettesByCategory: [],
          depensesByCategory: [],
          recentTransactions: [],
          alerts,
        });
        setLastRefresh(new Date());
        setLoading(false);
        return;
      }

      // Chargement complet pour admin/gerant/gestionnaire
      const [fAll, fPrev, clients, projets, biens, loyers, taches, recentTx] =
        await Promise.all([
          supabase
            .from("finances")
            .select("type_transaction,categorie,montant,date_transaction")
            .gte("date_transaction", sixMonths),
          supabase
            .from("finances")
            .select("type_transaction,montant")
            .gte("date_transaction", firstPrev)
            .lte("date_transaction", lastPrev),
          supabase.from("clients").select("id", { count: "exact", head: true }),
          supabase
            .from("projects")
            .select("id", { count: "exact", head: true })
            .eq("statut", "en_cours"),
          supabase
            .from("properties")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("rent_payments")
            .select("montant")
            .in("statut", ["en_attente", "retard", "partiel"]),
          supabase
            .from("tasks")
            .select("id", { count: "exact", head: true })
            .eq("priorite", "urgente")
            .neq("statut", "termine"),
          supabase
            .from("finances")
            .select(
              "id,type_transaction,description,categorie,montant,date_transaction",
            )
            .order("date_transaction", { ascending: false })
            .limit(8),
        ]);

      const allTx = (fAll.data || []) as {
        type_transaction: string;
        categorie: string;
        montant: number;
        date_transaction: string;
      }[];
      const currTx = allTx.filter((t) => t.date_transaction >= firstCurr);
      const currentRecettes = currTx
        .filter((t) => t.type_transaction === "recette")
        .reduce((s, t) => s + Number(t.montant), 0);
      const currentDepenses = currTx
        .filter((t) => t.type_transaction === "depense")
        .reduce((s, t) => s + Number(t.montant), 0);
      const prevTx = (fPrev.data || []) as {
        type_transaction: string;
        montant: number;
      }[];
      const prevRecettes = prevTx
        .filter((t) => t.type_transaction === "recette")
        .reduce((s, t) => s + Number(t.montant), 0);
      const prevDepenses = prevTx
        .filter((t) => t.type_transaction === "depense")
        .reduce((s, t) => s + Number(t.montant), 0);

      const monthly: MonthlyAgg[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(y, m - i, 1);
        const label = d.toLocaleDateString("fr-FR", { month: "short" });
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

      const recCatMap: Record<string, number> = {};
      const depCatMap: Record<string, number> = {};
      allTx.forEach((t) => {
        if (t.type_transaction === "recette")
          recCatMap[t.categorie] =
            (recCatMap[t.categorie] || 0) + Number(t.montant);
        else
          depCatMap[t.categorie] =
            (depCatMap[t.categorie] || 0) + Number(t.montant);
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

      const loyersEnAttente = (loyers.data || []).reduce(
        (s, l) => s + Number(l.montant),
        0,
      );

      const alerts: AlertItem[] = [];
      if (loyersEnAttente > 0)
        alerts.push({
          id: "1",
          type: "warning",
          message: `${fCFA(loyersEnAttente)} de loyers en attente`,
          sub: "Relancer les locataires concernés",
        });
      if ((taches.count ?? 0) > 0)
        alerts.push({
          id: "2",
          type: "danger",
          message: `${taches.count} tâche(s) urgente(s) non terminée(s)`,
          sub: "Vérifier le tableau des tâches",
        });
      if (currentDepenses > currentRecettes && currentRecettes > 0)
        alerts.push({
          id: "3",
          type: "info",
          message: "Dépenses supérieures aux recettes ce mois",
          sub: `Déficit de ${fCFA(currentDepenses - currentRecettes)}`,
        });
      if (alerts.length === 0)
        alerts.push({
          id: "4",
          type: "success",
          message: "Tout est en ordre",
          sub: "Aucune alerte financière active",
        });

      setData({
        currentRecettes,
        prevRecettes,
        currentDepenses,
        prevDepenses,
        beneficeNet: currentRecettes - currentDepenses,
        totalClients: clients.count ?? 0,
        projetsActifs: projets.count ?? 0,
        biensImmobiliers: biens.count ?? 0,
        loyersEnAttente,
        tachesUrgentes: taches.count ?? 0,
        monthly,
        recettesByCategory,
        depensesByCategory,
        recentTransactions: (recentTx.data || []) as RecentTx[],
        alerts,
      });
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
    // Also refresh services status
    checkServicesStatus();
  }, [canViewFinances, checkServicesStatus]);

  useEffect(() => {
    fetchData().catch(() => setLoading(false));
    checkServicesStatus();
  }, [fetchData, checkServicesStatus]);

  // Generate AI financial summary
  const generateAISummary = useCallback(async () => {
    if (!data || !canViewFinances) return;

    setAiLoading(true);
    setAiError(null);

    try {
      const prompt = ollama.createFinancialSummaryPrompt({
        revenues: data.monthly.map((m) => ({
          month: m.month,
          amount: m.recettes,
        })),
        expenses: data.monthly.map((m) => ({
          month: m.month,
          amount: m.depenses,
        })),
        projects: [
          {
            name: "Clients",
            status: `${data.totalClients} total`,
            budget: data.totalClients,
          },
          { name: "Projets", status: `${data.projetsActifs} actifs` },
          {
            name: "Biens immobiliers",
            status: `${data.biensImmobiliers} biens`,
          },
        ],
      });

      const summary = await ollama.chat(
        [{ role: "user", content: prompt }],
        undefined,
        { temperature: 0.7, maxTokens: 800 },
      );

      setAiSummary(summary);
    } catch (err) {
      setAiError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la génération du résumé",
      );
    } finally {
      setAiLoading(false);
    }
  }, [data, canViewFinances]);

  const monthLabel = new Date().toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 truncate">
            Intelligence Financière
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 capitalize hidden sm:block">
            Tableau de bord analytique — {monthLabel}
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs sm:text-sm font-medium transition-colors min-h-[44px]"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          <span className="hidden sm:inline">Actualiser</span>
        </button>
      </div>

      {/* Message d'accès restreint pour les utilisateurs sans droits finances */}
      {!canViewFinances && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <Lock className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm font-medium text-amber-800">
              Accès restreint aux informations financières
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Seuls les administrateurs, gérants et gestionnaires peuvent
              consulter les données financières détaillées.
            </p>
          </div>
        </div>
      )}

      {loading && !data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-slate-100 animate-pulse"
            />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Cartes financières - Uniquement pour admin/gerant/gestionnaire */}
          {canViewFinances && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard
                label="Recettes du mois"
                value={fShort(data.currentRecettes) + " FCFA"}
                icon={TrendingUp}
                color="teal"
                trend={pct(data.currentRecettes, data.prevRecettes)}
                trendLabel="vs mois précédent"
              />
              <KPICard
                label="Dépenses du mois"
                value={fShort(data.currentDepenses) + " FCFA"}
                icon={TrendingDown}
                color="red"
                trend={-pct(data.currentDepenses, data.prevDepenses)}
                trendLabel="vs mois précédent"
              />
              <KPICard
                label="Bénéfice Net"
                value={fShort(data.beneficeNet) + " FCFA"}
                icon={DollarSign}
                color={data.beneficeNet >= 0 ? "emerald" : "red"}
                subValue={
                  data.currentRecettes > 0
                    ? `Marge : ${((data.beneficeNet / data.currentRecettes) * 100).toFixed(1)}%`
                    : undefined
                }
              />
              <KPICard
                label="Loyers en attente"
                value={fShort(data.loyersEnAttente) + " FCFA"}
                icon={CreditCard}
                color={data.loyersEnAttente > 0 ? "amber" : "slate"}
                subValue={
                  data.loyersEnAttente > 0 ? "À encaisser" : "Tout encaissé"
                }
              />
            </div>
          )}

          {/* Cartes non financières - Pour tous */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard
              label="Clients"
              value={String(data.totalClients)}
              icon={Users}
              color="blue"
            />
            <KPICard
              label="Projets actifs"
              value={String(data.projetsActifs)}
              icon={Briefcase}
              color="slate"
            />
            <KPICard
              label="Biens immobiliers"
              value={String(data.biensImmobiliers)}
              icon={Building2}
              color="blue"
            />
            <KPICard
              label="Tâches urgentes"
              value={String(data.tachesUrgentes)}
              icon={AlertTriangle}
              color={data.tachesUrgentes > 0 ? "amber" : "slate"}
            />
          </div>

          {/* AI Financial Summary */}
          {canViewFinances && isOllamaEnabled && (
            <div className="bg-slate-50/70 rounded-2xl border border-slate-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-200 rounded-xl">
                    <Sparkles size={20} className="text-slate-700" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800">
                      Résumé IA - Analyse Financière
                    </h2>
                    <p className="text-xs text-slate-500">
                      Généré automatiquement par EGS Copilot
                    </p>
                  </div>
                </div>
                <button
                  onClick={generateAISummary}
                  disabled={aiLoading || !data}
                  className="px-4 py-2 bg-slate-800 text-white text-xs font-medium rounded-lg hover:bg-slate-900 focus-visible:ring-2 focus-visible:ring-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      {aiSummary ? "Régénérer" : "Générer"}
                    </>
                  )}
                </button>
              </div>

              {aiError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-red-700 flex items-center gap-2">
                    <AlertTriangle size={16} />
                    {aiError}
                  </p>
                  <p className="text-xs text-red-600 mt-2">
                    Vérifiez qu'Ollama est démarré:{" "}
                    <code className="bg-red-100 px-2 py-0.5 rounded">
                      ollama serve
                    </code>
                  </p>
                </div>
              )}

              {aiLoading && !aiSummary && (
                <div className="flex items-center gap-3 py-8">
                  <Loader2 size={24} className="animate-spin text-slate-700" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      Analyse en cours...
                    </p>
                    <p className="text-xs text-slate-500">
                      L'IA examine vos données financières
                    </p>
                  </div>
                </div>
              )}

              {aiSummary && (
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {aiSummary}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      Propulsé par Ollama • Les analyses peuvent contenir des
                      erreurs
                    </p>
                    <button
                      onClick={() => navigator.clipboard.writeText(aiSummary)}
                      className="text-xs text-slate-700 hover:text-slate-900 font-medium focus-visible:ring-2 focus-visible:ring-slate-300 rounded"
                    >
                      Copier le résumé
                    </button>
                  </div>
                </div>
              )}

              {!aiSummary && !aiLoading && !aiError && (
                <div className="text-center py-8">
                  <Sparkles size={40} className="mx-auto mb-3 text-slate-400" />
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    Obtenez une analyse IA automatique
                  </p>
                  <p className="text-xs text-slate-500">
                    Cliquez sur "Générer" pour obtenir un résumé intelligent de
                    vos finances
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Sections financières détaillées - Uniquement pour admin/gerant/gestionnaire */}
          {canViewFinances && (
            <>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
                  <h2 className="font-semibold text-slate-800 mb-1">
                    Évolution Financière
                  </h2>
                  <p className="text-xs text-slate-400 mb-5">
                    Recettes & dépenses sur 6 mois
                  </p>
                  <RevenueChart data={data.monthly} />
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h2 className="font-semibold text-slate-800 mb-1">
                    Alertes & Indicateurs
                  </h2>
                  <p className="text-xs text-slate-400 mb-5">
                    Points d'attention critiques
                  </p>
                  <AlertsWidget alerts={data.alerts} />
                  <div className="mt-6 pt-5 border-t border-slate-100">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                      Santé Financière
                    </h3>
                    {[
                      {
                        label: "Taux de marge",
                        value:
                          data.currentRecettes > 0
                            ? (
                                (data.beneficeNet / data.currentRecettes) *
                                100
                              ).toFixed(1) + "%"
                            : "—",
                        ok: data.beneficeNet >= 0,
                      },
                      {
                        label: "Ratio dép./rec.",
                        value:
                          data.currentRecettes > 0
                            ? (
                                (data.currentDepenses / data.currentRecettes) *
                                100
                              ).toFixed(1) + "%"
                            : "—",
                        ok: data.currentDepenses <= data.currentRecettes,
                      },
                      {
                        label: "Loyers recouvrés",
                        value:
                          data.loyersEnAttente === 0
                            ? "100%"
                            : `${fShort(data.loyersEnAttente)} en att.`,
                        ok: data.loyersEnAttente === 0,
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0"
                      >
                        <span className="text-xs text-slate-600">
                          {item.label}
                        </span>
                        <span
                          className={`text-xs font-bold ${item.ok ? "text-emerald-600" : "text-red-500"}`}
                        >
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h2 className="font-semibold text-slate-800 mb-1">
                    Recettes par catégorie
                  </h2>
                  <p className="text-xs text-slate-400 mb-5">6 derniers mois</p>
                  <CategoryDonutChart
                    data={data.recettesByCategory}
                    total={data.recettesByCategory.reduce(
                      (s, d) => s + d.value,
                      0,
                    )}
                    title="Total"
                  />
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h2 className="font-semibold text-slate-800 mb-1">
                    Dépenses par catégorie
                  </h2>
                  <p className="text-xs text-slate-400 mb-5">6 derniers mois</p>
                  <CategoryDonutChart
                    data={data.depensesByCategory}
                    total={data.depensesByCategory.reduce(
                      (s, d) => s + d.value,
                      0,
                    )}
                    title="Total"
                  />
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col">
                  <h2 className="font-semibold text-slate-800 mb-1">
                    Transactions récentes
                  </h2>
                  <p className="text-xs text-slate-400 mb-4">
                    8 dernières opérations
                  </p>
                  <div className="flex-1 space-y-2 overflow-auto">
                    {data.recentTransactions.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-8">
                        Aucune transaction
                      </p>
                    )}
                    {data.recentTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tx.type_transaction === "recette" ? "bg-teal-100" : "bg-red-100"}`}
                        >
                          {tx.type_transaction === "recette" ? (
                            <ArrowUpRight size={15} className="text-teal-600" />
                          ) : (
                            <ArrowDownRight
                              size={15}
                              className="text-red-500"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-700 truncate">
                            {tx.description || tx.categorie}
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date(tx.date_transaction).toLocaleDateString(
                              "fr-FR",
                            )}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-bold flex-shrink-0 ${tx.type_transaction === "recette" ? "text-teal-600" : "text-red-500"}`}
                        >
                          {tx.type_transaction === "recette" ? "+" : "-"}
                          {fShort(tx.montant)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Section Alertes - Pour tous */}
          {!canViewFinances && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-800 mb-1">Alertes</h2>
              <p className="text-xs text-slate-400 mb-5">Points d'attention</p>
              <AlertsWidget alerts={data.alerts} />
            </div>
          )}

          {/* Services & Infrastructure */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-800 mb-1">
              Services & Infrastructure
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              Accès rapide aux applications et services actifs
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {services.map((service) => {
                const IconComponent = service.icon;
                const colorClasses = {
                  blue: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
                  emerald:
                    "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100",
                  slate:
                    "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100",
                  purple:
                    "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100",
                };
                return (
                  <a
                    key={service.id}
                    href={service.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group block p-4 rounded-xl border transition-all duration-200 ${colorClasses[service.color as keyof typeof colorClasses]}`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${service.status === "online" ? "bg-white/50" : "bg-gray-100"}`}
                      >
                        <IconComponent size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-sm truncate">
                            {service.name}
                          </h3>
                          <ExternalLink
                            size={12}
                            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          />
                        </div>
                        <p className="text-xs opacity-75 mt-1 leading-relaxed">
                          {service.description}
                        </p>
                        <div className="flex items-center gap-1 mt-2">
                          <div
                            className={`w-2 h-2 rounded-full ${service.status === "online" ? "bg-green-500" : "bg-gray-400"}`}
                          ></div>
                          <span className="text-xs font-medium capitalize">
                            {service.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-slate-400 text-right">
            Dernière actualisation : {lastRefresh.toLocaleTimeString("fr-FR")}
          </p>
        </>
      ) : null}
    </div>
  );
}

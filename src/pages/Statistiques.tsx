import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useSettings } from "../context/SettingsContext";
import {
  TrendingUp,
  TrendingDown,
  Users,
  HardHat,
  Building2,
  Package,
} from "lucide-react";

interface MonthlyData {
  month: string;
  recettes: number;
  depenses: number;
}

interface ProjectsByStatus {
  statut: string;
  count: number;
}

export default function Statistiques() {
  const { settings } = useSettings();
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [projectsByStatus, setProjectsByStatus] = useState<ProjectsByStatus[]>(
    [],
  );
  const [totals, setTotals] = useState({
    clients: 0,
    projects: 0,
    properties: 0,
    products: 0,
    totalRecettes: 0,
    totalDepenses: 0,
    employees: 0,
    suppliers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [
        cliRes,
        projRes,
        propRes,
        prodRes,
        finRes,
        empRes,
        supRes,
        projStatRes,
      ] = await Promise.all([
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase
          .from("properties")
          .select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase
          .from("finances")
          .select("montant, type_transaction, date_transaction"),
        supabase.from("employees").select("id", { count: "exact", head: true }),
        supabase.from("suppliers").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("statut"),
      ]);

      const finances = finRes.data || [];
      const totalRecettes = finances
        .filter((f) => f.type_transaction === "recette")
        .reduce((s, f) => s + Number(f.montant || 0), 0);
      const totalDepenses = finances
        .filter((f) => f.type_transaction === "depense")
        .reduce((s, f) => s + Number(f.montant || 0), 0);

      setTotals({
        clients: cliRes.count || 0,
        projects: projRes.count || 0,
        properties: propRes.count || 0,
        products: prodRes.count || 0,
        totalRecettes,
        totalDepenses,
        employees: empRes.count || 0,
        suppliers: supRes.count || 0,
      });

      const monthly: Record<string, { recettes: number; depenses: number }> =
        {};
      const last6Months: string[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        last6Months.push(key);
        monthly[key] = { recettes: 0, depenses: 0 };
      }
      finances.forEach((f) => {
        const key = f.date_transaction?.substring(0, 7);
        if (key && monthly[key]) {
          if (f.type_transaction === "recette")
            monthly[key].recettes += Number(f.montant || 0);
          else monthly[key].depenses += Number(f.montant || 0);
        }
      });
      setMonthlyData(
        last6Months.map((k) => ({
          month: new Date(k + "-01").toLocaleDateString("fr-FR", {
            month: "short",
            year: "2-digit",
          }),
          recettes: monthly[k].recettes,
          depenses: monthly[k].depenses,
        })),
      );

      const statusCount: Record<string, number> = {};
      (projStatRes.data || []).forEach((p: any) => {
        statusCount[p.statut] = (statusCount[p.statut] || 0) + 1;
      });
      setProjectsByStatus(
        Object.entries(statusCount).map(([statut, count]) => ({
          statut,
          count,
        })),
      );
    } finally {
      setLoading(false);
    }
  };

  const maxMonthlyValue = Math.max(
    ...monthlyData.flatMap((m) => [m.recettes, m.depenses]),
    1,
  );

  const statutLabels: Record<string, string> = {
    devis: "Devis",
    valide: "Validé",
    en_cours: "En Cours",
    termine: "Terminé",
    facture: "Facturé",
  };
  const statutColors: Record<string, string> = {
    devis: "#94a3b8",
    valide: "#3b82f6",
    en_cours: "#f59e0b",
    termine: "#22c55e",
    facture: "#a855f7",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="animate-spin rounded-full h-10 w-10 border-b-2"
          style={{ borderColor: settings.primary_color }}
        ></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Clients",
            value: totals.clients,
            icon: Users,
            color: settings.primary_color,
          },
          {
            label: "Projets",
            value: totals.projects,
            icon: HardHat,
            color: "#0891b2",
          },
          {
            label: "Biens",
            value: totals.properties,
            icon: Building2,
            color: "#7c3aed",
          },
          {
            label: "Produits",
            value: totals.products,
            icon: Package,
            color: "#ea580c",
          },
          {
            label: "Employés",
            value: totals.employees,
            icon: Users,
            color: "#16a34a",
          },
          {
            label: "Fournisseurs",
            value: totals.suppliers,
            icon: Users,
            color: "#0284c7",
          },
          {
            label: "Total Recettes",
            value: `${totals.totalRecettes.toLocaleString("fr-FR")}`,
            icon: TrendingUp,
            color: "#16a34a",
          },
          {
            label: "Total Dépenses",
            value: `${totals.totalDepenses.toLocaleString("fr-FR")}`,
            icon: TrendingDown,
            color: "#dc2626",
          },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: item.color + "15" }}
                >
                  <Icon size={16} style={{ color: item.color }} />
                </div>
                <span className="text-xs text-gray-500">{item.label}</span>
              </div>
              <div className="text-xl font-bold text-gray-800">
                {item.value}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">
            Évolution Financière (6 mois)
          </h3>
          <div className="space-y-3">
            {monthlyData.map((m, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{m.month}</span>
                  <span className="text-green-600">
                    +{m.recettes.toLocaleString("fr-FR")}
                  </span>
                </div>
                <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full transition-all"
                    style={{
                      width: `${(m.recettes / maxMonthlyValue) * 100}%`,
                      backgroundColor: settings.secondary_color + "cc",
                    }}
                  ></div>
                  <div
                    className="absolute left-0 top-0 h-full rounded-full opacity-60 transition-all"
                    style={{
                      width: `${(m.depenses / maxMonthlyValue) * 100}%`,
                      backgroundColor: "#ef4444cc",
                    }}
                  ></div>
                </div>
                <div className="flex justify-end text-xs text-red-400">
                  -{m.depenses.toLocaleString("fr-FR")}
                </div>
              </div>
            ))}
            <div className="flex gap-4 mt-2 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: settings.secondary_color }}
                ></div>
                Recettes
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                Dépenses
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">
            Projets par Statut
          </h3>
          {projectsByStatus.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              Aucun projet enregistré
            </div>
          ) : (
            <div className="space-y-3">
              {projectsByStatus.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: statutColors[p.statut] || "#94a3b8",
                    }}
                  ></div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">
                        {statutLabels[p.statut] || p.statut}
                      </span>
                      <span className="font-medium text-gray-800">
                        {p.count}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${(p.count / totals.projects) * 100}%`,
                          backgroundColor: statutColors[p.statut] || "#94a3b8",
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Santé Financière
            </h4>
            <div
              className="flex items-center justify-between p-3 rounded-xl"
              style={{
                backgroundColor:
                  totals.totalRecettes - totals.totalDepenses >= 0
                    ? "#f0fdf4"
                    : "#fef2f2",
              }}
            >
              <span className="text-sm text-gray-600">Bilan Global</span>
              <span
                className={`font-bold ${totals.totalRecettes - totals.totalDepenses >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {(totals.totalRecettes - totals.totalDepenses).toLocaleString(
                  "fr-FR",
                )}{" "}
                FCFA
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

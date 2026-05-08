import { useEffect, useState, useCallback } from "react";
import {
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { supabase } from "../lib/supabase";

interface TableCheck {
  name: string;
  exists: boolean;
  error?: string;
  count?: number;
}

const DIAGNOSTIC_TABLES = [
  "clients",
  "projects",
  "properties",
  "products",
  "finances",
  "employees",
  "suppliers",
  "documents",
  "tasks",
  "user_profiles",
  "app_settings",
  "visiteurs",
  "visites",
  "foncier_lots",
  "foncier_villages",
  "foncier_audit",
] as const;

export default function Diagnostic() {
  const [checks, setChecks] = useState<TableCheck[]>([]);
  const [loading, setLoading] = useState(true);

  const checkTables = useCallback(async () => {
    setLoading(true);
    const results: TableCheck[] = [];

    for (const table of DIAGNOSTIC_TABLES) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select("id", { count: "exact", head: true });

        if (error) {
          results.push({
            name: table,
            exists: false,
            error: error.message,
          });
        } else {
          results.push({
            name: table,
            exists: true,
            count: data?.length ?? 0,
          });
        }
      } catch (err) {
        results.push({
          name: table,
          exists: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    setChecks(results);
    setLoading(false);
  }, []);

  useEffect(() => {
    void checkTables();
  }, [checkTables]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Diagnostic en cours...</p>
        </div>
      </div>
    );
  }

  const successCount = checks.filter((c) => c.exists).length;
  const errorCount = checks.filter((c) => !c.exists).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Activity size={24} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Diagnostic Base de Données
              </h1>
              <p className="text-sm text-gray-500">
                Vérification de l'accès aux tables Supabase
              </p>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <div className="flex-1 p-4 bg-green-50 rounded-xl border border-green-100">
              <div className="flex items-center gap-2">
                <CheckCircle size={20} className="text-green-600" />
                <span className="text-2xl font-bold text-green-700">
                  {successCount}
                </span>
                <span className="text-sm text-green-600">tables OK</span>
              </div>
            </div>
            <div className="flex-1 p-4 bg-red-50 rounded-xl border border-red-100">
              <div className="flex items-center gap-2">
                <XCircle size={20} className="text-red-600" />
                <span className="text-2xl font-bold text-red-700">
                  {errorCount}
                </span>
                <span className="text-sm text-red-600">tables en erreur</span>
              </div>
            </div>
          </div>

          <button
            onClick={checkTables}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            Rafraîchir le diagnostic
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          {checks.map((check) => (
            <div
              key={check.name}
              className={`p-4 flex items-center justify-between ${
                check.exists ? "bg-white" : "bg-red-50"
              }`}
            >
              <div className="flex items-center gap-3">
                {check.exists ? (
                  <CheckCircle size={20} className="text-green-600" />
                ) : (
                  <XCircle size={20} className="text-red-600" />
                )}
                <div>
                  <div className="font-medium text-gray-900">{check.name}</div>
                  {check.error && (
                    <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {check.error}
                    </div>
                  )}
                </div>
              </div>
              {check.exists && (
                <div className="text-sm text-gray-500">
                  {check.count} enregistrements
                </div>
              )}
            </div>
          ))}
        </div>

        {errorCount > 0 && (
          <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800 mb-2">
                  Tables manquantes ou inaccessibles
                </h3>
                <p className="text-sm text-amber-700">
                  Certaines tables n'existent pas dans votre base de données ou
                  les permissions RLS bloquent l'accès. Exécutez les migrations
                  Supabase pour créer les tables manquantes.
                </p>
                <p className="text-xs text-amber-600 mt-2">
                  Commande :{" "}
                  <code className="bg-amber-100 px-2 py-1 rounded">
                    bash scripts/workspace-stack.sh egs db-push --dry-run
                  </code>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { FileText, Shield } from "lucide-react";
import { apiClient } from '../../../api/client';
import { useAuth } from "@/context/AuthContext";

interface SectionAuditProps {
  activeTab: string;
}

export function SectionAudit({ activeTab }: SectionAuditProps) {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAuditLogs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiClient.request('/settings/audit?limit=50');
      const data = result.data;
      const error = result.error;

      if (!error && data) {
        setAuditLogs(data);
      }
    } catch (err) {
      console.error("Erreur chargement audit:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  if (activeTab !== "audit") return null;

  if (!isAdmin) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
        <Shield size={48} className="mx-auto text-amber-500 mb-3" />
        <h3 className="font-semibold text-amber-800 mb-2">
          Accès Restreint
        </h3>
        <p className="text-sm text-amber-700">
          Seuls les administrateurs peuvent consulter l'historique des
          modifications.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
        <p className="text-sm text-gray-500 mt-2">Chargement...</p>
      </div>
    );
  }

  if (auditLogs.length === 0) {
    return (
      <div className="p-12 text-center">
        <FileText size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500 text-sm">Aucune modification enregistrée</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
      {auditLogs.map((log) => (
        <div
          key={log.id}
          className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-blue-200 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {log.setting_key}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(log.changed_at).toLocaleString("fr-FR")}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500">Par:</span>
                <span className="text-gray-700 font-medium">
                  {log.user_profiles?.full_name || "Système"}
                </span>
              </div>
              {log.old_value && log.new_value && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="bg-red-50 rounded-lg p-2">
                    <p className="text-xs text-red-600 font-medium mb-0.5">
                      Avant:
                    </p>
                    <p className="text-xs text-red-800 break-all">{log.old_value}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2">
                    <p className="text-xs text-green-600 font-medium mb-0.5">
                      Après:
                    </p>
                    <p className="text-xs text-green-800 break-all">{log.new_value}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

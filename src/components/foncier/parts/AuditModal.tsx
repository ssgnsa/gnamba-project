import { FC, useState, useEffect, useCallback } from "react";
import { FileText, Printer, Download, Loader2, AlertCircle } from "lucide-react";
import dbClient from "@/lib/dbClient.service";
import Badge from "@/components/ui/Badge";
import { formatDateLong } from "@/utils/reference";
import { printAuditReport } from "@/utils/print";

interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
  accessLevel?: string;
  profile?: { id?: string | null; full_name?: string | null } | null;
  canManage?: boolean;
}

const auditActionLabels: Record<string, string> = {
  LOT_CREATE: "Création lot",
  LOT_UPDATE: "Modification lot",
  LOT_ARCHIVE: "Archivage lot",
  LOT_RESTORE: "Restauration lot",
  ATTESTATION_CREATE: "Création attestation",
  ATTESTATION_SUBMIT: "Soumission attestation",
  ATTESTATION_VALIDATE: "Validation Chef",
  ATTESTATION_REVOKE: "Révocation attestation",
  ATTESTATION_REISSUE: "Réémission attestation",
  ATTESTATION_SCAN: "Scan original",
  VILLAGE_CREATE: "Création village",
  VILLAGE_UPDATE: "Modification village",
  CONFIG_CHANGE: "Changement config",
  DUPLICATE_DETECTED: "Doublon détecté",
  SYNC_PUSH: "Sync montée",
  SYNC_PULL: "Sync descente",
  SYNC_CONFLICT: "Conflit sync",
};

export const AuditModal: FC<AuditModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [actionFilter, setActionFilter] = useState("");
  const pageSize = 50;
  const totalPages = Math.ceil(totalCount / pageSize);

  const fetchAudit = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      let query = dbClient
        .from("activity_logs")
        .select("id, entity_type, entity_id, action, old_values, new_values, user_id, user_name, user_email, ip_address, device_id, metadata, created_at", { count: "exact" })
        .in("entity_type", ["foncier_lot", "foncier_attestation", "foncier_village", "foncier_lotissement", "foncier_ilot"])
        .order("created_at", { ascending: false })
        .range(from, to);

      if (actionFilter) {
        query = query.eq("action", actionFilter);
      }

      const result = await query;
      
      if (result.error) throw result.error;
      
      setRecords(result.data || []);
      setTotalCount(result.count || 0);
    } catch (err: any) {
      console.error("Error fetching audit:", err);
      setError(err.message || "Impossible de charger l'audit");
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => {
    if (isOpen) {
      fetchAudit();
    }
  }, [isOpen, fetchAudit]);

  const handlePrint = async () => {
    if (records.length === 0) return;
    try {
      const reportData = {
        title: "Rapport d'audit foncier",
        generated_at: new Date().toISOString(),
        rows: records.map((r: any) => ({
          date_action: formatDateLong(r.created_at),
          action: auditActionLabels[r.action] || r.action,
          utilisateur_nom: r.user_name || r.user_email || "Inconnu",
          parcelle_reference: r.entity_id || "—",
          village: "",
          details: JSON.stringify(r.metadata || r.new_values || r.old_values || {})
        })),
        logoUrl: ""
      };
      await printAuditReport(reportData);
    } catch (err) {
      console.error("Print audit error:", err);
    }
  };

  const handleExport = () => {
    if (records.length === 0) return;
    const headers = ["Date", "Entité", "ID", "Action", "Utilisateur", "Détails"];
    const rows = records.map((r) => [
      formatDateLong(r.created_at),
      r.entity_type,
      r.entity_id,
      auditActionLabels[r.action] || r.action,
      r.user_name || r.user_email || r.user_id || "—",
      JSON.stringify(r.metadata || {}),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `audit-foncier-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto">
        <div className="bg-white rounded-lg shadow-lg w-full">
          <div className="flex items-center justify-between p-4 border-b rounded-t-lg">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText size={20} /> Journal d'audit foncier
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">×</button>
          </div>
          <div className="p-6 space-y-4 max-h-[calc(90vh-120px)] overflow-y-auto">
            {error && (
              <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {error}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-white"
              >
                <option value="">Toutes actions</option>
                {Object.keys(auditActionLabels).map((action) => (
                  <option key={action} value={action}>{auditActionLabels[action] || action}</option>
                ))}
              </select>
              <button onClick={handlePrint} disabled={!records.length} className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
                <Printer size={16} className="inline mr-1" /> Imprimer (PDF)
              </button>
              <button onClick={handleExport} disabled={!records.length} className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
                <Download size={16} className="inline mr-1" /> Export CSV
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 size={32} className="animate-spin text-blue-600" />
              </div>
            ) : records.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <AlertCircle size={48} className="mb-2 opacity-50" />
                <p className="text-sm">Aucun enregistrement d'audit trouvé.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto border border-gray-100 rounded-xl">
                  <table className="w-full egs-table">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Entité</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">ID</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Utilisateur</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Détails</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {records.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-xs text-gray-600 font-mono">{formatDateLong(record.created_at)}</td>
                          <td className="px-4 py-3 text-xs text-gray-700 font-medium">{record.entity_type}</td>
                          <td className="px-4 py-3 text-xs text-gray-600 font-mono">{record.entity_id.slice(0, 8)}…</td>
                          <td className="px-4 py-3">
                            <Badge 
                              label={auditActionLabels[record.action] || record.action} 
                              color={record.action.includes("ERROR") || record.action.includes("REVOKE") ? "red" : "blue"} 
                            />
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600">
                            {record.user_name || record.user_email || record.user_id || "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate font-mono">
                            {record.metadata ? JSON.stringify(record.metadata) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-gray-500">
                    <div>Total: <span className="font-medium text-gray-700">{totalCount}</span> événements</div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">Précédent</button>
                      <span className="text-gray-600">Page {page} / {totalPages}</span>
                      <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">Suivant</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
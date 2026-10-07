import { useCallback, useState } from "react";
import { dataService } from "../lib/dbClient.service";
import type { AuditRecord, AuditQueryRow } from "../components/foncier/FoncierConstants";

/**
 * Hook pour la gestion de l'audit foncier
 */
export function useFoncierAudit() {
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditRecords, setAuditRecords] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditActionFilter, setAuditActionFilter] = useState("");
  const [auditError, setAuditError] = useState<string | null>(null);

  const fetchAudit = useCallback(
    async (
      auditPage: number,
      auditPageSize: number,
      auditActionFilter: string,
      isOnline: boolean,
    ): Promise<{ data: AuditRecord[] | null; error: any; total: number }> => {
      if (!isOnline) {
        return { data: null, error: "Mode hors-ligne : journal d'audit indisponible.", total: 0 };
      }

      const { data, error, count } = await dataService.getAudit(
        auditPage,
        auditPageSize,
        auditActionFilter || undefined
      ) as { data: any[] | null; error: any; count: number | null };

      if (error) {
        return { data: null, error, total: 0 };
      }

      const rows = (data || []) as unknown as AuditQueryRow[];
      const normalizedRows: AuditRecord[] = rows.map((row) => ({
        id: row.id,
        parcelle_id: row.entity_id,
        action: row.action,
        utilisateur_nom: row.user_name,
        date_action: row.created_at,
        details: row.new_values || row.old_values || null,
      }));

      setAuditRecords(normalizedRows);
      setAuditTotal(count ?? normalizedRows.length);
      setAuditError(null);
      return { data: normalizedRows, error: null, total: count ?? normalizedRows.length };
    },
    [],
  );

  return {
    auditModalOpen,
    setAuditModalOpen,
    auditRecords,
    setAuditRecords,
    auditLoading,
    setAuditLoading,
    auditPage,
    setAuditPage,
    auditTotal,
    setAuditTotal,
    auditActionFilter,
    setAuditActionFilter,
    auditError,
    setAuditError,
    fetchAudit,
  };
}

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
      const performerIds = Array.from(
        new Set(
          rows
            .map((row) => row.user_id)
            .filter((value): value is string => Boolean(value)),
        ),
      );

      let namesById: Record<string, string> = {};
      if (performerIds.length > 0) {
        const { data: profilesData, error: profilesError } = await dataService.getUserProfiles(performerIds) as {
          data: Record<string, { full_name: string | null }> | null;
          error: any;
        };
        if (profilesError) {
          if (import.meta.env.DEV) console.warn("Failed to load user profiles for audit", profilesError);
        } else if (profilesData) {
          namesById = Object.fromEntries(
            Object.entries(profilesData).map(([id, profile]) => [id, profile.full_name || ""]),
          );
        }
      }

      const normalizedRows: AuditRecord[] = rows.map((row) => ({
        id: row.id,
        parcelle_id: row.entity_type === "foncier_lot" ? row.entity_id : null,
        action: row.action,
        utilisateur_nom: row.user_id
          ? namesById[row.user_id] || (
              row.user_name?.toLowerCase() === row.user_id.toLowerCase()
                ? null
                : row.user_name
            )
          : row.user_name,
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

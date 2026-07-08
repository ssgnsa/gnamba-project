import { useCallback } from "react";
import { dataService } from "../lib/dbClient.service";
import type { AuditRecord, AuditQueryRow } from "../components/foncier/FoncierConstants";

/**
 * Hook pour la gestion de l'audit foncier
 */
export function useFoncierAudit() {
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

      const { data, error, count } = await dataService.getAudit({
        page: auditPage,
        pageSize: auditPageSize,
        actionFilter: auditActionFilter || undefined,
      }) as { data: any[] | null; error: any; count: number | null };

      if (error) {
        return { data: null, error, total: 0 };
      }

      const rows = (data || []) as unknown as AuditQueryRow[];
      const performerIds = Array.from(
        new Set(
          rows
            .map((row) => row.performed_by)
            .filter((value): value is string => Boolean(value)),
        ),
      );

      let namesById: Record<string, string> = {};
      if (performerIds.length > 0) {
        const { data: profilesData, error: profilesError } = await dataService.getUserProfiles(performerIds) as {
          data: Array<{ id: string; full_name: string | null }> | null;
          error: any;
        };
        if (profilesError) {
          if (import.meta.env.DEV) console.warn("Failed to load user profiles for audit", profilesError);
        } else {
          namesById = (profilesData || []).reduce(
            (acc: Record<string, string>, profile: { id: string; full_name: string | null }) => {
              acc[profile.id] = profile.full_name || "";
              return acc;
            },
            {} as Record<string, string>,
          );
        }
      }

      const normalizedRows: AuditRecord[] = rows.map((row) => ({
        id: row.id,
        parcelle_id: row.lot_id,
        action: row.action,
        utilisateur_nom: row.performed_by
          ? namesById[row.performed_by] || null
          : null,
        date_action: row.performed_at,
        details: row.new_values || row.old_values || null,
        foncier_lots: row.foncier_lots || null,
      }));

      return { data: normalizedRows, error: null, total: count ?? 0 };
    },
    [],
  );

  return {
    fetchAudit,
  };
}
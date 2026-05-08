import { useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { AuditRecord, AuditQueryRow } from "../components/foncier/FoncierConstants";
import { withBackoff } from "./useFoncierSync";

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

      const from = (auditPage - 1) * auditPageSize;
      const to = from + auditPageSize - 1;

      let query = supabase
        .from("foncier_audit")
        .select(
          "id, lot_id, action, performed_by, performed_at, old_values, new_values, foncier_lots:lot_id(reference, numero_lot, village)",
          { count: "exact" },
        )
        .order("performed_at", { ascending: false })
        .range(from, to);

      if (auditActionFilter) {
        query = query.eq("action", auditActionFilter);
      }

      const { data, error, count } = await withBackoff(() => query);

      if (error) {
        return { data: null, error, total: 0 };
      }

      const rows = (data || []) as AuditQueryRow[];
      const performerIds = Array.from(
        new Set(
          rows
            .map((row) => row.performed_by)
            .filter((value): value is string => Boolean(value)),
        ),
      );

      let namesById: Record<string, string> = {};
      if (performerIds.length > 0) {
        const { data: profilesData } = await withBackoff(() =>
          supabase
            .from("user_profiles")
            .select("id, full_name")
            .in("id", performerIds),
        );
        namesById = (profilesData || []).reduce(
          (acc: Record<string, string>, profile: { id: string; full_name: string | null }) => {
            acc[profile.id] = profile.full_name || "";
            return acc;
          },
          {} as Record<string, string>,
        );
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
-- ============================================
-- Migration: Foncier Phase 1 Critical RLS Hardening
-- Date: 2026-06-08
-- Purpose:
--   - close the two critical Foncier security gaps identified in the audit
--   - keep the fix additive, idempotent, and compatible with the current app
--   - preserve the public attestation verification flow via the Edge Function
-- ============================================


-- ============================================
-- 1. Foncier lots: role + village access
-- ============================================
ALTER TABLE public.foncier_lots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "foncier_lots_select" ON public.foncier_lots;
DROP POLICY IF EXISTS "foncier_lots_insert" ON public.foncier_lots;
DROP POLICY IF EXISTS "foncier_lots_update" ON public.foncier_lots;
DROP POLICY IF EXISTS "foncier_lots_delete" ON public.foncier_lots;

CREATE POLICY "foncier_lots_select" ON public.foncier_lots
  FOR SELECT TO authenticated
  USING (
    current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1
      FROM public.user_village_access uva
      WHERE uva.user_id = auth.uid()
        AND uva.village = public.foncier_lots.village
    )
  );

CREATE POLICY "foncier_lots_insert" ON public.foncier_lots
  FOR INSERT TO authenticated
  WITH CHECK (
    current_user_role() IN ('admin', 'gestionnaire')
    AND (
      current_user_role() = 'admin'
      OR EXISTS (
        SELECT 1
        FROM public.user_village_access uva
        WHERE uva.user_id = auth.uid()
          AND uva.village = public.foncier_lots.village
      )
    )
  );

CREATE POLICY "foncier_lots_update" ON public.foncier_lots
  FOR UPDATE TO authenticated
  USING (
    current_user_role() IN ('admin', 'gestionnaire')
    AND (
      current_user_role() = 'admin'
      OR EXISTS (
        SELECT 1
        FROM public.user_village_access uva
        WHERE uva.user_id = auth.uid()
          AND uva.village = public.foncier_lots.village
      )
    )
  )
  WITH CHECK (
    current_user_role() IN ('admin', 'gestionnaire')
    AND (
      current_user_role() = 'admin'
      OR EXISTS (
        SELECT 1
        FROM public.user_village_access uva
        WHERE uva.user_id = auth.uid()
          AND uva.village = public.foncier_lots.village
      )
    )
  );

CREATE POLICY "foncier_lots_delete" ON public.foncier_lots
  FOR DELETE TO authenticated
  USING (current_user_role() = 'admin');

-- Explicit grants are required on exposed tables.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.foncier_lots TO authenticated;

-- ============================================
-- 2. Foncier attestations: remove permissive read access
-- ============================================
ALTER TABLE public.foncier_attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foncier_attestation_temoins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "foncier_attestations_select" ON public.foncier_attestations;
DROP POLICY IF EXISTS "foncier_attestations_insert" ON public.foncier_attestations;
DROP POLICY IF EXISTS "foncier_attestations_update" ON public.foncier_attestations;
DROP POLICY IF EXISTS "foncier_attestations_delete" ON public.foncier_attestations;
DROP POLICY IF EXISTS "Authenticated users can view foncier_attestations" ON public.foncier_attestations;
DROP POLICY IF EXISTS "Authenticated users can insert foncier_attestations" ON public.foncier_attestations;
DROP POLICY IF EXISTS "Authenticated users can update foncier_attestations" ON public.foncier_attestations;
DROP POLICY IF EXISTS "Admins can delete foncier_attestations" ON public.foncier_attestations;
DROP POLICY IF EXISTS "Users can view foncier_attestations by village" ON public.foncier_attestations;
DROP POLICY IF EXISTS "Admin and gestionnaire can insert foncier_attestations" ON public.foncier_attestations;
DROP POLICY IF EXISTS "Admin and gestionnaire can update foncier_attestations" ON public.foncier_attestations;
DROP POLICY IF EXISTS "Admins can delete foncier_attestations" ON public.foncier_attestations;

CREATE POLICY "foncier_attestations_select" ON public.foncier_attestations
  FOR SELECT TO authenticated
  USING (
    current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1
      FROM public.foncier_lots fl
      JOIN public.user_village_access uva
        ON uva.village = fl.village
       AND uva.user_id = auth.uid()
      WHERE fl.id = public.foncier_attestations.lot_id
    )
  );

CREATE POLICY "foncier_attestations_insert" ON public.foncier_attestations
  FOR INSERT TO authenticated
  WITH CHECK (
    current_user_role() IN ('admin', 'gestionnaire')
  );

CREATE POLICY "foncier_attestations_update" ON public.foncier_attestations
  FOR UPDATE TO authenticated
  USING (
    current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1
      FROM public.foncier_lots fl
      JOIN public.user_village_access uva
        ON uva.village = fl.village
       AND uva.user_id = auth.uid()
      WHERE fl.id = public.foncier_attestations.lot_id
    )
  )
  WITH CHECK (
    current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1
      FROM public.foncier_lots fl
      JOIN public.user_village_access uva
        ON uva.village = fl.village
       AND uva.user_id = auth.uid()
      WHERE fl.id = public.foncier_attestations.lot_id
    )
  );

CREATE POLICY "foncier_attestations_delete" ON public.foncier_attestations
  FOR DELETE TO authenticated
  USING (current_user_role() = 'admin');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.foncier_attestations TO authenticated;

-- ============================================
-- 3. Attestation witnesses: inherit parent access
-- ============================================
DROP POLICY IF EXISTS "foncier_attestation_temoins_select" ON public.foncier_attestation_temoins;
DROP POLICY IF EXISTS "foncier_attestation_temoins_insert" ON public.foncier_attestation_temoins;
DROP POLICY IF EXISTS "foncier_attestation_temoins_update" ON public.foncier_attestation_temoins;
DROP POLICY IF EXISTS "foncier_attestation_temoins_delete" ON public.foncier_attestation_temoins;
DROP POLICY IF EXISTS "Authenticated users can view foncier_attestation_temoins" ON public.foncier_attestation_temoins;
DROP POLICY IF EXISTS "Authenticated users can manage foncier_attestation_temoins" ON public.foncier_attestation_temoins;
DROP POLICY IF EXISTS "Users can view temoins by village" ON public.foncier_attestation_temoins;
DROP POLICY IF EXISTS "Admin and gestionnaire can insert temoins" ON public.foncier_attestation_temoins;
DROP POLICY IF EXISTS "Admin and gestionnaire can update temoins" ON public.foncier_attestation_temoins;
DROP POLICY IF EXISTS "Admins can delete temoins" ON public.foncier_attestation_temoins;

CREATE POLICY "foncier_attestation_temoins_select" ON public.foncier_attestation_temoins
  FOR SELECT TO authenticated
  USING (
    current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1
      FROM public.foncier_attestations fa
      JOIN public.foncier_lots fl ON fl.id = fa.lot_id
      JOIN public.user_village_access uva
        ON uva.village = fl.village
       AND uva.user_id = auth.uid()
      WHERE fa.id = public.foncier_attestation_temoins.attestation_id
    )
  );

CREATE POLICY "foncier_attestation_temoins_insert" ON public.foncier_attestation_temoins
  FOR INSERT TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'gestionnaire'));

CREATE POLICY "foncier_attestation_temoins_update" ON public.foncier_attestation_temoins
  FOR UPDATE TO authenticated
  USING (current_user_role() IN ('admin', 'gestionnaire'))
  WITH CHECK (current_user_role() IN ('admin', 'gestionnaire'));

CREATE POLICY "foncier_attestation_temoins_delete" ON public.foncier_attestation_temoins
  FOR DELETE TO authenticated
  USING (current_user_role() = 'admin');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.foncier_attestation_temoins TO authenticated;

-- ============================================
-- 4. Supporting tables used by the policies and pages
-- ============================================
GRANT SELECT ON public.foncier_villages TO authenticated;
GRANT SELECT ON public.user_village_access TO authenticated;
GRANT SELECT ON public.foncier_audit TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_foncier_lots TO authenticated;
GRANT EXECUTE ON FUNCTION public.foncier_stats_by_village TO authenticated;

-- Keep the public expiration view safe under RLS.
CREATE OR REPLACE VIEW public.v_foncier_attestations_expirees
WITH (security_invoker = true)
AS
SELECT
  fa.id,
  fa.reference,
  fa.lot_id,
  fa.date_etablissement,
  fa.date_expiration,
  fa.statut,
  fl.proprietaire_nom,
  fl.proprietaire_prenom
FROM public.foncier_attestations fa
LEFT JOIN public.foncier_lots fl ON fl.id = fa.lot_id
WHERE fa.date_expiration IS NOT NULL
  AND fa.date_expiration < NOW()
  AND fa.statut NOT IN ('revoque', 'expire');

GRANT SELECT ON public.v_foncier_attestations_expirees TO authenticated;


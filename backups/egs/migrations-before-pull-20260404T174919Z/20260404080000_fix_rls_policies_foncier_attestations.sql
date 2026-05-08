/*
  Migration: Fix RLS policies on foncier_attestations
  Date: 2026-04-04
  Purpose: Restrict access by role and village (was previously open to ALL authenticated)

  Run order: After 01_create_foncier_attestations_tables.sql
*/

-- ============================================
-- Drop existing overly-permissive policies
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can view foncier_attestations" ON public.foncier_attestations;
DROP POLICY IF EXISTS "Authenticated users can insert foncier_attestations" ON public.foncier_attestations;
DROP POLICY IF EXISTS "Authenticated users can update foncier_attestations" ON public.foncier_attestations;
DROP POLICY IF EXISTS "Admins can delete foncier_attestations" ON public.foncier_attestations;

-- ============================================
-- New RLS policies: restricted by role + village
-- ============================================

-- SELECT: Admin sees all, gestionnaire/employé sees only their village_access
CREATE POLICY "Users can view foncier_attestations by village"
  ON public.foncier_attestations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.role = 'admin'
        OR EXISTS (
          SELECT 1 FROM foncier_lots fl
          WHERE fl.id = foncier_attestations.lot_id
          AND fl.village = up.village_access
        )
      )
    )
  );

-- INSERT: Admin and gestionnaire can create (not employé)
CREATE POLICY "Admin and gestionnaire can insert foncier_attestations"
  ON public.foncier_attestations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('admin', 'gestionnaire')
    )
  );

-- UPDATE: Admin and gestionnaire can update (not employé)
CREATE POLICY "Admin and gestionnaire can update foncier_attestations"
  ON public.foncier_attestations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.role = 'admin'
        OR EXISTS (
          SELECT 1 FROM foncier_lots fl
          WHERE fl.id = foncier_attestations.lot_id
          AND fl.village = up.village_access
        )
      )
      AND up.role IN ('admin', 'gestionnaire')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.role = 'admin'
        OR EXISTS (
          SELECT 1 FROM foncier_lots fl
          WHERE fl.id = foncier_attestations.lot_id
          AND fl.village = up.village_access
        )
      )
      AND up.role IN ('admin', 'gestionnaire')
    )
  );

-- DELETE: Admin only
CREATE POLICY "Admins can delete foncier_attestations"
  ON public.foncier_attestations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role = 'admin'
    )
  );

-- ============================================
-- foncier_attestation_temoins: follow parent attestation access
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can view foncier_attestation_temoins" ON public.foncier_attestation_temoins;
DROP POLICY IF EXISTS "Authenticated users can manage foncier_attestation_temoins" ON public.foncier_attestation_temoins;

-- SELECT: same logic as parent attestation
CREATE POLICY "Users can view temoins by village"
  ON public.foncier_attestation_temoins FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM foncier_attestations fa
      JOIN user_profiles up ON up.id = auth.uid()
      WHERE fa.id = foncier_attestation_temoins.attestation_id
      AND (
        up.role = 'admin'
        OR EXISTS (
          SELECT 1 FROM foncier_lots fl
          WHERE fl.id = fa.lot_id
          AND fl.village = up.village_access
        )
      )
    )
  );

-- INSERT: Admin and gestionnaire only
CREATE POLICY "Admin and gestionnaire can insert temoins"
  ON public.foncier_attestation_temoins FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('admin', 'gestionnaire')
    )
  );

-- UPDATE: Admin and gestionnaire only
CREATE POLICY "Admin and gestionnaire can update temoins"
  ON public.foncier_attestation_temoins FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM foncier_attestations fa
      JOIN user_profiles up ON up.id = auth.uid()
      WHERE fa.id = foncier_attestation_temoins.attestation_id
      AND up.role IN ('admin', 'gestionnaire')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM foncier_attestations fa
      JOIN user_profiles up ON up.id = auth.uid()
      WHERE fa.id = foncier_attestation_temoins.attestation_id
      AND up.role IN ('admin', 'gestionnaire')
    )
  );

-- DELETE: Admin only
CREATE POLICY "Admins can delete temoins"
  ON public.foncier_attestation_temoins FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role = 'admin'
    )
  );

-- ============================================
-- END OF MIGRATION
-- ============================================

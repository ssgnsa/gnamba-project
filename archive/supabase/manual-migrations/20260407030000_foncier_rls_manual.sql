-- ============================================
-- RUN MANUALLY via Supabase Dashboard SQL Editor
-- ============================================
-- Migration: Foncier Attestations & Temoins RLS — Part 2 (Complex subqueries)
-- Date: 2026-04-07
--
-- ⚠️  This migration contains complex subqueries that may timeout via `supabase db push`.
-- Run it manually in Supabase Dashboard → SQL Editor.
--
-- Purpose: Fix RLS policies for foncier_attestations and foncier_attestation_temoins
-- to use user_village_access instead of the non-existent up.village_access
-- ============================================

BEGIN;

-- ============================================
-- FIX #3: Repair foncier_attestations RLS — use user_village_access table
-- ============================================
-- Drop ALL existing policies (broken ones referencing up.village_access)
DROP POLICY IF EXISTS "Users can view foncier_attestations by village" ON public.foncier_attestations;
DROP POLICY IF EXISTS "Admin and gestionnaire can insert foncier_attestations" ON public.foncier_attestations;
DROP POLICY IF EXISTS "Admin and gestionnaire can update foncier_attestations" ON public.foncier_attestations;
DROP POLICY IF EXISTS "Admins can delete foncier_attestations" ON public.foncier_attestations;
DROP POLICY IF EXISTS "Authenticated users can view foncier_attestations" ON public.foncier_attestations;
DROP POLICY IF EXISTS "Authenticated users can insert foncier_attestations" ON public.foncier_attestations;
DROP POLICY IF EXISTS "Authenticated users can update foncier_attestations" ON public.foncier_attestations;

-- New SELECT: Admin sees all, gestionnaire sees villages they have access to
CREATE POLICY "foncier_attestations_select" ON public.foncier_attestations
  FOR SELECT TO authenticated
  USING (
    current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.foncier_lots fl
      JOIN public.user_village_access uva ON uva.village = fl.village AND uva.user_id = auth.uid()
      WHERE fl.id = foncier_attestations.lot_id
    )
  );

-- INSERT: Admin + gestionnaire
CREATE POLICY "foncier_attestations_insert" ON public.foncier_attestations
  FOR INSERT TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'gestionnaire'));

-- UPDATE: Admin + gestionnaire (with village access check)
CREATE POLICY "foncier_attestations_update" ON public.foncier_attestations
  FOR UPDATE TO authenticated
  USING (
    current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.foncier_lots fl
      JOIN public.user_village_access uva ON uva.village = fl.village AND uva.user_id = auth.uid()
      WHERE fl.id = foncier_attestations.lot_id
    )
  )
  WITH CHECK (
    current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.foncier_lots fl
      JOIN public.user_village_access uva ON uva.village = fl.village AND uva.user_id = auth.uid()
      WHERE fl.id = foncier_attestations.lot_id
    )
  );

-- DELETE: Admin only
CREATE POLICY "foncier_attestations_delete" ON public.foncier_attestations
  FOR DELETE TO authenticated
  USING (current_user_role() = 'admin');

-- ============================================
-- FIX #3 (bis): Repair foncier_attestation_temoins RLS
-- ============================================
DROP POLICY IF EXISTS "Users can view temoins by village" ON public.foncier_attestation_temoins;
DROP POLICY IF EXISTS "Admin and gestionnaire can insert temoins" ON public.foncier_attestation_temoins;
DROP POLICY IF EXISTS "Admin and gestionnaire can update temoins" ON public.foncier_attestation_temoins;
DROP POLICY IF EXISTS "Admins can delete temoins" ON public.foncier_attestation_temoins;
DROP POLICY IF EXISTS "Authenticated users can view foncier_attestation_temoins" ON public.foncier_attestation_temoins;
DROP POLICY IF EXISTS "Authenticated users can manage foncier_attestation_temoins" ON public.foncier_attestation_temoins;

CREATE POLICY "foncier_attestation_temoins_select" ON public.foncier_attestation_temoins
  FOR SELECT TO authenticated
  USING (
    current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.foncier_attestations fa
      JOIN public.foncier_lots fl ON fl.id = fa.lot_id
      JOIN public.user_village_access uva ON uva.village = fl.village AND uva.user_id = auth.uid()
      WHERE fa.id = foncier_attestation_temoins.attestation_id
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

COMMIT;

-- ============================================
-- VERIFY
-- ============================================
-- After running, verify:
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('foncier_attestations', 'foncier_attestation_temoins')
ORDER BY tablename, policyname;

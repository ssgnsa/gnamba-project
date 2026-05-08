-- ============================================
-- Migration: Comprehensive RLS policies for EGS immobilier tables
-- ============================================
-- Date: 2026-04-05
-- Purpose: Replace overly permissive USING (true) with role-based policies
-- ============================================

BEGIN;

-- ============================================
-- HELPER FUNCTION: Get current user's role
-- ============================================
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT role FROM user_profiles WHERE id = auth.uid()),
    'employe'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION: Check if user has finance access
-- ============================================
CREATE OR REPLACE FUNCTION has_finance_access()
RETURNS BOOLEAN AS $$
  SELECT current_user_role() IN ('admin', 'gestionnaire', 'gerant');
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- IMMobilier PROPERTIES
-- ============================================
DROP POLICY IF EXISTS "properties_select" ON properties;
DROP POLICY IF EXISTS "properties_insert" ON properties;
DROP POLICY IF EXISTS "properties_update" ON properties;
DROP POLICY IF EXISTS "properties_delete" ON properties;

CREATE POLICY "properties_select" ON properties
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "properties_insert" ON properties
  FOR INSERT TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'gestionnaire', 'gerant'));

CREATE POLICY "properties_update" ON properties
  FOR UPDATE TO authenticated
  USING (current_user_role() IN ('admin', 'gestionnaire', 'gerant'))
  WITH CHECK (current_user_role() IN ('admin', 'gestionnaire', 'gerant'));

CREATE POLICY "properties_delete" ON properties
  FOR DELETE TO authenticated
  USING (current_user_role() = 'admin');

-- ============================================
-- LOCATAIRES (formerly tenants - renamed to avoid collision)
-- ============================================
DROP POLICY IF EXISTS "locataires_select" ON locataires;
DROP POLICY IF EXISTS "locataires_insert" ON locataires;
DROP POLICY IF EXISTS "locataires_update" ON locataires;
DROP POLICY IF EXISTS "locataires_delete" ON locataires;

CREATE POLICY "locataires_select" ON locataires
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "locataires_insert" ON locataires
  FOR INSERT TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'gestionnaire', 'gerant'));

CREATE POLICY "locataires_update" ON locataires
  FOR UPDATE TO authenticated
  USING (current_user_role() IN ('admin', 'gestionnaire', 'gerant'))
  WITH CHECK (current_user_role() IN ('admin', 'gestionnaire', 'gerant'));

CREATE POLICY "locataires_delete" ON locataires
  FOR DELETE TO authenticated
  USING (current_user_role() = 'admin');

-- ============================================
-- LEASE CONTRACTS
-- ============================================
DROP POLICY IF EXISTS "lease_contracts_select" ON lease_contracts;
DROP POLICY IF EXISTS "lease_contracts_insert" ON lease_contracts;
DROP POLICY IF EXISTS "lease_contracts_update" ON lease_contracts;
DROP POLICY IF EXISTS "lease_contracts_delete" ON lease_contracts;

CREATE POLICY "lease_contracts_select" ON lease_contracts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "lease_contracts_insert" ON lease_contracts
  FOR INSERT TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'gestionnaire', 'gerant'));

CREATE POLICY "lease_contracts_update" ON lease_contracts
  FOR UPDATE TO authenticated
  USING (current_user_role() IN ('admin', 'gestionnaire', 'gerant'))
  WITH CHECK (current_user_role() IN ('admin', 'gestionnaire', 'gerant'));

CREATE POLICY "lease_contracts_delete" ON lease_contracts
  FOR DELETE TO authenticated
  USING (current_user_role() = 'admin');

-- ============================================
-- RENT PAYMENTS
-- ============================================
DROP POLICY IF EXISTS "rent_payments_select" ON rent_payments;
DROP POLICY IF EXISTS "rent_payments_insert" ON rent_payments;
DROP POLICY IF EXISTS "rent_payments_update" ON rent_payments;
DROP POLICY IF EXISTS "rent_payments_delete" ON rent_payments;

CREATE POLICY "rent_payments_select" ON rent_payments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "rent_payments_insert" ON rent_payments
  FOR INSERT TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'gestionnaire', 'gerant'));

CREATE POLICY "rent_payments_update" ON rent_payments
  FOR UPDATE TO authenticated
  USING (current_user_role() IN ('admin', 'gestionnaire', 'gerant'))
  WITH CHECK (current_user_role() IN ('admin', 'gestionnaire', 'gerant'));

CREATE POLICY "rent_payments_delete" ON rent_payments
  FOR DELETE TO authenticated
  USING (current_user_role() = 'admin');

-- ============================================
-- FINANCES (restrictive - only admin/gestionnaire/gerant)
-- ============================================
DROP POLICY IF EXISTS "finances_select" ON finances;
DROP POLICY IF EXISTS "finances_insert" ON finances;
DROP POLICY IF EXISTS "finances_update" ON finances;
DROP POLICY IF EXISTS "finances_delete" ON finances;

CREATE POLICY "finances_select" ON finances
  FOR SELECT TO authenticated
  USING (has_finance_access());

CREATE POLICY "finances_insert" ON finances
  FOR INSERT TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'gestionnaire', 'gerant'));

CREATE POLICY "finances_update" ON finances
  FOR UPDATE TO authenticated
  USING (current_user_role() IN ('admin', 'gestionnaire', 'gerant'))
  WITH CHECK (current_user_role() IN ('admin', 'gestionnaire', 'gerant'));

CREATE POLICY "finances_delete" ON finances
  FOR DELETE TO authenticated
  USING (current_user_role() = 'admin');

COMMIT;

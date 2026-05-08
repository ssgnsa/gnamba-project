-- ============================================
-- Migration: Rename `tenants` → `locataires` in EGS immobilier
-- ============================================
-- Purpose: Eliminate naming collision with SomAgro's multi-tenant `tenants` table
-- Date: 2026-04-05
-- ============================================

BEGIN;

-- 1. Rename the table
ALTER TABLE tenants RENAME TO locataires;

-- 2. Rename the sequence (if auto-generated)
ALTER SEQUENCE IF EXISTS tenants_id_seq RENAME TO locataires_id_seq;

-- 3. Update foreign key references in related tables
-- Check if rent_payments references tenants
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rent_payments' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE rent_payments RENAME COLUMN tenant_id TO locataire_id;
  END IF;
END $$;

-- 4. Update any RLS policies that reference the old table name
-- Drop old policies
DROP POLICY IF EXISTS "tenants_select_auth" ON locataires;
DROP POLICY IF EXISTS "tenants_insert_auth" ON locataires;
DROP POLICY IF EXISTS "tenants_update_auth" ON locataires;
DROP POLICY IF EXISTS "tenants_delete_auth" ON locataires;

-- Recreate policies with new table name
CREATE POLICY "locataires_select_auth" ON locataires
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "locataires_insert_auth" ON locataires
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "locataires_update_auth" ON locataires
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "locataires_delete_auth" ON locataires
  FOR DELETE TO authenticated USING (true);

-- 5. Update indexes
ALTER INDEX IF EXISTS tenants_pkey RENAME TO locataires_pkey;

-- 6. Update any triggers referencing the old table
-- (Check and update if needed)

COMMIT;

-- ============================================
-- Migration: Fix lease_contracts FK after tenants rename + clean up duplicate RLS
-- ============================================
-- Date: 2026-04-05
-- ============================================

BEGIN;

-- ============================================
-- 1. Fix lease_contracts.tenant_id → locataire_id
-- ============================================
-- Drop the old FK constraint (Postgres auto-updates OID but naming is misleading)
ALTER TABLE lease_contracts
  DROP CONSTRAINT IF EXISTS lease_contracts_tenant_id_fkey;

-- Rename column for clarity
ALTER TABLE lease_contracts
  RENAME COLUMN tenant_id TO locataire_id;

-- Recreate FK with correct reference
ALTER TABLE lease_contracts
  ADD CONSTRAINT lease_contracts_locataire_id_fkey
  FOREIGN KEY (locataire_id) REFERENCES locataires(id) ON DELETE SET NULL;

-- Rename index
ALTER INDEX IF EXISTS idx_lease_contracts_tenant_id
  RENAME TO idx_lease_contracts_locataire_id;

-- ============================================
-- 2. Clean up duplicate RLS policies on locataires
-- ============================================
-- Drop policies created by the rename migration (they conflict with comprehensive RLS)
DROP POLICY IF EXISTS "locataires_select_auth" ON locataires;
DROP POLICY IF EXISTS "locataires_insert_auth" ON locataires;
DROP POLICY IF EXISTS "locataires_update_auth" ON locataires;
DROP POLICY IF EXISTS "locataires_delete_auth" ON locataires;

-- Also drop old overly permissive policies from immobilier migration
DROP POLICY IF EXISTS "ten_auth" ON locataires;

-- The comprehensive RLS migration (20260405130000) has the correct policies:
-- locataires_select, locataires_insert, locataires_update, locataires_delete

-- ============================================
-- 3. Fix rent_payments FK: tenant_id → locataire_id
-- ============================================
-- Already renamed by 20260405120000 migration, but verify FK is correct
ALTER TABLE rent_payments
  DROP CONSTRAINT IF EXISTS rent_payments_tenant_id_fkey;

ALTER TABLE rent_payments
  ADD CONSTRAINT rent_payments_locataire_id_fkey
  FOREIGN KEY (locataire_id) REFERENCES locataires(id) ON DELETE SET NULL;

COMMIT;

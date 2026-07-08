/*
  Migration: Unify Immobilier Schema
  Date: 2026-05-12
  Purpose: Consolidate tenants vs locataires tables into single schema
  Action: Migrate locataires data to tenants, update all references
*/

-- ============================================
-- Create unified tenants table structure
-- ============================================

-- Ensure tenants table has all necessary columns
DO $$
BEGIN
  IF to_regclass('public.tenants') IS NULL THEN
    RAISE NOTICE 'Skipping tenants normalization: public.tenants does not exist';
  ELSE
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'tenants'
        AND column_name = 'nom'
    ) THEN
      ALTER TABLE public.tenants ADD COLUMN nom text NOT NULL DEFAULT '';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'tenants'
        AND column_name = 'prenom'
    ) THEN
      ALTER TABLE public.tenants ADD COLUMN prenom text;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'tenants'
        AND column_name = 'telephone'
    ) THEN
      ALTER TABLE public.tenants ADD COLUMN telephone text;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'tenants'
        AND column_name = 'email'
    ) THEN
      ALTER TABLE public.tenants ADD COLUMN email text;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'tenants'
        AND column_name = 'statut'
    ) THEN
      ALTER TABLE public.tenants ADD COLUMN statut text DEFAULT 'actif';
    END IF;
  END IF;
END $$;

-- ============================================
-- Migrate locataires data to tenants if needed
-- ============================================

DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'locataires'
  ) AND to_regclass('public.tenants') IS NOT NULL THEN
    INSERT INTO public.tenants (id, nom, prenom, telephone, email, statut, created_at, updated_at)
    SELECT id, nom, prenom, telephone, email,
           COALESCE(statut, 'actif'), created_at, updated_at
    FROM public.locataires
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- ============================================
-- Update references in lease_contracts
-- ============================================

DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'lease_contracts'
      AND column_name = 'tenant_id'
  ) THEN
    -- Migrate tenant_id to locataire_id
    UPDATE public.lease_contracts
    SET locataire_id = tenant_id
    WHERE tenant_id IS NOT NULL
      AND locataire_id IS NULL;
  END IF;
END $$;

-- ============================================
-- Update references in rent_payments
-- ============================================

DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'rent_payments'
      AND column_name = 'tenant_id'
  ) THEN
    -- Migrate tenant_id to locataire_id
    UPDATE public.rent_payments
    SET locataire_id = tenant_id
    WHERE tenant_id IS NOT NULL
      AND locataire_id IS NULL;
  END IF;
END $$;

-- ============================================
-- Create indexes for reporting queries
-- ============================================

DO $$
BEGIN
  IF to_regclass('public.tenants') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_tenants_statut ON public.tenants(statut)';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_lease_contracts_locataire_id ON public.lease_contracts(locataire_id);
CREATE INDEX IF NOT EXISTS idx_lease_contracts_property_id ON public.lease_contracts(property_id);
CREATE INDEX IF NOT EXISTS idx_lease_contracts_statut ON public.lease_contracts(statut);
CREATE INDEX IF NOT EXISTS idx_rent_payments_locataire_id ON public.rent_payments(locataire_id);
CREATE INDEX IF NOT EXISTS idx_rent_payments_property_id ON public.rent_payments(property_id);
CREATE INDEX IF NOT EXISTS idx_rent_payments_statut ON public.rent_payments(statut);
CREATE INDEX IF NOT EXISTS idx_properties_proprietaire ON public.properties(proprietaire);

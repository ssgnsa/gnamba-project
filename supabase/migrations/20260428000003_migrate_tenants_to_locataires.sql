-- ============================================================
-- Complete fix: Migrate data from tenants to locataires, then fix FKs
-- Date: 2026-04-28
-- Purpose: Migrate data first, then create FKs
-- ============================================================

BEGIN;

-- 1. Create locataires table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'locataires'
  ) THEN
    RAISE NOTICE 'Creating locataires table';
    
    CREATE TABLE IF NOT EXISTS public.locataires (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      nom text NOT NULL,
      prenom text NOT NULL,
      telephone text,
      email text,
      property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
      date_debut_contrat date,
      date_fin_contrat date,
      loyer numeric(12,2) DEFAULT 0,
      depot_garantie numeric(12,2) DEFAULT 0,
      statut text DEFAULT 'actif',
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    
    ALTER TABLE public.locataires ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "locataires_select" ON public.locataires FOR SELECT TO authenticated USING (true);
    CREATE POLICY "locataires_insert" ON public.locataires FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "locataires_update" ON public.locataires FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    CREATE POLICY "locataires_delete" ON public.locataires FOR DELETE TO authenticated USING (true);
    
    RAISE NOTICE 'locataires table created successfully';
  ELSE
    RAISE NOTICE 'locataires table already exists';
  END IF;
END $$;

-- 2. Migrate data from tenants to locataires if tenants exists and locataires is empty
DO $$
DECLARE tenants_count integer;
DECLARE locataires_count integer;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'tenants'
  ) THEN
    -- Check counts
    EXECUTE 'SELECT COUNT(*) FROM tenants' INTO tenants_count;
    EXECUTE 'SELECT COUNT(*) FROM locataires' INTO locataires_count;
    
    RAISE NOTICE 'tenants count: %, locataires count: %', tenants_count, locataires_count;
    
    -- If tenants has data and locataires is empty, migrate
    IF tenants_count > 0 AND locataires_count = 0 THEN
      RAISE NOTICE 'Migrating data from tenants to locataires';
      INSERT INTO locataires (id, nom, prenom, telephone, email, property_id, date_debut_contrat, date_fin_contrat, loyer, depot_garantie, statut, created_at, updated_at)
      SELECT id, nom, prenom, telephone, email, property_id, date_debut_contrat, date_fin_contrat, loyer, depot_garantie, statut, created_at, updated_at
      FROM tenants;
      RAISE NOTICE 'Migrated % rows from tenants to locataires', tenants_count;
    END IF;
  END IF;
END $$;

-- 3. Rename tenant_id to locataire_id in rent_payments if needed
DO $$
DECLARE has_locataire_id boolean;
DECLARE has_tenant_id boolean;
BEGIN
  has_locataire_id := EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'locataire_id'
  );
  has_tenant_id := EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'tenant_id'
  );
  
  IF has_tenant_id AND NOT has_locataire_id THEN
    RAISE NOTICE 'Renaming tenant_id to locataire_id in rent_payments';
    ALTER TABLE public.rent_payments DROP CONSTRAINT IF EXISTS rent_payments_tenant_id_fkey;
    ALTER TABLE public.rent_payments RENAME COLUMN tenant_id TO locataire_id;
  END IF;
END $$;

-- 4. Rename tenant_id to locataire_id in lease_contracts if needed
DO $$
DECLARE has_locataire_id boolean;
DECLARE has_tenant_id boolean;
BEGIN
  has_locataire_id := EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'lease_contracts' AND column_name = 'locataire_id'
  );
  has_tenant_id := EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'lease_contracts' AND column_name = 'tenant_id'
  );
  
  IF has_tenant_id AND NOT has_locataire_id THEN
    RAISE NOTICE 'Renaming tenant_id to locataire_id in lease_contracts';
    ALTER TABLE public.lease_contracts DROP CONSTRAINT IF EXISTS lease_contracts_tenant_id_fkey;
    ALTER TABLE public.lease_contracts RENAME COLUMN tenant_id TO locataire_id;
  END IF;
END $$;

-- 5. Set NULL for orphaned rent_payments (FK will be created after)
DO $$
BEGIN
  RAISE NOTICE 'Setting NULL for orphaned rent_payments.locataire_id';
  UPDATE rent_payments 
  SET locataire_id = NULL 
  WHERE locataire_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM locataires WHERE id = rent_payments.locataire_id);
END $$;

-- 6. Set NULL for orphaned lease_contracts
DO $$
BEGIN
  RAISE NOTICE 'Setting NULL for orphaned lease_contracts.locataire_id';
  UPDATE lease_contracts 
  SET locataire_id = NULL 
  WHERE locataire_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM locataires WHERE id = lease_contracts.locataire_id);
END $$;

-- 7. Create FK for rent_payments
DO $$
DECLARE fk_exists boolean;
BEGIN
  fk_exists := EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'rent_payments_locataire_id_fkey' 
    AND table_schema = 'public' AND table_name = 'rent_payments'
  );
  
  IF NOT fk_exists THEN
    RAISE NOTICE 'Creating FK rent_payments_locataire_id_fkey';
    ALTER TABLE public.rent_payments 
    ADD CONSTRAINT rent_payments_locataire_id_fkey 
    FOREIGN KEY (locataire_id) REFERENCES public.locataires(id) ON DELETE SET NULL;
  ELSE
    RAISE NOTICE 'FK rent_payments_locataire_id_fkey already exists';
  END IF;
END $$;

-- 8. Create FK for lease_contracts
DO $$
DECLARE fk_exists boolean;
BEGIN
  fk_exists := EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'lease_contracts_locataire_id_fkey' 
    AND table_schema = 'public' AND table_name = 'lease_contracts'
  );
  
  IF NOT fk_exists THEN
    RAISE NOTICE 'Creating FK lease_contracts_locataire_id_fkey';
    ALTER TABLE public.lease_contracts 
    ADD CONSTRAINT lease_contracts_locataire_id_fkey 
    FOREIGN KEY (locataire_id) REFERENCES public.locataires(id) ON DELETE CASCADE;
  ELSE
    RAISE NOTICE 'FK lease_contracts_locataire_id_fkey already exists';
  END IF;
END $$;

COMMIT;
-- Rename lease_contracts.tenant_id → locataire_id
DO $$
DECLARE has_t boolean; has_l boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='lease_contracts' AND column_name='tenant_id') INTO has_t;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='lease_contracts' AND column_name='locataire_id') INTO has_l;
  IF has_t AND NOT has_l THEN
    ALTER TABLE public.lease_contracts DROP CONSTRAINT IF EXISTS lease_contracts_tenant_id_fkey;
    ALTER TABLE public.lease_contracts RENAME COLUMN tenant_id TO locataire_id;
    ALTER TABLE public.lease_contracts ADD CONSTRAINT lease_contracts_locataire_id_fkey FOREIGN KEY (locataire_id) REFERENCES public.locataires(id) ON DELETE SET NULL;
    ALTER INDEX IF EXISTS public.idx_lease_contracts_tenant_id RENAME TO idx_lease_contracts_locataire_id;
  END IF;
END $$;

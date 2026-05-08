-- Rename rent_payments.tenant_id → locataire_id
DO $$
DECLARE has_t boolean; has_l boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='rent_payments' AND column_name='tenant_id') INTO has_t;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='rent_payments' AND column_name='locataire_id') INTO has_l;
  IF has_t AND NOT has_l THEN
    ALTER TABLE public.rent_payments DROP CONSTRAINT IF EXISTS rent_payments_tenant_id_fkey;
    ALTER TABLE public.rent_payments RENAME COLUMN tenant_id TO locataire_id;
    ALTER TABLE public.rent_payments ADD CONSTRAINT rent_payments_locataire_id_fkey FOREIGN KEY (locataire_id) REFERENCES public.locataires(id) ON DELETE SET NULL;
  END IF;
END $$;

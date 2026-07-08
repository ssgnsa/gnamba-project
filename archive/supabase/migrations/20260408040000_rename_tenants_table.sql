-- Rename tenants → locataires (idempotent)
DO $$
DECLARE has_t boolean; has_l boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='tenants') INTO has_t;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='locataires') INTO has_l;
  IF has_t AND NOT has_l THEN
    ALTER TABLE public.tenants RENAME TO locataires;
    ALTER SEQUENCE IF EXISTS public.tenants_id_seq RENAME TO locataires_id_seq;
    ALTER INDEX IF EXISTS public.tenants_pkey RENAME TO locataires_pkey;
    ALTER INDEX IF EXISTS public.idx_tenants_telephone RENAME TO idx_locataires_telephone;
    ALTER INDEX IF EXISTS public.idx_tenants_email RENAME TO idx_locataires_email;
    ALTER INDEX IF EXISTS public.idx_tenants_statut RENAME TO idx_locataires_statut;
    ALTER INDEX IF EXISTS public.idx_tenants_nom RENAME TO idx_locataires_nom;
    ALTER INDEX IF EXISTS public.idx_tenants_property_id RENAME TO idx_locataires_property_id;
  END IF;
END $$;

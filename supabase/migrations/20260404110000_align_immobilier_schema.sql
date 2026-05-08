/*
  Migration: Align Immobilier Schema With Frontend
  Date: 2026-04-04
  Purpose: Bring immobilier tables in sync with the columns actively used by the frontend
*/

-- ============================================
-- properties
-- ============================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'properties'
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.properties ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- ============================================
-- tenants
-- ============================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tenants'
      AND column_name = 'property_id'
  ) THEN
    ALTER TABLE public.tenants
      ADD COLUMN property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tenants'
      AND column_name = 'date_debut_contrat'
  ) THEN
    ALTER TABLE public.tenants ADD COLUMN date_debut_contrat date;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tenants'
      AND column_name = 'date_fin_contrat'
  ) THEN
    ALTER TABLE public.tenants ADD COLUMN date_fin_contrat date;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tenants'
      AND column_name = 'loyer'
  ) THEN
    ALTER TABLE public.tenants ADD COLUMN loyer numeric(12,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tenants'
      AND column_name = 'depot_garantie'
  ) THEN
    ALTER TABLE public.tenants ADD COLUMN depot_garantie numeric(12,2) DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tenants_property_id ON public.tenants(property_id);

-- ============================================
-- lease_contracts
-- ============================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'lease_contracts'
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.lease_contracts ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- ============================================
-- rent_payments
-- ============================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'rent_payments'
      AND column_name = 'date_echeance'
  ) THEN
    ALTER TABLE public.rent_payments ADD COLUMN date_echeance date;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'rent_payments'
      AND column_name = 'date_paiement_effectif'
  ) THEN
    ALTER TABLE public.rent_payments ADD COLUMN date_paiement_effectif date;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'rent_payments'
      AND column_name = 'mois_concerne_date'
  ) THEN
    ALTER TABLE public.rent_payments ADD COLUMN mois_concerne_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'rent_payments'
      AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.rent_payments ADD COLUMN notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'rent_payments'
      AND column_name = 'last_document_type'
  ) THEN
    ALTER TABLE public.rent_payments ADD COLUMN last_document_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'rent_payments'
      AND column_name = 'last_document_at'
  ) THEN
    ALTER TABLE public.rent_payments ADD COLUMN last_document_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'rent_payments'
      AND column_name = 'last_document_by'
  ) THEN
    ALTER TABLE public.rent_payments ADD COLUMN last_document_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_rent_payments_date_echeance ON public.rent_payments(date_echeance);
CREATE INDEX IF NOT EXISTS idx_rent_payments_mois_concerne_date ON public.rent_payments(mois_concerne_date);

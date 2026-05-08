/*
  Migration: Allow attestation reference reuse when archived
  Date: 2026-04-01
  Purpose: Support re-issuance (cession) with same reference/code-barre while archiving old attestation
*/

-- Ensure deleted_at exists (required for partial unique index)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'foncier_attestations'
      AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE public.foncier_attestations
    ADD COLUMN deleted_at timestamptz;
    RAISE NOTICE 'Added column deleted_at to foncier_attestations';
  END IF;
END $$;

-- Drop old UNIQUE constraint on reference if present
DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'foncier_attestations'
      AND c.contype = 'u'
      AND c.conname = 'foncier_attestations_reference_key'
  ) THEN
    EXECUTE 'ALTER TABLE public.foncier_attestations DROP CONSTRAINT foncier_attestations_reference_key';
  END IF;
END $$;

-- Drop legacy unique indexes if any
DROP INDEX IF EXISTS public.idx_foncier_attestations_reference_unique;
DROP INDEX IF EXISTS public.idx_foncier_attestations_reference;

-- Create unique index only for active (non-archived) attestations
DO $$
DECLARE
  v_has_duplicates boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.foncier_attestations
    WHERE deleted_at IS NULL
    GROUP BY reference
    HAVING COUNT(*) > 1
  ) INTO v_has_duplicates;

  IF v_has_duplicates THEN
    RAISE NOTICE 'Duplicates detected in active attestations; unique index not created.';
  ELSE
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_foncier_attestations_reference_active ON public.foncier_attestations(reference) WHERE deleted_at IS NULL';
  END IF;
END $$;

-- Helpful index for active attestations by lot
CREATE INDEX IF NOT EXISTS idx_foncier_attestations_lot_active
  ON public.foncier_attestations(lot_id, created_at DESC)
  WHERE deleted_at IS NULL;


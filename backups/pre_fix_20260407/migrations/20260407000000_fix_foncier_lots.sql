-- Fix #4: Add deleted_at to foncier_lots
-- This is the only thing that needs to run on this migration

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'foncier_lots' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE public.foncier_lots ADD COLUMN deleted_at timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_foncier_lots_deleted_at
  ON public.foncier_lots(deleted_at) WHERE deleted_at IS NOT NULL;

-- ============================================
-- Migration: Phase 2 - Foncier village normalization
-- Date: 2026-06-09
-- Purpose:
--   - add a normalized village foreign key to foncier_lots
--   - backfill existing rows from the legacy text field
--   - keep legacy village text compatible for the current frontend
-- ============================================


-- ============================================
-- 1. Add normalized village reference
-- ============================================
ALTER TABLE public.foncier_lots
  ADD COLUMN IF NOT EXISTS village_id UUID;

COMMENT ON COLUMN public.foncier_lots.village_id IS
  'Normalized village reference for the transitional Foncier schema';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'foncier_lots_village_id_fkey'
      AND conrelid = 'public.foncier_lots'::regclass
  ) THEN
    ALTER TABLE public.foncier_lots
      ADD CONSTRAINT foncier_lots_village_id_fkey
      FOREIGN KEY (village_id)
      REFERENCES public.foncier_villages(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_foncier_lots_village_id
  ON public.foncier_lots(village_id);

-- ============================================
-- 2. Backfill village_id from the legacy text field
-- ============================================
WITH matched_villages AS (
  SELECT
    fl.id AS lot_id,
    fv.id AS village_id,
    fv.nom AS village_nom
  FROM public.foncier_lots fl
  JOIN public.foncier_villages fv
    ON upper(btrim(fv.nom)) = upper(btrim(fl.village))
    OR upper(btrim(fv.code)) = upper(btrim(fl.village))
    OR lower(btrim(fv.id::text)) = lower(btrim(fl.village))
  WHERE fl.village_id IS NULL
    AND fl.village IS NOT NULL
    AND btrim(fl.village) <> ''
)
UPDATE public.foncier_lots fl
SET
  village_id = matched_villages.village_id,
  village = matched_villages.village_nom
FROM matched_villages
WHERE fl.id = matched_villages.lot_id;

-- ============================================
-- 3. Transitional trigger to keep both columns aligned
-- ============================================
CREATE OR REPLACE FUNCTION public.sync_foncier_lot_village()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  resolved_village_id UUID;
  resolved_village_nom TEXT;
BEGIN
  IF NEW.village_id IS NOT NULL THEN
    SELECT fv.nom
    INTO resolved_village_nom
    FROM public.foncier_villages fv
    WHERE fv.id = NEW.village_id;

    IF resolved_village_nom IS NULL THEN
      RAISE EXCEPTION 'Village introuvable pour village_id=%', NEW.village_id
        USING ERRCODE = '23503';
    END IF;

    NEW.village := resolved_village_nom;
    RETURN NEW;
  END IF;

  IF NEW.village IS NOT NULL AND btrim(NEW.village) <> '' THEN
    SELECT
      fv.id,
      fv.nom
    INTO resolved_village_id, resolved_village_nom
    FROM public.foncier_villages fv
    WHERE upper(btrim(fv.nom)) = upper(btrim(NEW.village))
       OR upper(btrim(fv.code)) = upper(btrim(NEW.village))
       OR lower(btrim(fv.id::text)) = lower(btrim(NEW.village))
    ORDER BY
      CASE
        WHEN upper(btrim(fv.nom)) = upper(btrim(NEW.village)) THEN 1
        WHEN upper(btrim(fv.code)) = upper(btrim(NEW.village)) THEN 2
        ELSE 3
      END
    LIMIT 1;

    IF resolved_village_id IS NOT NULL THEN
      NEW.village_id := resolved_village_id;
      NEW.village := resolved_village_nom;
    ELSE
      NEW.village := btrim(NEW.village);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_foncier_lot_village ON public.foncier_lots;

CREATE TRIGGER trg_sync_foncier_lot_village
  BEFORE INSERT OR UPDATE OF village, village_id
  ON public.foncier_lots
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_foncier_lot_village();


/*
  Migration: Fix Unique Constraint for Land Parcels
  Date: 2026-03-30
  Purpose: Prevent duplicate land parcels (lot + numero_ilot + village + lotissement)
           and ensure attestation reference uniqueness
  
  CRITICAL: This migration must be run after creating the foncier_attestations tables.
*/

-- Step 1: Rebuild unique index with COALESCE to handle NULL values
-- This ensures (Lot 25, NULL, Sikensi) and (Lot 25, NULL, Sikensi) are detected as duplicates
-- Aligns with UI + RPC which use numero_ilot (not ilot)
DO $$
DECLARE
  v_has_duplicates boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.foncier_lots
    WHERE deleted_at IS NULL AND statut NOT IN ('annule')
    GROUP BY numero_lot, COALESCE(numero_ilot, ''), village, nom_lotissement
    HAVING COUNT(*) > 1
  ) INTO v_has_duplicates;

  IF v_has_duplicates THEN
    RAISE NOTICE 'Duplicates detected in foncier_lots; unique index not rebuilt.';
  ELSE
    EXECUTE 'DROP INDEX IF EXISTS idx_foncier_lots_unique_location';
    EXECUTE 'CREATE UNIQUE INDEX idx_foncier_lots_unique_location ON public.foncier_lots (numero_lot, COALESCE(numero_ilot, ''''), village, nom_lotissement) WHERE deleted_at IS NULL AND statut NOT IN (''annule'')';
    EXECUTE 'COMMENT ON INDEX public.idx_foncier_lots_unique_location IS ''Prevents duplicate land parcels - CRITICAL for legal land management''';
  END IF;
END $$;

-- Step 2: Create supporting index for fast duplicate checks
CREATE INDEX IF NOT EXISTS idx_foncier_lots_active_search
ON foncier_lots (village, nom_lotissement, numero_ilot, numero_lot)
WHERE deleted_at IS NULL;

-- Step 3: Add database function for duplicate check (used by frontend)
CREATE OR REPLACE FUNCTION check_foncier_duplicate(
  p_village text,
  p_lotissement text,
  p_ilot text,
  p_lot text,
  p_exclude_lot_id uuid DEFAULT NULL
)
RETURNS TABLE (is_duplicate boolean, existing_lot_id uuid, existing_reference text) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    true as is_duplicate,
    fl.id as existing_lot_id,
    fl.reference as existing_reference
  FROM foncier_lots fl
  WHERE fl.village = p_village
    AND fl.nom_lotissement = p_lotissement
    AND COALESCE(fl.numero_ilot, '') = COALESCE(p_ilot, '')
    AND fl.numero_lot = p_lot
    AND fl.deleted_at IS NULL
    AND fl.statut NOT IN ('annule')
    AND (p_exclude_lot_id IS NULL OR fl.id != p_exclude_lot_id)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION check_foncier_duplicate TO authenticated;

-- Add comment
COMMENT ON FUNCTION check_foncier_duplicate IS 
  'Check for duplicate land parcel before creation/update';

-- Step 4: Ensure unique reference on foncier_attestations (safe, idempotent)
DO $$
DECLARE
  v_has_unique boolean;
  v_has_duplicates boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
    WHERE n.nspname = 'public'
      AND t.relname = 'foncier_attestations'
      AND c.contype = 'u'
      AND a.attname = 'reference'
  ) INTO v_has_unique;

  IF NOT v_has_unique THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.foncier_attestations
      GROUP BY reference
      HAVING COUNT(*) > 1
    ) INTO v_has_duplicates;

    IF v_has_duplicates THEN
      RAISE NOTICE 'Duplicates detected in foncier_attestations.reference; unique index not created.';
    ELSE
      EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_foncier_attestations_reference_unique ON public.foncier_attestations(reference)';

      IF EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname = 'idx_foncier_attestations_reference_unique'
      ) THEN
        EXECUTE 'DROP INDEX IF EXISTS idx_foncier_attestations_reference';
      END IF;
    END IF;
  END IF;
END $$;

-- ============================================
-- END OF MIGRATION
-- ============================================

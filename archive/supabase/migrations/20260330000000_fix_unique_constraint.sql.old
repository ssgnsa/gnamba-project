/*
  Migration: Fix Unique Constraint for Land Parcels (ROBUST)
  Date: 2026-03-30
  Purpose: Prevent duplicate land parcels with safe checks
*/

DO $$
DECLARE
  v_column_exists boolean;
  v_table_exists boolean;
BEGIN
  -- Vérifier si la table existe
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'foncier_lots'
  ) INTO v_table_exists;

  IF NOT v_table_exists THEN
    RAISE NOTICE 'Table foncier_lots does not exist. Skipping migration.';
    RETURN;
  END IF;

  -- Vérifier si la colonne deleted_at existe
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'foncier_lots' 
      AND column_name = 'deleted_at'
  ) INTO v_column_exists;

  -- Créer l'index UNIQUEMENT si la colonne existe
  IF v_column_exists THEN
    -- Supprimer l'index s'il existe
    DROP INDEX IF EXISTS idx_foncier_lots_unique_location;
    
    -- Créer l'index avec la condition
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_foncier_lots_unique_location 
      ON public.foncier_lots (numero_lot, COALESCE(numero_ilot, ''''), village, nom_lotissement) 
      WHERE deleted_at IS NULL AND statut NOT IN (''annule'')';
    
    -- Ajouter le commentaire
    COMMENT ON INDEX public.idx_foncier_lots_unique_location IS 
      'Prevents duplicate land parcels - CRITICAL for legal land management';
    
    RAISE NOTICE 'Index idx_foncier_lots_unique_location created successfully.';
  ELSE
    RAISE NOTICE 'Column deleted_at does not exist. Index creation postponed.';
  END IF;
END $$;

-- Créer l'index de recherche (si la colonne existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'foncier_lots' 
      AND column_name = 'deleted_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_foncier_lots_active_search
    ON foncier_lots (village, nom_lotissement, numero_ilot, numero_lot)
    WHERE deleted_at IS NULL;
  END IF;
END $$;

-- Fonction de vérification de doublons (sécurisée)
CREATE OR REPLACE FUNCTION check_foncier_duplicate(
  p_village text,
  p_lotissement text,
  p_ilot text,
  p_lot text,
  p_exclude_lot_id uuid DEFAULT NULL
)
RETURNS TABLE (is_duplicate boolean, existing_lot_id uuid, existing_reference text) 
LANGUAGE plpgsql SECURITY DEFINER AS $$
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
    AND (fl.deleted_at IS NULL OR fl.deleted_at IS NOT NULL)  -- Gère NULL
    AND fl.statut NOT IN ('annule')
    AND (p_exclude_lot_id IS NULL OR fl.id != p_exclude_lot_id)
  LIMIT 1;
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION check_foncier_duplicate TO authenticated;

-- Commentaire
COMMENT ON FUNCTION check_foncier_duplicate IS 
  'Check for duplicate land parcel before creation/update (safe version)';

-- Index unique pour les attestations (si la table existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'foncier_attestations'
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_foncier_attestations_reference_unique 
    ON public.foncier_attestations(reference);
    
    RAISE NOTICE 'Index for foncier_attestations created.';
  ELSE
    RAISE NOTICE 'Table foncier_attestations does not exist. Index creation postponed.';
  END IF;
END $$;

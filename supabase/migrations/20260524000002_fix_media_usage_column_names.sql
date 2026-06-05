-- ============================================================
-- CORRECTIF : Harmoniser media_usage si anciens noms de colonnes
-- présents suite à la migration drop_village_logo_registry
-- (qui utilisait 'slot' et 'media_file_id' au lieu de
--  'usage_type' et 'media_id')
--
-- Idempotent : vérifie l'existence des colonnes avant d'agir.
-- ============================================================

DO $$
BEGIN
  -- Renommer 'slot' → 'usage_type' si la colonne s'appelle encore 'slot'
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'media_usage'
      AND column_name  = 'slot'
  ) THEN
    ALTER TABLE public.media_usage RENAME COLUMN slot TO usage_type;
    RAISE NOTICE 'media_usage.slot renommé en usage_type';
  ELSE
    RAISE NOTICE 'media_usage.usage_type déjà correct, rien à faire';
  END IF;

  -- Renommer 'media_file_id' → 'media_id' si l'ancien nom est encore présent
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'media_usage'
      AND column_name  = 'media_file_id'
  ) THEN
    ALTER TABLE public.media_usage RENAME COLUMN media_file_id TO media_id;
    RAISE NOTICE 'media_usage.media_file_id renommé en media_id';
  ELSE
    RAISE NOTICE 'media_usage.media_id déjà correct, rien à faire';
  END IF;
END $$;

-- S'assurer que la contrainte UNIQUE est sur les bons noms de colonnes
-- (recrée l'index si absent après renommage)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.media_usage'::regclass
      AND contype  = 'u'
      AND conname  = 'media_usage_entity_type_entity_id_usage_type_key'
  ) THEN
    ALTER TABLE public.media_usage
      ADD CONSTRAINT media_usage_entity_type_entity_id_usage_type_key
      UNIQUE (entity_type, entity_id, usage_type);
    RAISE NOTICE 'Contrainte UNIQUE (entity_type, entity_id, usage_type) ajoutée';
  END IF;
END $$;

-- S'assurer que usage_type a une valeur NOT NULL par défaut
ALTER TABLE public.media_usage
  ALTER COLUMN usage_type SET NOT NULL,
  ALTER COLUMN usage_type SET DEFAULT '';

-- Recréer l'index si besoin
CREATE INDEX IF NOT EXISTS idx_media_usage_entity
  ON public.media_usage (entity_type, entity_id, usage_type);

-- Vérification finale
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'media_usage'
ORDER BY ordinal_position;

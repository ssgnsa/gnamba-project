-- Migration : Suppression de village_logo_registry (table redondante avec media_usage)
-- Les logos de villages sont désormais gérés via :
--   - bucket  : media (storage)
--   - table   : media_files  (métadonnées)
--   - liaison : media_usage  (entity_type='foncier_village', slot='logo')
--
-- Avant de supprimer, on copie les données existantes vers media_files + media_usage
-- pour ne pas perdre les logos déjà enregistrés.

DO $$
DECLARE
  r RECORD;
  media_id UUID;
BEGIN
  -- Vérifier que la table existe avant de migrer
  IF NOT EXISTS (
    SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'village_logo_registry'
  ) THEN
    RAISE NOTICE 'village_logo_registry does not exist, skipping migration.';
    RETURN;
  END IF;

  FOR r IN SELECT * FROM public.village_logo_registry LOOP
    -- Insérer dans media_files si l'URL n'y est pas déjà
    IF NOT EXISTS (SELECT 1 FROM public.media_files WHERE url = r.logo_url) THEN
      INSERT INTO public.media_files (
        id, filename, original_name, url, category,
        uploaded_by, size, type, alt_text, description, tags, created_at
      )
      VALUES (
        gen_random_uuid(),
        'village-logo-' || lower(regexp_replace(r.village_name, '\s+', '-', 'g')),
        'logo-' || r.village_name,
        r.logo_url,
        'foncier_villages',
        r.created_by,
        0,
        'image/png',
        'Logo ' || r.village_name,
        '',
        '{}',
        COALESCE(r.created_at, now())
      )
      RETURNING id INTO media_id;
    ELSE
      SELECT id INTO media_id FROM public.media_files WHERE url = r.logo_url LIMIT 1;
    END IF;

    -- Insérer dans media_usage si pas déjà présent
    IF media_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.media_usage
      WHERE entity_type = 'foncier_village'
        AND entity_id   = r.village_name
        AND usage_type = 'logo'
    ) THEN
      INSERT INTO public.media_usage (media_id, entity_type, entity_id, usage_type, label)
      VALUES (media_id, 'foncier_village', r.village_name, 'logo', 'Logo — ' || r.village_name);
    END IF;
  END LOOP;

  RAISE NOTICE 'Migration village_logo_registry → media_usage terminée.';
END $$;

-- Supprimer les politiques RLS
DROP POLICY IF EXISTS "Village logos are publicly viewable"        ON village_logo_registry;
DROP POLICY IF EXISTS "Authenticated users can insert village logos" ON village_logo_registry;
DROP POLICY IF EXISTS "Users can update their own village logos"   ON village_logo_registry;
DROP POLICY IF EXISTS "Users can delete their own village logos"   ON village_logo_registry;
DROP POLICY IF EXISTS "Anyone can view village logos"              ON village_logo_registry;

-- Supprimer la table
DROP TABLE IF EXISTS public.village_logo_registry CASCADE;

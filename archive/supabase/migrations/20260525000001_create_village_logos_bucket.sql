-- ============================================================
-- MIGRATION : Création du bucket "village-logos" public
--
-- Ce bucket stocke les logos officiels des villages fonciers.
-- Il doit être public pour que les images s'affichent dans
-- les attestations sans authentification.
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'storage' AND table_name = 'buckets' AND column_name = 'public'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'village-logos', 'village-logos', true, 5242880,
      ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml']
    )
    ON CONFLICT (id) DO UPDATE SET
      public             = true,
      file_size_limit    = 5242880,
      allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml'];
  ELSE
    INSERT INTO storage.buckets (id, name)
    VALUES ('village-logos', 'village-logos')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Nettoyage policies existantes
DROP POLICY IF EXISTS "village_logos_select_public"  ON storage.objects;
DROP POLICY IF EXISTS "village_logos_insert_auth"    ON storage.objects;
DROP POLICY IF EXISTS "village_logos_update_auth"    ON storage.objects;
DROP POLICY IF EXISTS "village_logos_delete_auth"    ON storage.objects;

-- SELECT : public
CREATE POLICY "village_logos_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'village-logos');

-- INSERT : authentifié seulement
CREATE POLICY "village_logos_insert_auth"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'village-logos' AND auth.role() = 'authenticated');

-- UPDATE : authentifié seulement
CREATE POLICY "village_logos_update_auth"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'village-logos' AND auth.role() = 'authenticated')
  WITH CHECK (bucket_id = 'village-logos' AND auth.role() = 'authenticated');

-- DELETE : authentifié seulement
CREATE POLICY "village_logos_delete_auth"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'village-logos' AND auth.role() = 'authenticated');

SELECT id, name, public FROM storage.buckets WHERE id = 'village-logos';

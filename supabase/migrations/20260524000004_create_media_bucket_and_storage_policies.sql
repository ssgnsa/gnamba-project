-- ============================================================
-- MIGRATION : Création du bucket "media" + policies Storage correctes
--
-- Problème résolu :
--   1. Le bucket "media" n'était pas versionné (créé manuellement)
--   2. La policy "Storage bucket access" (20260511110000) bloquait
--      le SELECT public → images invisibles sur le site vitrine
--
-- Bucket : public = true, limite 10 MB, types image/* + PDF
-- Policies :
--   - SELECT public (anon + authenticated) → images visibles partout
--   - INSERT/UPDATE/DELETE authenticated seulement
-- ============================================================

-- Créer le bucket "media" s'il n'existe pas
-- Compatible Supabase local (sans colonnes public/file_size_limit) et cloud
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'storage' AND table_name = 'buckets' AND column_name = 'public'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'media', 'media', true, 10485760,
      ARRAY['image/jpeg','image/png','image/webp','image/gif','application/pdf']
    )
    ON CONFLICT (id) DO UPDATE SET
      public             = true,
      file_size_limit    = 10485760,
      allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif','application/pdf'];
  ELSE
    INSERT INTO storage.buckets (id, name)
    VALUES ('media', 'media')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- ── Nettoyage des anciennes policies conflictuelles ──────────
DROP POLICY IF EXISTS "Storage bucket access"                     ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to access storage" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to public media"        ON storage.objects;
DROP POLICY IF EXISTS "media_storage_select_public"               ON storage.objects;
DROP POLICY IF EXISTS "media_storage_insert_auth"                 ON storage.objects;
DROP POLICY IF EXISTS "media_storage_update_auth"                 ON storage.objects;
DROP POLICY IF EXISTS "media_storage_delete_auth"                 ON storage.objects;

-- ── Nouvelles policies correctes ─────────────────────────────

-- SELECT : public (bucket public → lisible sans authentification)
-- Nécessaire pour que les images s'affichent sur le site vitrine
CREATE POLICY "media_storage_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

-- INSERT : authentifié seulement
CREATE POLICY "media_storage_insert_auth"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

-- UPDATE : authentifié seulement
CREATE POLICY "media_storage_update_auth"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'media' AND auth.role() = 'authenticated')
  WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

-- DELETE : authentifié seulement
CREATE POLICY "media_storage_delete_auth"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'media' AND auth.role() = 'authenticated');

-- Vérification
SELECT id, name FROM storage.buckets WHERE id = 'media';

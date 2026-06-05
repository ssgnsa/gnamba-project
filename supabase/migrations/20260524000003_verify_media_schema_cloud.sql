-- ============================================================
-- SCRIPT DE VÉRIFICATION — À exécuter dans Supabase SQL Editor
-- Vérifie l'état réel du schéma media sur la DB CLOUD
-- ============================================================

-- 1. Colonnes de media_files
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'media_files'
ORDER BY ordinal_position;

-- 2. Colonnes de media_usage
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'media_usage'
ORDER BY ordinal_position;

-- 3. Logos villages assignés (doit retourner des lignes si logos uploadés)
SELECT mu.entity_id AS village, mf.url, mf.original_name, mf.deleted_at
FROM public.media_usage mu
JOIN public.media_files mf ON mf.id = mu.media_id
WHERE mu.entity_type = 'foncier_village'
  AND mu.usage_type  = 'logo'
  AND mf.deleted_at IS NULL;

-- 4. Tous les fichiers catégorie foncier_villages (actifs)
SELECT id, original_name, url, upload_date
FROM public.media_files
WHERE category   = 'foncier_villages'
  AND deleted_at IS NULL
ORDER BY upload_date DESC;

-- 5. Politique RLS active sur media_usage
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'media_usage';

-- 6. Bucket "media" : public ? taille limite ? MIME types ?
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'media';

-- 7. Policies Storage sur le bucket media
SELECT policyname, definition
FROM storage.policies
WHERE bucket_id = 'media';

-- 8. Nombre de fichiers dans storage.objects vs media_files
SELECT
  (SELECT COUNT(*) FROM storage.objects   WHERE bucket_id = 'media') AS storage_count,
  (SELECT COUNT(*) FROM public.media_files WHERE deleted_at IS NULL) AS db_active_count,
  (SELECT COUNT(*) FROM public.media_files WHERE deleted_at IS NOT NULL) AS db_trashed_count;

-- 9. Orphelins DB : media_files sans objet Storage correspondant
SELECT mf.id, mf.filename, mf.url
FROM public.media_files mf
LEFT JOIN storage.objects so ON so.name = mf.filename AND so.bucket_id = 'media'
WHERE so.name IS NULL
  AND mf.deleted_at IS NULL
LIMIT 20;

-- 10. media_usage pointant vers médias supprimés ou inexistants
SELECT mu.id, mu.entity_type, mu.entity_id, mu.usage_type
FROM public.media_usage mu
LEFT JOIN public.media_files mf ON mf.id = mu.media_id
WHERE mf.id IS NULL OR mf.deleted_at IS NOT NULL;

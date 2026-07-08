-- ============================================================
-- SCRIPT CONSOLIDÉ — À EXÉCUTER DANS SUPABASE SQL EDITOR
-- https://supabase.com/dashboard/project/thykrnoqgylrbfupophs/sql/new
--
-- Applique toutes les migrations media manquantes :
--   20260521100000  drop_village_logo_registry
--   20260521110000  media_center_improvements (soft delete, thumbnail)
--   20260521120000  media_audit_logs
--   20260521130000  media_dimensions (width/height)
--   20260524000001  create_media_tables_reference (schéma complet)
--   20260524000002  fix_media_usage_column_names
--   20260524000004  create_media_bucket_and_storage_policies
--   20260524000005  media_files_compat_columns
-- ============================================================

-- ── 1. S'assurer que media_files a TOUTES les colonnes ────────

ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS url             TEXT NOT NULL DEFAULT '';
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS original_name   TEXT NOT NULL DEFAULT '';
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS category        TEXT NOT NULL DEFAULT 'autre';
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS type            TEXT NOT NULL DEFAULT '';
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS size            BIGINT NOT NULL DEFAULT 0;
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS alt_text        TEXT NOT NULL DEFAULT '';
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS description     TEXT NOT NULL DEFAULT '';
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS tags            TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS is_brand_asset  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS brand_asset_type TEXT DEFAULT NULL;
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS uploaded_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS upload_date     TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS deleted_at      TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS deleted_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS thumbnail_url   TEXT DEFAULT NULL;
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS width           INTEGER DEFAULT NULL;
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS height          INTEGER DEFAULT NULL;
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS created_at      TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ NOT NULL DEFAULT now();

-- ── 2. RLS media_files (remplace les anciennes politiques) ────

ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "media_files_select"  ON public.media_files;
DROP POLICY IF EXISTS "media_files_insert"  ON public.media_files;
DROP POLICY IF EXISTS "media_files_update"  ON public.media_files;
DROP POLICY IF EXISTS "media_files_delete"  ON public.media_files;
-- Anciennes politiques avec noms différents
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.media_files;
DROP POLICY IF EXISTS "Enable insert for authenticated users"      ON public.media_files;
DROP POLICY IF EXISTS "Enable update for authenticated users"      ON public.media_files;
DROP POLICY IF EXISTS "Enable delete for authenticated users"      ON public.media_files;
DROP POLICY IF EXISTS "Allow authenticated users to read media"    ON public.media_files;
DROP POLICY IF EXISTS "Allow authenticated users to insert media"  ON public.media_files;

CREATE POLICY "media_files_select" ON public.media_files
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "media_files_insert" ON public.media_files
  FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "media_files_update" ON public.media_files
  FOR UPDATE TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "media_files_delete" ON public.media_files
  FOR DELETE TO authenticated USING (auth.role() = 'authenticated');

-- ── 3. Indexes ────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_media_files_deleted_at
  ON public.media_files (deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_media_files_category_active
  ON public.media_files (category, upload_date DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_media_files_brand_asset
  ON public.media_files (brand_asset_type) WHERE is_brand_asset = true;

-- ── 4. media_usage : corriger les noms de colonnes ────────────

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'media_usage' AND column_name = 'slot'
  ) THEN
    ALTER TABLE public.media_usage RENAME COLUMN slot TO usage_type;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'media_usage' AND column_name = 'media_file_id'
  ) THEN
    ALTER TABLE public.media_usage RENAME COLUMN media_file_id TO media_id;
  END IF;
END $$;

-- S'assurer que media_usage existe avec le bon schéma
CREATE TABLE IF NOT EXISTS public.media_usage (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id    UUID NOT NULL REFERENCES public.media_files(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id   TEXT DEFAULT NULL,
  usage_type  TEXT NOT NULL DEFAULT '',
  label       TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.media_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "media_usage_select" ON public.media_usage;
DROP POLICY IF EXISTS "media_usage_insert" ON public.media_usage;
DROP POLICY IF EXISTS "media_usage_update" ON public.media_usage;
DROP POLICY IF EXISTS "media_usage_delete" ON public.media_usage;

CREATE POLICY "media_usage_select" ON public.media_usage FOR SELECT TO authenticated USING (true);
CREATE POLICY "media_usage_insert" ON public.media_usage FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "media_usage_update" ON public.media_usage FOR UPDATE TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "media_usage_delete" ON public.media_usage FOR DELETE TO authenticated USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_media_usage_media_id ON public.media_usage (media_id);
CREATE INDEX IF NOT EXISTS idx_media_usage_entity   ON public.media_usage (entity_type, entity_id, usage_type);

-- ── 5. media_audit_logs ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.media_audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id   UUID REFERENCES public.media_files(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  actor_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata   JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.media_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "media_audit_logs_select" ON public.media_audit_logs;
DROP POLICY IF EXISTS "media_audit_logs_insert" ON public.media_audit_logs;

CREATE POLICY "media_audit_logs_select" ON public.media_audit_logs
  FOR SELECT TO authenticated USING (auth.role() = 'authenticated');

CREATE POLICY "media_audit_logs_insert" ON public.media_audit_logs
  FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_media_audit_logs_media_id   ON public.media_audit_logs (media_id);
CREATE INDEX IF NOT EXISTS idx_media_audit_logs_actor_id   ON public.media_audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_media_audit_logs_created_at ON public.media_audit_logs (created_at DESC);

-- ── 6. Bucket "media" : public, 10 MB, images + PDF ──────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media', 'media', true, 10485760,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public             = true,
  file_size_limit    = 10485760,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif','application/pdf'];

-- ── 7. Storage policies (bucket media) ───────────────────────

DROP POLICY IF EXISTS "Storage bucket access"                       ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to access storage" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to public media"          ON storage.objects;
DROP POLICY IF EXISTS "media_storage_select_public"                 ON storage.objects;
DROP POLICY IF EXISTS "media_storage_insert_auth"                   ON storage.objects;
DROP POLICY IF EXISTS "media_storage_update_auth"                   ON storage.objects;
DROP POLICY IF EXISTS "media_storage_delete_auth"                   ON storage.objects;

-- SELECT public (images visibles sans auth)
CREATE POLICY "media_storage_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

-- INSERT authentifié
CREATE POLICY "media_storage_insert_auth"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

-- UPDATE authentifié
CREATE POLICY "media_storage_update_auth"
  ON storage.objects FOR UPDATE
  USING  (bucket_id = 'media' AND auth.role() = 'authenticated')
  WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

-- DELETE authentifié
CREATE POLICY "media_storage_delete_auth"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'media' AND auth.role() = 'authenticated');

-- ── 8. Synchronisation rétroactive (ancien schéma → nouveau) ──

-- public_url → url
UPDATE public.media_files
SET url = public_url
WHERE (url IS NULL OR url = '')
  AND public_url IS NOT NULL AND public_url <> ''
  AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='media_files' AND column_name='public_url'
  );

-- mime_type → type
UPDATE public.media_files
SET type = mime_type
WHERE (type IS NULL OR type = '')
  AND mime_type IS NOT NULL AND mime_type <> ''
  AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='media_files' AND column_name='mime_type'
  );

-- size_bytes → size
UPDATE public.media_files
SET size = size_bytes
WHERE (size IS NULL OR size = 0)
  AND size_bytes IS NOT NULL AND size_bytes > 0
  AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='media_files' AND column_name='size_bytes'
  );

-- filename → original_name
UPDATE public.media_files
SET original_name = filename
WHERE (original_name IS NULL OR original_name = '')
  AND filename IS NOT NULL AND filename <> '';

-- ── 9. VÉRIFICATION FINALE ────────────────────────────────────

SELECT
  'media_files colonnes'                        AS check_name,
  COUNT(*) FILTER (WHERE url <> '')             AS with_url,
  COUNT(*) FILTER (WHERE url = '' OR url IS NULL) AS without_url,
  COUNT(*) FILTER (WHERE deleted_at IS NULL)    AS active,
  COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) AS trashed
FROM public.media_files;

SELECT 'bucket' AS check_name, id, name, public
FROM storage.buckets WHERE id = 'media';

SELECT 'storage_objects' AS check_name, COUNT(*) AS total
FROM storage.objects WHERE bucket_id = 'media';

SELECT 'rls_policies' AS check_name, policyname, cmd
FROM pg_policies WHERE tablename = 'media_files' ORDER BY cmd;

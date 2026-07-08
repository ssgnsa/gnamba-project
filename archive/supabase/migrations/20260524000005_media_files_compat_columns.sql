-- ============================================================
-- MIGRATION : Compatibilité colonnes media_files (ancien vs nouveau schéma)
--
-- La table media_files a deux jeux de colonnes coexistants :
--   Ancien : public_url, mime_type, size_bytes, path, bucket, filename
--   Nouveau: url, type, size, original_name, category, uploaded_by...
--
-- Cette migration :
--   1. S'assure que les nouvelles colonnes existent
--   2. Synchronise public_url → url pour les anciennes images
--   3. Synchronise mime_type → type et size_bytes → size
--   4. Synchronise filename → original_name si original_name est vide
-- ============================================================

-- Assurer l'existence des nouvelles colonnes (idempotent)
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS url            TEXT NOT NULL DEFAULT '';
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS original_name  TEXT NOT NULL DEFAULT '';
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS category       TEXT NOT NULL DEFAULT 'autre';
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS type           TEXT NOT NULL DEFAULT '';
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS size           BIGINT NOT NULL DEFAULT 0;
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS alt_text       TEXT NOT NULL DEFAULT '';
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS description    TEXT NOT NULL DEFAULT '';
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS tags           TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS is_brand_asset BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS brand_asset_type TEXT DEFAULT NULL;
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS uploaded_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS upload_date    TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS deleted_at     TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS deleted_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS thumbnail_url  TEXT DEFAULT NULL;
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS width          INTEGER DEFAULT NULL;
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS height         INTEGER DEFAULT NULL;

-- ── Synchronisation rétroactive ──────────────────────────────

-- public_url → url (anciennes images sans url)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='media_files' AND column_name='public_url'
  ) THEN
    UPDATE public.media_files
    SET url = public_url
    WHERE (url IS NULL OR url = '')
      AND public_url IS NOT NULL
      AND public_url <> '';
  END IF;
END $$;

-- mime_type → type
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='media_files' AND column_name='mime_type'
  ) THEN
    UPDATE public.media_files
    SET type = mime_type
    WHERE (type IS NULL OR type = '')
      AND mime_type IS NOT NULL
      AND mime_type <> '';
  END IF;
END $$;

-- size_bytes → size
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='media_files' AND column_name='size_bytes'
  ) THEN
    UPDATE public.media_files
    SET size = size_bytes
    WHERE (size IS NULL OR size = 0)
      AND size_bytes IS NOT NULL
      AND size_bytes > 0;
  END IF;
END $$;

-- filename → original_name (si original_name vide)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='media_files' AND column_name='filename'
  ) THEN
    UPDATE public.media_files
    SET original_name = filename
    WHERE (original_name IS NULL OR original_name = '')
      AND filename IS NOT NULL
      AND filename <> '';
  END IF;
END $$;

-- upload_date ← created_at si upload_date est now() par défaut et created_at existe
UPDATE public.media_files
SET upload_date = created_at
WHERE upload_date > now() - interval '1 minute'
  AND created_at < now() - interval '1 minute';

-- Résumé
SELECT
  COUNT(*) FILTER (WHERE url <> '')            AS with_url,
  COUNT(*) FILTER (WHERE url = '' OR url IS NULL) AS without_url,
  COUNT(*) FILTER (WHERE deleted_at IS NULL)   AS active,
  COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) AS trashed
FROM public.media_files;

-- Media Center improvements
-- 1. Soft delete (corbeille)
-- 2. Thumbnail URL column
-- 3. Indexes

ALTER TABLE public.media_files
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT DEFAULT NULL;

-- Index pour la corbeille (requêtes fréquentes IS NULL / IS NOT NULL)
CREATE INDEX IF NOT EXISTS idx_media_files_deleted_at
  ON public.media_files (deleted_at)
  WHERE deleted_at IS NULL;

-- Index catégorie + deleted_at (filtrage bibliothèque)
CREATE INDEX IF NOT EXISTS idx_media_files_category_active
  ON public.media_files (category, upload_date DESC)
  WHERE deleted_at IS NULL;

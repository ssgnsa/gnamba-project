-- Media dimensions
-- Stocker width/height en DB pour éviter de charger l'image au runtime

ALTER TABLE public.media_files
  ADD COLUMN IF NOT EXISTS width  INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS height INTEGER DEFAULT NULL;

COMMENT ON COLUMN public.media_files.width  IS 'Largeur en pixels (null pour PDF et fichiers non-image)';
COMMENT ON COLUMN public.media_files.height IS 'Hauteur en pixels (null pour PDF et fichiers non-image)';

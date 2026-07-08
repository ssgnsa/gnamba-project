-- ============================================================
-- MIGRATION DE RÉFÉRENCE : Création complète des tables média
-- Idempotente (IF NOT EXISTS) — peut tourner sur une DB vierge
-- ou une DB partiellement migrée sans erreur.
-- ============================================================

-- ── media_files ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.media_files (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename        TEXT NOT NULL,
  original_name   TEXT NOT NULL DEFAULT '',
  url             TEXT NOT NULL DEFAULT '',
  thumbnail_url   TEXT DEFAULT NULL,
  category        TEXT NOT NULL DEFAULT 'autre',
  type            TEXT NOT NULL DEFAULT 'image/jpeg',
  size            BIGINT NOT NULL DEFAULT 0,
  alt_text        TEXT NOT NULL DEFAULT '',
  description     TEXT NOT NULL DEFAULT '',
  tags            TEXT[] NOT NULL DEFAULT '{}',
  is_brand_asset  BOOLEAN NOT NULL DEFAULT false,
  brand_asset_type TEXT DEFAULT NULL,
  uploaded_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  upload_date     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ DEFAULT NULL,
  deleted_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  width           INTEGER DEFAULT NULL,
  height          INTEGER DEFAULT NULL
);

COMMENT ON TABLE public.media_files IS 'Bibliothèque centralisée des fichiers médias (images, PDF)';

-- Colonnes ajoutées progressivement (compatibilité DB existante)
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS url             TEXT NOT NULL DEFAULT '';
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS thumbnail_url   TEXT DEFAULT NULL;
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS category        TEXT NOT NULL DEFAULT 'autre';
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS type            TEXT NOT NULL DEFAULT 'image/jpeg';
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS size            BIGINT NOT NULL DEFAULT 0;
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS original_name   TEXT NOT NULL DEFAULT '';
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS alt_text        TEXT NOT NULL DEFAULT '';
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS description     TEXT NOT NULL DEFAULT '';
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS tags            TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS is_brand_asset  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS brand_asset_type TEXT DEFAULT NULL;
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS uploaded_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS upload_date     TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS deleted_at      TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS deleted_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS width           INTEGER DEFAULT NULL;
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS height          INTEGER DEFAULT NULL;

COMMENT ON COLUMN public.media_files.deleted_at  IS 'Soft delete — NULL = actif, non-NULL = corbeille';
COMMENT ON COLUMN public.media_files.width       IS 'Largeur en pixels (null pour PDF)';
COMMENT ON COLUMN public.media_files.height      IS 'Hauteur en pixels (null pour PDF)';

CREATE INDEX IF NOT EXISTS idx_media_files_deleted_at
  ON public.media_files (deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_media_files_category_active
  ON public.media_files (category, upload_date DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_media_files_brand_asset
  ON public.media_files (brand_asset_type) WHERE is_brand_asset = true;


-- ── media_usage ──────────────────────────────────────────────
-- Association entre un fichier média et une entité métier
-- usage_type identifie le slot (ex: 'logo', 'hero_background')
CREATE TABLE IF NOT EXISTS public.media_usage (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id    UUID NOT NULL REFERENCES public.media_files(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,   -- 'site_section' | 'foncier_village' | 'brand' | ...
  entity_id   TEXT DEFAULT NULL,
  usage_type  TEXT NOT NULL,   -- 'logo' | 'hero_background' | 'hero_image' | ...
  label       TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (entity_type, entity_id, usage_type)
);

COMMENT ON TABLE  public.media_usage IS 'Liaison média ↔ entité métier par slot (usage_type)';
COMMENT ON COLUMN public.media_usage.usage_type IS 'Identifiant du slot : logo, hero_background, favicon, etc.';

CREATE INDEX IF NOT EXISTS idx_media_usage_media_id
  ON public.media_usage (media_id);

CREATE INDEX IF NOT EXISTS idx_media_usage_entity
  ON public.media_usage (entity_type, entity_id, usage_type);


-- ── media_versions ────────────────────────────────────────────
-- Historique des remplacements de fichiers
CREATE TABLE IF NOT EXISTS public.media_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id        UUID NOT NULL REFERENCES public.media_files(id) ON DELETE CASCADE,
  version_number  INTEGER NOT NULL DEFAULT 1,
  old_url         TEXT NOT NULL,
  old_filename    TEXT NOT NULL,
  replaced_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  replaced_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.media_versions IS 'Historique des versions de fichiers remplacés';

CREATE INDEX IF NOT EXISTS idx_media_versions_media_id
  ON public.media_versions (media_id);


-- ── media_audit_logs ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.media_audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id    UUID REFERENCES public.media_files(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,  -- upload | soft_delete | restore | purge | replace | metadata_update
  actor_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_audit_logs_media_id   ON public.media_audit_logs (media_id);
CREATE INDEX IF NOT EXISTS idx_media_audit_logs_actor_id   ON public.media_audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_media_audit_logs_created_at ON public.media_audit_logs (created_at DESC);


-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE public.media_files      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_usage      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_versions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_audit_logs ENABLE ROW LEVEL SECURITY;

-- media_files
DROP POLICY IF EXISTS "media_files_select"  ON public.media_files;
DROP POLICY IF EXISTS "media_files_insert"  ON public.media_files;
DROP POLICY IF EXISTS "media_files_update"  ON public.media_files;
DROP POLICY IF EXISTS "media_files_delete"  ON public.media_files;

CREATE POLICY "media_files_select"  ON public.media_files FOR SELECT TO authenticated USING (true);
CREATE POLICY "media_files_insert"  ON public.media_files FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "media_files_update"  ON public.media_files FOR UPDATE TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "media_files_delete"  ON public.media_files FOR DELETE TO authenticated USING (auth.role() = 'authenticated');

-- media_usage
DROP POLICY IF EXISTS "media_usage_select"  ON public.media_usage;
DROP POLICY IF EXISTS "media_usage_insert"  ON public.media_usage;
DROP POLICY IF EXISTS "media_usage_update"  ON public.media_usage;
DROP POLICY IF EXISTS "media_usage_delete"  ON public.media_usage;

CREATE POLICY "media_usage_select"  ON public.media_usage FOR SELECT TO authenticated USING (true);
CREATE POLICY "media_usage_insert"  ON public.media_usage FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "media_usage_update"  ON public.media_usage FOR UPDATE TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "media_usage_delete"  ON public.media_usage FOR DELETE TO authenticated USING (auth.role() = 'authenticated');

-- media_versions
DROP POLICY IF EXISTS "media_versions_select"  ON public.media_versions;
DROP POLICY IF EXISTS "media_versions_insert"  ON public.media_versions;

CREATE POLICY "media_versions_select"  ON public.media_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "media_versions_insert"  ON public.media_versions FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');

-- media_audit_logs
DROP POLICY IF EXISTS "media_audit_logs_select"  ON public.media_audit_logs;
DROP POLICY IF EXISTS "media_audit_logs_insert"  ON public.media_audit_logs;

CREATE POLICY "media_audit_logs_select"  ON public.media_audit_logs FOR SELECT TO authenticated USING (auth.role() = 'authenticated');
CREATE POLICY "media_audit_logs_insert"  ON public.media_audit_logs FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');

-- Media Audit Logs
-- Traçabilité complète des opérations sur les médias (upload, delete, restore, purge, replace)

CREATE TABLE IF NOT EXISTS public.media_audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id    UUID REFERENCES public.media_files(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,        -- 'upload' | 'soft_delete' | 'restore' | 'purge' | 'replace' | 'metadata_update'
  actor_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata    JSONB DEFAULT '{}',   -- contexte additionnel (filename, old_url, category, ...)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_audit_logs_media_id
  ON public.media_audit_logs (media_id);

CREATE INDEX IF NOT EXISTS idx_media_audit_logs_actor_id
  ON public.media_audit_logs (actor_id);

CREATE INDEX IF NOT EXISTS idx_media_audit_logs_created_at
  ON public.media_audit_logs (created_at DESC);

ALTER TABLE public.media_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "media_audit_logs_select" ON public.media_audit_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "media_audit_logs_insert" ON public.media_audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

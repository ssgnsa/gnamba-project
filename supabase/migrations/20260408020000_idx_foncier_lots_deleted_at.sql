-- Index on deleted_at for foncier_lots
CREATE INDEX IF NOT EXISTS idx_foncier_lots_deleted_at
  ON public.foncier_lots(deleted_at) WHERE deleted_at IS NOT NULL;

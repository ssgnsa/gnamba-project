-- ============================================
-- Migration: Add compatibility columns for foncier_lots
-- Date: 2026-06-08
-- Purpose:
--   - align the database schema with the current Foncier frontend payload
--   - keep the migration additive and non-destructive
-- ============================================


ALTER TABLE public.foncier_lots
  ADD COLUMN IF NOT EXISTS code_barre TEXT;

ALTER TABLE public.foncier_lots
  ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.foncier_lots
  ADD COLUMN IF NOT EXISTS chef_village TEXT;

ALTER TABLE public.foncier_lots
  ADD COLUMN IF NOT EXISTS arrete_prefectoral TEXT;

ALTER TABLE public.foncier_lots
  ADD COLUMN IF NOT EXISTS arrete_date DATE;

ALTER TABLE public.foncier_lots
  ADD COLUMN IF NOT EXISTS date_cession DATE;

ALTER TABLE public.foncier_lots
  ADD COLUMN IF NOT EXISTS prix_cession NUMERIC(12, 2);

ALTER TABLE public.foncier_lots
  ADD COLUMN IF NOT EXISTS client_updated_at TIMESTAMPTZ;

ALTER TABLE public.foncier_lots
  ADD COLUMN IF NOT EXISTS last_modified_device_id TEXT;

ALTER TABLE public.foncier_lots
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.foncier_lots
  ADD COLUMN IF NOT EXISTS deleted_reason TEXT;

COMMENT ON COLUMN public.foncier_lots.code_barre IS
  'Compatibilité frontend: code-barres du lot';

COMMENT ON COLUMN public.foncier_lots.notes IS
  'Notes libres associées au lot';

COMMENT ON COLUMN public.foncier_lots.chef_village IS
  'Nom du chef de village associé au lot';

COMMENT ON COLUMN public.foncier_lots.arrete_prefectoral IS
  'Référence de l''arrêté préfectoral';

COMMENT ON COLUMN public.foncier_lots.arrete_date IS
  'Date de l''arrêté préfectoral';

COMMENT ON COLUMN public.foncier_lots.date_cession IS
  'Date de cession du lot';

COMMENT ON COLUMN public.foncier_lots.prix_cession IS
  'Prix de cession du lot';

COMMENT ON COLUMN public.foncier_lots.client_updated_at IS
  'Dernière mise à jour côté client pour la synchronisation offline';

COMMENT ON COLUMN public.foncier_lots.last_modified_device_id IS
  'Identifiant de l''appareil ayant modifié le lot';

COMMENT ON COLUMN public.foncier_lots.deleted_by IS
  'Utilisateur ayant archivé le lot';

COMMENT ON COLUMN public.foncier_lots.deleted_reason IS
  'Motif d''archivage du lot';


-- Add deleted_at to foncier_lots
ALTER TABLE public.foncier_lots ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

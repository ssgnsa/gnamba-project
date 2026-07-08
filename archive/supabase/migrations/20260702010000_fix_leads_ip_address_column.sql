-- Add missing ip_address column used by the capture-lead edge function
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS ip_address text;

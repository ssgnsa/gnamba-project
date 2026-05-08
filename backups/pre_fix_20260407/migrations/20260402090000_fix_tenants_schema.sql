/*
  Migration: Fix Immobilier Schema - Tenants Table
  Date: 2026-04-02
  Purpose: Add missing 'telephone' column to tenants table and ensure schema matches frontend expectations
  
  This migration fixes the error: "Could not find the 'telephone' column of 'tenants' in the schema cache"
  
  Run this in Supabase SQL Editor or via:
    supabase db push
*/

-- ============================================
-- TABLE: tenants (Immobilier)
-- ============================================

-- Create tenants table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  prenom text NOT NULL,
  telephone text,
  email text,
  statut text DEFAULT 'actif',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add missing columns if table already exists but columns are missing
DO $$ BEGIN
  -- Add telephone if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'tenants' 
      AND column_name = 'telephone'
  ) THEN
    ALTER TABLE public.tenants ADD COLUMN telephone text;
  END IF;

  -- Add email if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'tenants' 
      AND column_name = 'email'
  ) THEN
    ALTER TABLE public.tenants ADD COLUMN email text;
  END IF;

  -- Add statut if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'tenants' 
      AND column_name = 'statut'
  ) THEN
    ALTER TABLE public.tenants ADD COLUMN statut text DEFAULT 'actif';
  END IF;

  -- Add updated_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'tenants' 
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.tenants ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create index on telephone for faster searches
CREATE INDEX IF NOT EXISTS idx_tenants_telephone ON public.tenants(telephone);

-- Create index on email for faster searches
CREATE INDEX IF NOT EXISTS idx_tenants_email ON public.tenants(email);

-- Create index on statut for filtering
CREATE INDEX IF NOT EXISTS idx_tenants_statut ON public.tenants(statut);

-- Create index on nom for faster searches
CREATE INDEX IF NOT EXISTS idx_tenants_nom ON public.tenants(nom);

-- ============================================
-- RLS (Row Level Security)
-- ============================================

-- Enable RLS if not already enabled
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Tenants viewable by authenticated" ON public.tenants;
DROP POLICY IF EXISTS "Tenants insertable by authenticated" ON public.tenants;
DROP POLICY IF EXISTS "Tenants updatable by authenticated" ON public.tenants;
DROP POLICY IF EXISTS "Tenants deletable by authenticated" ON public.tenants;
DROP POLICY IF EXISTS "Tenants all for authenticated" ON public.tenants;

-- Create policies for authenticated users
CREATE POLICY "Tenants all for authenticated"
  ON public.tenants
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow public read access for verification (optional)
DROP POLICY IF EXISTS "Tenants viewable by public" ON public.tenants;
-- CREATE POLICY "Tenants viewable by public"
--   ON public.tenants
--   FOR SELECT
--   TO public
--   USING (true);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.tenants IS 'Locataires/Tenants for Immobilier (Real Estate) module';
COMMENT ON COLUMN public.tenants.id IS 'Unique identifier';
COMMENT ON COLUMN public.tenants.nom IS 'Last name';
COMMENT ON COLUMN public.tenants.prenom IS 'First name';
COMMENT ON COLUMN public.tenants.telephone IS 'Phone number (format: 07 07 07 07 07)';
COMMENT ON COLUMN public.tenants.email IS 'Email address';
COMMENT ON COLUMN public.tenants.statut IS 'Status: actif or inactif';

-- ============================================
-- TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_tenants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tenants_updated_at();

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify the table structure
DO $$
DECLARE
  col_count integer;
BEGIN
  SELECT count(*) INTO col_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'tenants';
  
  IF col_count < 5 THEN
    RAISE EXCEPTION 'Tenants table should have at least 6 columns but has %', col_count;
  END IF;
  
  RAISE NOTICE 'Tenants table migration completed successfully with % columns', col_count;
END $$;

-- Create village-logos bucket for village logo storage
-- This migration creates storage bucket needed for VillageLogoUploader component
-- Using manual bucket creation via API since storage extension is not available

-- Note: Storage extension not available in this PostgreSQL instance
-- Bucket will be created via Supabase Storage API instead
-- This migration serves as documentation and placeholder

-- Create a table to track village logo URLs as fallback
CREATE TABLE IF NOT EXISTS village_logo_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE village_logo_registry ENABLE ROW LEVEL SECURITY;

-- Create policies for village logo registry
CREATE POLICY "Anyone can view village logos" ON village_logo_registry
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert village logos" ON village_logo_registry
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own village logos" ON village_logo_registry
FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own village logos" ON village_logo_registry
FOR DELETE USING (auth.uid() = created_by);

-- Create index for village name lookup
CREATE INDEX IF NOT EXISTS idx_village_logo_registry_village_name 
ON village_logo_registry(village_name);

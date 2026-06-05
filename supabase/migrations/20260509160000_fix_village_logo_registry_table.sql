-- Fix village_logo_registry table structure and RLS
-- This migration ensures proper table structure and policies for logo uploads

-- Drop existing table and recreate with proper structure
DROP TABLE IF EXISTS village_logo_registry CASCADE;

-- Create village_logo_registry table with proper structure
CREATE TABLE village_logo_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE village_logo_registry ENABLE ROW LEVEL SECURITY;

-- Create proper RLS policies
-- Allow public read access to village logos (for display in attestations)
CREATE POLICY "Village logos are publicly viewable" ON village_logo_registry
FOR SELECT USING (true);

-- Allow authenticated users to insert village logos
CREATE POLICY "Authenticated users can insert village logos" ON village_logo_registry
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own village logos
CREATE POLICY "Users can update their own village logos" ON village_logo_registry
FOR UPDATE USING (auth.uid() = created_by);

-- Allow users to delete their own village logos
CREATE POLICY "Users can delete their own village logos" ON village_logo_registry
FOR DELETE USING (auth.uid() = created_by);

-- Create index for village name lookup
CREATE INDEX IF NOT EXISTS idx_village_logo_registry_village_name 
ON village_logo_registry(village_name);

-- Create index for created_by lookup
CREATE INDEX IF NOT EXISTS idx_village_logo_registry_created_by 
ON village_logo_registry(created_by);

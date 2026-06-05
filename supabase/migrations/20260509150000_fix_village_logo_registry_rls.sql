-- Fix Row Level Security policies for village_logo_registry
-- This migration fixes the RLS policy violations when uploading village logos

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view village logos" ON village_logo_registry;
DROP POLICY IF EXISTS "Authenticated users can insert village logos" ON village_logo_registry;
DROP POLICY IF EXISTS "Users can update their own village logos" ON village_logo_registry;
DROP POLICY IF EXISTS "Users can delete their own village logos" ON village_logo_registry;

-- Create proper RLS policies
-- Allow public read access to village logos (for display in attestations)
CREATE POLICY "Village logos are publicly viewable" ON village_logo_registry
FOR SELECT USING (true);

-- Allow authenticated users to upload village logos
CREATE POLICY "Authenticated users can insert village logos" ON village_logo_registry
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own village logos
CREATE POLICY "Users can update their own village logos" ON village_logo_registry
FOR UPDATE USING (auth.uid() = created_by);

-- Allow users to delete their own village logos
CREATE POLICY "Users can delete their own village logos" ON village_logo_registry
FOR DELETE USING (auth.uid() = created_by);

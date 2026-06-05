-- Fix RLS policies for foncier_village_config table
-- This migration creates proper RLS policies for village configuration operations

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "foncier_village_config_select" ON public.foncier_village_config;
DROP POLICY IF EXISTS "foncier_village_config_insert" ON public.foncier_village_config;
DROP POLICY IF EXISTS "foncier_village_config_update" ON public.foncier_village_config;
DROP POLICY IF EXISTS "foncier_village_config_delete" ON public.foncier_village_config;

-- Enable RLS on the table if not already enabled
ALTER TABLE public.foncier_village_config ENABLE ROW LEVEL SECURITY;

-- Create proper RLS policies for foncier_village_config
-- Allow public read access to village configuration (for display in forms)
CREATE POLICY "foncier_village_config_select" ON public.foncier_village_config
FOR SELECT USING (true);

-- Allow authenticated users to insert village configuration
CREATE POLICY "foncier_village_config_insert" ON public.foncier_village_config
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update village configuration
CREATE POLICY "foncier_village_config_update" ON public.foncier_village_config
FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete village configuration
CREATE POLICY "foncier_village_config_delete" ON public.foncier_village_config
FOR DELETE USING (auth.role() = 'authenticated');

-- Also check and fix village_logo_registry table policies
DROP POLICY IF EXISTS "Village logos are publicly viewable" ON village_logo_registry;
DROP POLICY IF EXISTS "Authenticated users can insert village logos" ON village_logo_registry;
DROP POLICY IF EXISTS "Users can update their own village logos" ON village_logo_registry;
DROP POLICY IF EXISTS "Users can delete their own village logos" ON village_logo_registry;

-- Recreate policies for village_logo_registry
CREATE POLICY "Village logos are publicly viewable" ON village_logo_registry
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert village logos" ON village_logo_registry
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own village logos" ON village_logo_registry
FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own village logos" ON village_logo_registry
FOR DELETE USING (auth.uid() = created_by);

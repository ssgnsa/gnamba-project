-- Fix RLS policies for media storage - Version 3 (Clean)
-- This migration addresses image access issues across the application

-- First, drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to access storage" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to public media" ON storage.objects;

-- Drop all media_files policies
DROP POLICY IF EXISTS "media_files_select" ON public.media_files;
DROP POLICY IF EXISTS "media_files_insert" ON public.media_files;
DROP POLICY IF EXISTS "media_files_update" ON public.media_files;
DROP POLICY IF EXISTS "media_files_delete" ON public.media_files;

-- Drop all media_usage policies
DROP POLICY IF EXISTS "media_usage_select" ON public.media_usage;
DROP POLICY IF EXISTS "media_usage_insert" ON public.media_usage;
DROP POLICY IF EXISTS "media_usage_update" ON public.media_usage;
DROP POLICY IF EXISTS "media_usage_delete" ON public.media_usage;

-- Drop all media_versions policies
DROP POLICY IF EXISTS "media_versions_select" ON public.media_versions;
DROP POLICY IF EXISTS "media_versions_insert" ON public.media_versions;
DROP POLICY IF EXISTS "media_versions_update" ON public.media_versions;
DROP POLICY IF EXISTS "media_versions_delete" ON public.media_versions;

-- Enable RLS on all tables
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_versions ENABLE ROW LEVEL SECURITY;

-- Create storage policies with proper bucket access
CREATE POLICY "Storage bucket access" ON storage.objects
FOR ALL USING (
  bucket_id IN ('media', 'village-logos', 'egs-logos', 'documents') 
  AND auth.role() = 'authenticated'
);

-- Create media_files policies
CREATE POLICY "media_files_select" ON public.media_files
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "media_files_insert" ON public.media_files
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "media_files_update" ON public.media_files
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "media_files_delete" ON public.media_files
FOR DELETE USING (auth.role() = 'authenticated');

-- Create media_usage policies
CREATE POLICY "media_usage_select" ON public.media_usage
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "media_usage_insert" ON public.media_usage
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "media_usage_update" ON public.media_usage
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "media_usage_delete" ON public.media_usage
FOR DELETE USING (auth.role() = 'authenticated');

-- Create media_versions policies
CREATE POLICY "media_versions_select" ON public.media_versions
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "media_versions_insert" ON public.media_versions
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "media_versions_update" ON public.media_versions
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "media_versions_delete" ON public.media_versions
FOR DELETE USING (auth.role() = 'authenticated');

-- Grant necessary storage permissions
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT SELECT ON storage.buckets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;

-- Verify policies creation
SELECT 
  'Media storage RLS policies v3 created successfully' as status,
  COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename IN ('storage.objects', 'media_files', 'media_usage', 'media_versions');

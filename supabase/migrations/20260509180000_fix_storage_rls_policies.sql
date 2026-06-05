-- Fix RLS policies for Supabase Storage
-- This migration creates proper RLS policies for storage.objects to allow logo uploads

-- Check if storage extension exists and enable it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'storage'
    ) THEN
        -- If storage extension doesn't exist, we'll create a simple table for logo registry
        -- This is a fallback for when Supabase Storage is not available
        CREATE TABLE IF NOT EXISTS village_logo_registry_fallback (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            village_name TEXT NOT NULL,
            logo_url TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE village_logo_registry_fallback ENABLE ROW LEVEL SECURITY;
        
        -- Create policies for fallback table
        CREATE POLICY "Village logos are publicly viewable" ON village_logo_registry_fallback
        FOR SELECT USING (true);
        
        CREATE POLICY "Authenticated users can insert village logos" ON village_logo_registry_fallback
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
        
        CREATE POLICY "Users can update their own village logos" ON village_logo_registry_fallback
        FOR UPDATE USING (auth.uid() = created_by);
        
        CREATE POLICY "Users can delete their own village logos" ON village_logo_registry_fallback
        FOR DELETE USING (auth.uid() = created_by);
    END IF;
END $$;

-- Create RLS policies for storage.objects if storage extension exists
DO $$
BEGIN
    -- Check if storage.objects table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'storage' AND table_name = 'objects'
    ) THEN
        -- Drop existing policies for village-logos bucket
        DROP POLICY IF EXISTS "Village logos are publicly accessible" ON storage.objects;
        DROP POLICY IF EXISTS "Users can upload village logos" ON storage.objects;
        DROP POLICY IF EXISTS "Users can update village logos" ON storage.objects;
        DROP POLICY IF EXISTS "Users can delete village logos" ON storage.objects;
        
        -- Create proper RLS policies for village-logos bucket
        CREATE POLICY "Village logos are publicly accessible" ON storage.objects
        FOR SELECT USING (bucket_id = 'village-logos');
        
        CREATE POLICY "Users can upload village logos" ON storage.objects
        FOR INSERT WITH CHECK (
            bucket_id = 'village-logos' AND 
            auth.role() = 'authenticated'
        );
        
        CREATE POLICY "Users can update village logos" ON storage.objects
        FOR UPDATE USING (
            bucket_id = 'village-logos' AND 
            auth.role() = 'authenticated'
        );
        
        CREATE POLICY "Users can delete village logos" ON storage.objects
        FOR DELETE USING (
            bucket_id = 'village-logos' AND 
            auth.role() = 'authenticated'
        );
    END IF;
END $$;

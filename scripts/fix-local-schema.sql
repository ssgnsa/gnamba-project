-- ============================================
-- Fix Schema Local pour matcher le schéma distant
-- À exécuter dans Supabase SQL Editor (local)
-- ============================================

-- 1. Ajouter colonnes manquantes à user_profiles
ALTER TABLE IF EXISTS public.user_profiles 
  ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'employe',
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Créer table app_settings si inexistante
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Créer table media_files si inexistante
CREATE TABLE IF NOT EXISTS public.media_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    original_name TEXT,
    mime_type TEXT,
    size_bytes BIGINT,
    path TEXT NOT NULL,
    bucket TEXT,
    public_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Ajouter colonnes manquantes à foncier_lots
ALTER TABLE IF EXISTS public.foncier_lots 
  ADD COLUMN IF NOT EXISTS arrete_date DATE,
  ADD COLUMN IF NOT EXISTS arrete_reference TEXT,
  ADD COLUMN IF NOT EXISTS tf_number TEXT,
  ADD COLUMN IF NOT EXISTS superficie_m2 DECIMAL(12,2);

-- 5. Créer table site_content si inexistante
CREATE TABLE IF NOT EXISTS public.site_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT,
    type TEXT DEFAULT 'text',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(section, key)
);

-- 6. Créer table page_layouts si inexistante
CREATE TABLE IF NOT EXISTS public.page_layouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    sections JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Activer RLS sur les nouvelles tables
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_layouts ENABLE ROW LEVEL SECURITY;

-- 8. Créer policies permissives pour anon
CREATE POLICY IF NOT EXISTS "Allow anon select app_settings" 
    ON public.app_settings FOR SELECT TO anon USING (true);
    
CREATE POLICY IF NOT EXISTS "Allow anon select media_files" 
    ON public.media_files FOR SELECT TO anon USING (true);
    
CREATE POLICY IF NOT EXISTS "Allow anon select site_content" 
    ON public.site_content FOR SELECT TO anon USING (true);
    
CREATE POLICY IF NOT EXISTS "Allow anon select page_layouts" 
    ON public.page_layouts FOR SELECT TO anon USING (true);

-- 9. Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- 10. Vérification
SELECT 'user_profiles columns:' as info, column_name 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND table_schema = 'public';

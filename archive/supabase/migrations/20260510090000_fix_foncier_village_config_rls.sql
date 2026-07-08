-- Fix RLS policies for foncier_village_config table
-- This migration creates proper RLS policies for village configuration operations

DO $$
BEGIN
  IF to_regclass('public.foncier_village_config') IS NULL THEN
    RAISE NOTICE 'Skipping foncier_village_config RLS: table does not exist';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS "foncier_village_config_select" ON public.foncier_village_config';
    EXECUTE 'DROP POLICY IF EXISTS "foncier_village_config_insert" ON public.foncier_village_config';
    EXECUTE 'DROP POLICY IF EXISTS "foncier_village_config_update" ON public.foncier_village_config';
    EXECUTE 'DROP POLICY IF EXISTS "foncier_village_config_delete" ON public.foncier_village_config';

    EXECUTE 'ALTER TABLE public.foncier_village_config ENABLE ROW LEVEL SECURITY';

    EXECUTE 'CREATE POLICY "foncier_village_config_select" ON public.foncier_village_config FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "foncier_village_config_insert" ON public.foncier_village_config FOR INSERT WITH CHECK (auth.role() = ''authenticated'')';
    EXECUTE 'CREATE POLICY "foncier_village_config_update" ON public.foncier_village_config FOR UPDATE USING (auth.role() = ''authenticated'')';
    EXECUTE 'CREATE POLICY "foncier_village_config_delete" ON public.foncier_village_config FOR DELETE USING (auth.role() = ''authenticated'')';
  END IF;
END $$;

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

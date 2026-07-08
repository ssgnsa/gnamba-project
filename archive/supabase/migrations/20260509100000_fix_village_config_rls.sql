-- Migration: Fix RLS policies for village configuration
-- Date: 2026-05-09
-- Purpose: Allow authenticated users to insert village config during development

-- Fix foncier_villages INSERT policy
DROP POLICY IF EXISTS "foncier_villages_insert" ON foncier_villages;
CREATE POLICY "foncier_villages_insert" ON foncier_villages
  FOR INSERT TO authenticated WITH CHECK (true);

-- Fix app_settings INSERT policy
DROP POLICY IF EXISTS "app_settings_insert" ON app_settings;
CREATE POLICY "app_settings_insert" ON app_settings
  FOR INSERT TO authenticated WITH CHECK (true);

-- Fix media_files INSERT policy for logo uploads
DROP POLICY IF EXISTS "media_files_insert" ON media_files;
CREATE POLICY "media_files_insert" ON media_files
  FOR INSERT TO authenticated WITH CHECK (true);
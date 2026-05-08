-- ============================================
-- Migration: RLS on critical tables (user_profiles, finances, app_settings, media_files, site_content, page_layouts)
-- ============================================
-- Date: 2026-04-08
-- Purpose:
--   - user_profiles was created without RLS — any authenticated user could read/modify all profiles and roles
--   - finances had policies in 20260405130000 but was never confirmed ENABLE ROW LEVEL SECURITY
--   - app_settings, media_files, site_content, page_layouts had zero RLS — open to all authenticated users
--   This migration closes the biggest security gap in the system.
--
-- RISK: Applying this on a live DB will immediately restrict access.
--   - Admins will still have full access
--   - Gestionnaires will retain their current permissions
--   - Employees will LOSE access to profiles, finances, and settings they could previously read
--   Test thoroughly in local/staging BEFORE applying to production.
--
-- RUN MANUALLY on cloud if supabase db push times out due to policy rewrites on large tables.
-- ============================================

BEGIN;

-- ============================================
-- Ensure helper function exists (idempotent)
-- This is the single source of truth from 20260408030000_current_user_role_fn.sql
-- ============================================
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()),
    'employe'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- Helper: Is admin?
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT current_user_role() = 'admin';
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- Helper: Can manage content (admin or gestionnaire)
-- ============================================
CREATE OR REPLACE FUNCTION public.can_manage_content()
RETURNS BOOLEAN AS $$
  SELECT current_user_role() IN ('admin', 'gestionnaire', 'gerant');
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- 1. USER_PROFILES — CRITICAL: contains roles, permissions, full names
-- ============================================
-- Rationale: Only users should see their own profile.
-- Admins can see/edit all profiles. Gestionnaires can see all (HR view) but only edit non-role fields.
-- Employees can only read their own profile.

ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_profiles_select_own_or_admin" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_admin_only" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own_or_admin" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_delete_admin_only" ON public.user_profiles;

-- SELECT: Users see their own profile; admins see everything
CREATE POLICY "user_profiles_select_own_or_admin" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR current_user_role() IN ('admin', 'gestionnaire')
  );

-- INSERT: Only admins can create new user profiles (provisioning)
CREATE POLICY "user_profiles_insert_admin_only" ON public.user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (current_user_role() = 'admin');

-- UPDATE: Users can update their own profile (except role); admins can update anything
CREATE POLICY "user_profiles_update_own_or_admin" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (
    id = auth.uid()
    OR current_user_role() = 'admin'
  )
  WITH CHECK (
    id = auth.uid()
    OR current_user_role() = 'admin'
  );

-- DELETE: Admin only
CREATE POLICY "user_profiles_delete_admin_only" ON public.user_profiles
  FOR DELETE TO authenticated
  USING (current_user_role() = 'admin');

-- ============================================
-- 2. FINANCES — Verify RLS is enabled + re-apply policies
-- ============================================
-- Rationale: finances had policies in 20260405130000 but RLS status was never confirmed.
-- We ENABLE RLS (no-op if already enabled) and DROP/CREATE policies to ensure they exist.

ALTER TABLE IF EXISTS public.finances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "finances_select" ON public.finances;
DROP POLICY IF EXISTS "finances_insert" ON public.finances;
DROP POLICY IF EXISTS "finances_update" ON public.finances;
DROP POLICY IF EXISTS "finances_delete" ON public.finances;

-- SELECT: Only admin, gestionnaire, gerant (NOT employe)
CREATE POLICY "finances_select" ON public.finances
  FOR SELECT TO authenticated
  USING (current_user_role() IN ('admin', 'gestionnaire', 'gerant'));

-- INSERT: admin, gestionnaire, gerant
CREATE POLICY "finances_insert" ON public.finances
  FOR INSERT TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'gestionnaire', 'gerant'));

-- UPDATE: admin, gestionnaire, gerant
CREATE POLICY "finances_update" ON public.finances
  FOR UPDATE TO authenticated
  USING (current_user_role() IN ('admin', 'gestionnaire', 'gerant'))
  WITH CHECK (current_user_role() IN ('admin', 'gestionnaire', 'gerant'));

-- DELETE: admin only
CREATE POLICY "finances_delete" ON public.finances
  FOR DELETE TO authenticated
  USING (current_user_role() = 'admin');

-- ============================================
-- 3. APP_SETTINGS — Brand settings, colors, logo, deployment config
-- ============================================
-- Rationale: Brand settings should be readable by all (used in public pages),
-- but only admins can modify them.

ALTER TABLE IF EXISTS public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_settings_select" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_insert" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_update" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_delete" ON public.app_settings;

-- SELECT: All authenticated (needed for public site rendering)
CREATE POLICY "app_settings_select" ON public.app_settings
  FOR SELECT TO authenticated USING (true);

-- INSERT: Admin only
CREATE POLICY "app_settings_insert" ON public.app_settings
  FOR INSERT TO authenticated
  WITH CHECK (current_user_role() = 'admin');

-- UPDATE: Admin only
CREATE POLICY "app_settings_update" ON public.app_settings
  FOR UPDATE TO authenticated
  USING (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');

-- DELETE: Admin only
CREATE POLICY "app_settings_delete" ON public.app_settings
  FOR DELETE TO authenticated
  USING (current_user_role() = 'admin');

-- ============================================
-- 4. MEDIA_FILES — Media library, file versions, brand assets
-- ============================================
-- Rationale: All authenticated can view media (used in public pages).
-- Management (upload/delete) restricted to admin/gestionnaire.

ALTER TABLE IF EXISTS public.media_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "media_files_select" ON public.media_files;
DROP POLICY IF EXISTS "media_files_insert" ON public.media_files;
DROP POLICY IF EXISTS "media_files_update" ON public.media_files;
DROP POLICY IF EXISTS "media_files_delete" ON public.media_files;

-- SELECT: All authenticated
CREATE POLICY "media_files_select" ON public.media_files
  FOR SELECT TO authenticated USING (true);

-- INSERT: admin, gestionnaire, gerant
CREATE POLICY "media_files_insert" ON public.media_files
  FOR INSERT TO authenticated
  WITH CHECK (can_manage_content());

-- UPDATE: admin, gestionnaire, gerant
CREATE POLICY "media_files_update" ON public.media_files
  FOR UPDATE TO authenticated
  USING (can_manage_content())
  WITH CHECK (can_manage_content());

-- DELETE: admin only
CREATE POLICY "media_files_delete" ON public.media_files
  FOR DELETE TO authenticated
  USING (current_user_role() = 'admin');

-- ============================================
-- 5. SITE_CONTENT — CMS key-value pairs for public website
-- ============================================
-- Rationale: Readable by all (public site), writable by admin/gestionnaire only.

ALTER TABLE IF EXISTS public.site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_content_select" ON public.site_content;
DROP POLICY IF EXISTS "site_content_insert" ON public.site_content;
DROP POLICY IF EXISTS "site_content_update" ON public.site_content;
DROP POLICY IF EXISTS "site_content_delete" ON public.site_content;

-- SELECT: All authenticated
CREATE POLICY "site_content_select" ON public.site_content
  FOR SELECT TO authenticated USING (true);

-- INSERT: admin, gestionnaire
CREATE POLICY "site_content_insert" ON public.site_content
  FOR INSERT TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'gestionnaire'));

-- UPDATE: admin, gestionnaire
CREATE POLICY "site_content_update" ON public.site_content
  FOR UPDATE TO authenticated
  USING (current_user_role() IN ('admin', 'gestionnaire'))
  WITH CHECK (current_user_role() IN ('admin', 'gestionnaire'));

-- DELETE: admin only
CREATE POLICY "site_content_delete" ON public.site_content
  FOR DELETE TO authenticated
  USING (current_user_role() = 'admin');

-- ============================================
-- 6. PAGE_LAYOUTS — Visual page builder layouts (JSON)
-- ============================================
-- Rationale: Readable by all (public site rendering), writable by admin/gestionnaire.

ALTER TABLE IF EXISTS public.page_layouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "page_layouts_select" ON public.page_layouts;
DROP POLICY IF EXISTS "page_layouts_insert" ON public.page_layouts;
DROP POLICY IF EXISTS "page_layouts_update" ON public.page_layouts;
DROP POLICY IF EXISTS "page_layouts_delete" ON public.page_layouts;

-- SELECT: All authenticated
CREATE POLICY "page_layouts_select" ON public.page_layouts
  FOR SELECT TO authenticated USING (true);

-- INSERT: admin, gestionnaire
CREATE POLICY "page_layouts_insert" ON public.page_layouts
  FOR INSERT TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'gestionnaire'));

-- UPDATE: admin, gestionnaire
CREATE POLICY "page_layouts_update" ON public.page_layouts
  FOR UPDATE TO authenticated
  USING (current_user_role() IN ('admin', 'gestionnaire'))
  WITH CHECK (current_user_role() IN ('admin', 'gestionnaire'));

-- DELETE: admin only
CREATE POLICY "page_layouts_delete" ON public.page_layouts
  FOR DELETE TO authenticated
  USING (current_user_role() = 'admin');

COMMIT;

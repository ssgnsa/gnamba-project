-- ============================================
-- Fix: user_profiles RLS recursion and JWT-backed admin checks
-- Date: 2026-06-22
-- Purpose:
--   - Remove recursive policies on public.user_profiles
--   - Use JWT app_metadata for admin checks
--   - Preserve self-service access to the logged-in user's own profile
-- ============================================


-- Prefer JWT claims for role resolution, then fall back to the user's profile row.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT COALESCE(
    NULLIF(auth.jwt() -> 'app_metadata' ->> 'role', ''),
    NULLIF(auth.jwt() -> 'app_metadata' ->> 'access_level', ''),
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()),
    'employe'
  );
$$;

-- Small helper used only by user_profiles RLS so we never recurse back into user_profiles.
CREATE OR REPLACE FUNCTION public.jwt_app_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT COALESCE(
    NULLIF(auth.jwt() -> 'app_metadata' ->> 'role', ''),
    NULLIF(auth.jwt() -> 'app_metadata' ->> 'access_level', '')
  );
$$;

ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_own_or_admin" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_admin_only" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own_or_admin" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_delete_admin_only" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.user_profiles;

CREATE POLICY "user_profiles_select_own_or_admin" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR jwt_app_role() IN ('admin', 'gestionnaire')
  );

CREATE POLICY "user_profiles_insert_admin_only" ON public.user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (jwt_app_role() = 'admin');

CREATE POLICY "user_profiles_update_own_or_admin" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (
    id = auth.uid()
    OR jwt_app_role() = 'admin'
  )
  WITH CHECK (
    id = auth.uid()
    OR jwt_app_role() = 'admin'
  );

CREATE POLICY "user_profiles_delete_admin_only" ON public.user_profiles
  FOR DELETE TO authenticated
  USING (jwt_app_role() = 'admin');

-- Keep the explicit service-role insert path for trusted administrative tasks.
CREATE POLICY "Service role can insert profiles" ON public.user_profiles
  FOR INSERT TO service_role
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated, service_role;


-- Frontmatter
-- document: create_local_admin.sql
-- phase: 0
-- session: 1
-- generated_at: "2026-06-17T12:10:00Z"
-- status: draft
-- inputs_used: ["PROGRESS_STATE.json"]
-- absent_services: []

-- Purpose: Create a local admin user entry in user_profiles and ensure related auth user exists.

BEGIN;

-- Disable RLS to allow seed
ALTER TABLE IF EXISTS public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Insert or update admin profile
INSERT INTO public.user_profiles (id, full_name, role, access_level, poste, department, avatar_url, phone, email, created_at, updated_at)
VALUES (
    (SELECT id FROM auth.users WHERE lower(email) = lower('ssgnabia@gmail.com') ORDER BY created_at DESC LIMIT 1),
    'Souley Gnamba',
    'admin',
    'admin',
    'Administrateur',
    'Administration',
    NULL,
    NULL,
    'ssgnabia@gmail.com',
    now(),
    now()
)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  access_level = EXCLUDED.access_level,
  updated_at = now();

-- Re-enable RLS
ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;

COMMIT;

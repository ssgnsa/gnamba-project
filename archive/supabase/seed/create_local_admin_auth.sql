-- Frontmatter
-- document: create_local_admin_auth.sql
-- phase: 0
-- session: 1
-- generated_at: "2026-06-17T15:50:00Z"
-- status: draft
-- inputs_used: ["PROGRESS_STATE.json"]
-- absent_services: []

BEGIN;

DELETE FROM public.user_profiles
WHERE lower(email) IN ('ssgnsa@gmail.com', 'ssgnsa@outlook.com');

DELETE FROM auth.users
WHERE lower(email) IN ('ssgnsa@gmail.com', 'ssgnsa@outlook.com');

-- Create or update Supabase auth user
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id
  INTO v_user_id
  FROM auth.users
  WHERE lower(email) = lower('ssgnabia@gmail.com')
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    UPDATE auth.users
    SET
      instance_id = '00000000-0000-0000-0000-000000000000',
      aud = 'authenticated',
      role = 'authenticated',
      email = 'ssgnabia@gmail.com',
      encrypted_password = crypt('deadsoulja28@', gen_salt('bf')),
      email_confirmed_at = now(),
      confirmation_token = '',
      recovery_token = '',
      email_change_token_new = '',
      email_change = '',
      phone = NULL,
      phone_confirmed_at = NULL,
      phone_change = '',
      phone_change_token = '',
      email_change_token_current = '',
      reauthentication_token = '',
      raw_app_meta_data = '{"provider":"email","providers":["email"],"role":"admin","access_level":"admin"}'::jsonb,
      raw_user_meta_data = '{"full_name":"Souley Gnamba"}'::jsonb,
      is_super_admin = true,
      updated_at = now(),
      is_anonymous = false,
      is_sso_user = false
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      phone,
      phone_confirmed_at,
      phone_change,
      phone_change_token,
      email_change_token_current,
      reauthentication_token,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      is_anonymous,
      is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'ssgnabia@gmail.com',
      crypt('deadsoulja28@', gen_salt('bf')),
      now(),
      '',
      '',
      '',
      '',
      NULL,
      NULL,
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"],"role":"admin","access_level":"admin"}'::jsonb,
      '{"full_name":"Souley Gnamba"}'::jsonb,
      true,
      now(),
      now(),
      false,
      false
    );
  END IF;
END$$;

-- Create or update local admin profile linked to auth user
INSERT INTO public.user_profiles (
  id,
  full_name,
  role,
  access_level,
  poste,
  department,
  email,
  created_at,
  updated_at
)
VALUES (
  (SELECT id FROM auth.users WHERE lower(email) = lower('ssgnabia@gmail.com') ORDER BY created_at DESC LIMIT 1),
  'Souley Gnamba',
  'admin',
  'admin',
  'Administrateur',
  'Administration',
  'ssgnabia@gmail.com',
  now(),
  now()
)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  access_level = EXCLUDED.access_level,
  poste = EXCLUDED.poste,
  department = EXCLUDED.department,
  updated_at = now();

COMMIT;

-- Migration: add user_invites table and create_user_with_profile RPC
-- Date: 2026-07-02
-- Purpose:
--   - support the admin invite flow used by the Utilisateurs UI
--   - expose a create_user_with_profile RPC expected by the frontend

CREATE TABLE IF NOT EXISTS public.user_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    access_level TEXT NOT NULL DEFAULT 'visiteur' CHECK (access_level IN ('admin','gerant','secretaire','ouvrier','visiteur','gestionnaire','employe')),
    poste TEXT,
    department TEXT,
    phone TEXT,
    invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_invites_email ON public.user_invites (email);
CREATE INDEX IF NOT EXISTS idx_user_invites_invited_at ON public.user_invites (invited_at DESC);

ALTER TABLE IF EXISTS public.user_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_invites_admin_manage" ON public.user_invites;
CREATE POLICY "user_invites_admin_manage"
  ON public.user_invites
  FOR ALL
  TO authenticated
  USING (public.jwt_app_role() IN ('admin','gestionnaire'))
  WITH CHECK (public.jwt_app_role() IN ('admin','gestionnaire'));

CREATE OR REPLACE FUNCTION public.create_user_with_profile(
    p_email TEXT,
    p_password TEXT,
    p_full_name TEXT,
    p_access_level TEXT DEFAULT 'visiteur',
    p_poste TEXT DEFAULT '',
    p_department TEXT DEFAULT '',
    p_phone TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_role TEXT;
    v_user_id UUID;
    v_result JSONB;
BEGIN
    IF public.jwt_app_role() IS NULL OR public.jwt_app_role() NOT IN ('admin','gestionnaire') THEN
        RETURN jsonb_build_object('success', false, 'code', 'UNAUTHORIZED', 'message', 'Accès réservé aux administrateurs');
    END IF;

    IF p_email IS NULL OR p_email = '' OR strpos(p_email, '@') = 0 THEN
        RETURN jsonb_build_object('success', false, 'code', 'INVALID_EMAIL', 'message', 'Adresse email invalide');
    END IF;

    IF p_password IS NULL OR length(p_password) < 8 THEN
        RETURN jsonb_build_object('success', false, 'code', 'INVALID_PASSWORD', 'message', 'Mot de passe trop court');
    END IF;

    IF p_full_name IS NULL OR btrim(p_full_name) = '' THEN
        RETURN jsonb_build_object('success', false, 'code', 'INVALID_NAME', 'message', 'Nom complet requis');
    END IF;

    IF p_access_level IN ('admin','gerant','gestionnaire') THEN
        v_role := 'gestionnaire';
    ELSIF p_access_level = 'admin' THEN
        v_role := 'admin';
    ELSE
        v_role := 'employe';
    END IF;

    BEGIN
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            confirmation_token,
            recovery_token,
            email_change_token_new,
            email_change
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            p_email,
            crypt(p_password, gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            jsonb_build_object('role', v_role, 'access_level', p_access_level),
            jsonb_build_object('full_name', p_full_name, 'role', v_role, 'access_level', p_access_level, 'poste', p_poste, 'department', p_department, 'phone', p_phone),
            '',
            '',
            '',
            ''
        )
        RETURNING id INTO v_user_id;
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'code', 'EMAIL_EXISTS', 'message', 'Un compte avec cet email existe déjà');
    END;

    INSERT INTO public.user_profiles (
        id,
        email,
        full_name,
        role,
        access_level,
        poste,
        department,
        phone,
        avatar_url,
        created_at,
        updated_at
    )
    VALUES (
        v_user_id,
        p_email,
        btrim(p_full_name),
        v_role,
        p_access_level,
        p_poste,
        p_department,
        p_phone,
        '',
        NOW(),
        NOW()
    );

    v_result := jsonb_build_object(
        'success', true,
        'message', 'Compte créé avec succès.',
        'user_id', v_user_id
    );
    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_user_with_profile(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

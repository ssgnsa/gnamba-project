-- Migration: Création de la table user_profiles (base pour l'authentification)
-- Date: 2026-03-25
-- Objectif: Créer la table user_profiles avant les tables qui en dépendent

-- =====================================================
-- TABLE: user_profiles
-- Profils utilisateurs liés à auth.users
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'employe' CHECK (role IN ('admin', 'gerant', 'secretaire', 'ouvrier', 'visiteur', 'gestionnaire', 'employe')),
    department TEXT,
    position TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON public.user_profiles(is_active);

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile" 
ON public.user_profiles FOR SELECT 
TO authenticated 
USING (id = auth.uid());

-- Politique: Les admins peuvent voir tous les profils
CREATE POLICY "Admins can view all profiles" 
ON public.user_profiles FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Politique: Les utilisateurs peuvent modifier leur propre profil (sauf le rôle)
CREATE POLICY "Users can update own profile" 
ON public.user_profiles FOR UPDATE 
TO authenticated 
USING (id = auth.uid())
WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.user_profiles WHERE id = auth.uid()));

-- Politique: Les admins peuvent tout modifier
CREATE POLICY "Admins can manage all profiles" 
ON public.user_profiles FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Politique: Insertion lors de la création de compte (trigger)
CREATE POLICY "Service role can insert profiles" 
ON public.user_profiles FOR INSERT 
TO service_role 
WITH CHECK (true);

-- =====================================================
-- TRIGGER: Mise à jour automatique de updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Créer automatiquement un profil après signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, role)
    VALUES (
        NEW.id, 
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'employe')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE public.user_profiles IS 'Profils utilisateurs liés à auth.users';
COMMENT ON COLUMN public.user_profiles.role IS 'Rôle: admin, gerant, secretaire, ouvrier, visiteur, gestionnaire, employe';

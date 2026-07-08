-- Fix public access for site content and add missing dashboard tables
-- This migration makes public page content readable by anonymous users while keeping
-- employee/private dashboard data available to authenticated users.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()),
    'employe'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT current_user_role() = 'admin';
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_manage_content()
RETURNS BOOLEAN AS $$
  SELECT current_user_role() IN ('admin', 'gestionnaire', 'gerant');
$$ LANGUAGE SQL SECURITY DEFINER;

-- Public site tables: allow anonymous reads for the public website.
ALTER TABLE IF EXISTS public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.page_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.site_realisations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_settings_select" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_insert" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_update" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_delete" ON public.app_settings;
CREATE POLICY "app_settings_select" ON public.app_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "app_settings_insert" ON public.app_settings FOR INSERT TO authenticated WITH CHECK (current_user_role() = 'admin');
CREATE POLICY "app_settings_update" ON public.app_settings FOR UPDATE TO authenticated USING (current_user_role() = 'admin') WITH CHECK (current_user_role() = 'admin');
CREATE POLICY "app_settings_delete" ON public.app_settings FOR DELETE TO authenticated USING (current_user_role() = 'admin');

DROP POLICY IF EXISTS "page_layouts_select" ON public.page_layouts;
DROP POLICY IF EXISTS "page_layouts_insert" ON public.page_layouts;
DROP POLICY IF EXISTS "page_layouts_update" ON public.page_layouts;
DROP POLICY IF EXISTS "page_layouts_delete" ON public.page_layouts;
CREATE POLICY "page_layouts_select" ON public.page_layouts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "page_layouts_insert" ON public.page_layouts FOR INSERT TO authenticated WITH CHECK (current_user_role() IN ('admin', 'gestionnaire'));
CREATE POLICY "page_layouts_update" ON public.page_layouts FOR UPDATE TO authenticated USING (current_user_role() IN ('admin', 'gestionnaire')) WITH CHECK (current_user_role() IN ('admin', 'gestionnaire'));
CREATE POLICY "page_layouts_delete" ON public.page_layouts FOR DELETE TO authenticated USING (current_user_role() = 'admin');

DROP POLICY IF EXISTS "site_content_select" ON public.site_content;
DROP POLICY IF EXISTS "site_content_insert" ON public.site_content;
DROP POLICY IF EXISTS "site_content_update" ON public.site_content;
DROP POLICY IF EXISTS "site_content_delete" ON public.site_content;
CREATE POLICY "site_content_select" ON public.site_content FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "site_content_insert" ON public.site_content FOR INSERT TO authenticated WITH CHECK (current_user_role() IN ('admin', 'gestionnaire'));
CREATE POLICY "site_content_update" ON public.site_content FOR UPDATE TO authenticated USING (current_user_role() IN ('admin', 'gestionnaire')) WITH CHECK (current_user_role() IN ('admin', 'gestionnaire'));
CREATE POLICY "site_content_delete" ON public.site_content FOR DELETE TO authenticated USING (current_user_role() = 'admin');

DROP POLICY IF EXISTS "site_realisations_select" ON public.site_realisations;
DROP POLICY IF EXISTS "site_realisations_insert" ON public.site_realisations;
DROP POLICY IF EXISTS "site_realisations_update" ON public.site_realisations;
DROP POLICY IF EXISTS "site_realisations_delete" ON public.site_realisations;
CREATE POLICY "site_realisations_select" ON public.site_realisations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "site_realisations_insert" ON public.site_realisations FOR INSERT TO authenticated WITH CHECK (current_user_role() IN ('admin', 'gestionnaire'));
CREATE POLICY "site_realisations_update" ON public.site_realisations FOR UPDATE TO authenticated USING (current_user_role() IN ('admin', 'gestionnaire')) WITH CHECK (current_user_role() IN ('admin', 'gestionnaire'));
CREATE POLICY "site_realisations_delete" ON public.site_realisations FOR DELETE TO authenticated USING (current_user_role() = 'admin');

-- Employee/dashboard tables: create them if missing and allow authenticated users.
CREATE TABLE IF NOT EXISTS public.messages_direction (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  contenu text NOT NULL,
  type text NOT NULL DEFAULT 'INFO',
  image_url text,
  date_publication timestamptz NOT NULL DEFAULT now(),
  date_expiration timestamptz,
  priorite text NOT NULL DEFAULT 'NORMALE',
  cibles_tous_employes boolean NOT NULL DEFAULT true,
  cibles_services text[] NOT NULL DEFAULT '{}',
  cibles_employes uuid[] NOT NULL DEFAULT '{}',
  publie_par uuid,
  statut text NOT NULL DEFAULT 'PUBLIE',
  lu_par uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.employes_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employe_id uuid,
  statut text NOT NULL DEFAULT 'EN_LIGNE',
  statut_message text,
  date_arrivee timestamptz NOT NULL DEFAULT now(),
  date_depart timestamptz,
  date_naissance date,
  service text,
  poste text,
  avatar_url text,
  last_activity timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.visites_en_cours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visiteur_id uuid,
  date_arrivee timestamptz NOT NULL DEFAULT now(),
  date_depart timestamptz,
  motif text,
  service text,
  statut text NOT NULL DEFAULT 'EN_COURS',
  observations text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activites_journal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'INFO',
  titre text NOT NULL,
  description text,
  icone text,
  priorite text NOT NULL DEFAULT 'NORMALE',
  auteur_id uuid,
  auteur_nom text,
  entity_type text,
  entity_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stats_journalieres (
  date date PRIMARY KEY,
  total_visiteurs integer NOT NULL DEFAULT 0,
  visiteurs_actuels integer NOT NULL DEFAULT 0,
  badges_imprimes integer NOT NULL DEFAULT 0,
  employes_presents integer NOT NULL DEFAULT 0,
  activites_du_jour integer NOT NULL DEFAULT 0
);

ALTER TABLE IF EXISTS public.messages_direction ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.employes_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.visites_en_cours ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.activites_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.stats_journalieres ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_direction_all_authenticated" ON public.messages_direction;
CREATE POLICY "messages_direction_all_authenticated" ON public.messages_direction FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "employes_presence_all_authenticated" ON public.employes_presence;
CREATE POLICY "employes_presence_all_authenticated" ON public.employes_presence FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "visites_en_cours_all_authenticated" ON public.visites_en_cours;
CREATE POLICY "visites_en_cours_all_authenticated" ON public.visites_en_cours FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "activites_journal_all_authenticated" ON public.activites_journal;
CREATE POLICY "activites_journal_all_authenticated" ON public.activites_journal FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "stats_journalieres_all_authenticated" ON public.stats_journalieres;
CREATE POLICY "stats_journalieres_all_authenticated" ON public.stats_journalieres FOR ALL TO authenticated USING (true) WITH CHECK (true);

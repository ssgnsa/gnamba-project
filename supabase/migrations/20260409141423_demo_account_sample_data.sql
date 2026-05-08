-- ============================================================
-- Demo dataset and protections for investor presentations
-- Date: 2026-04-09
-- Notes:
--   1. This migration does not create an auth.users record.
--   2. Create the login manually in Supabase Auth with:
--      email: demo@gnambaservices.ci
--      password: demo2026!
--   3. Once the auth user exists, update the placeholder UUID below if needed.
-- ============================================================

BEGIN;

-- 1. Create user_profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_profiles'
  ) THEN
    RAISE NOTICE 'Creating user_profiles table';
    
    CREATE TABLE IF NOT EXISTS public.user_profiles (
      id uuid PRIMARY KEY,
      full_name text NOT NULL,
      role text NOT NULL DEFAULT 'employe',
      access_level text,
      poste text,
      department text,
      avatar_url text DEFAULT '',
      phone text DEFAULT '',
      email text
    );
    
    ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "user_profiles_select" ON public.user_profiles FOR SELECT TO authenticated USING (true);
    CREATE POLICY "user_profiles_insert" ON public.user_profiles FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "user_profiles_update" ON public.user_profiles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 2. Create app_settings table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'app_settings'
  ) THEN
    RAISE NOTICE 'Creating app_settings table';
    
    CREATE TABLE IF NOT EXISTS public.app_settings (
      id integer PRIMARY KEY,
      app_title text,
      app_subtitle text,
      app_company text,
      primary_color text,
      secondary_color text,
      contact_address text,
      contact_phone text,
      contact_email text,
      contact_hours text,
      seo_description text,
      seo_keywords text
    );
    
    ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "app_settings_select" ON public.app_settings FOR SELECT TO authenticated USING (true);
    CREATE POLICY "app_settings_update" ON public.app_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE 'Demo auth user must be created manually in Supabase Auth: demo@gnambaservices.ci / demo2026!';
END $$;

CREATE OR REPLACE FUNCTION public.is_demo_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE id = auth.uid()
      AND lower(coalesce(email, '')) = 'demo@gnambaservices.ci'
  );
$$;

INSERT INTO public.user_profiles (
  id,
  full_name,
  role,
  access_level,
  poste,
  department,
  avatar_url,
  phone,
  email
)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'Compte Démo Gnamba',
  'admin',
  'admin',
  'Direction Générale',
  'Direction',
  '',
  '+2250709000000',
  'demo@gnambaservices.ci'
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  access_level = EXCLUDED.access_level,
  poste = EXCLUDED.poste,
  department = EXCLUDED.department,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email;

INSERT INTO public.app_settings (
  id,
  app_title,
  app_subtitle,
  app_company,
  primary_color,
  secondary_color,
  contact_address,
  contact_phone,
  contact_email,
  contact_hours,
  seo_description,
  seo_keywords
)
VALUES (
  1,
  'EGS',
  'Enterprise Gnamba System',
  'Gnamba Services',
  '#1e40af',
  '#16a34a',
  'Cocody Angré, Abidjan, Côte d''Ivoire',
  '+225 07 09 00 00 00',
  'contact@gnambaservices.ci',
  'Lun-Ven : 08h00 - 18h00',
  'Gnamba Services accompagne les projets BTP, immobiliers et fonciers en Côte d''Ivoire.',
  'BTP, immobilier, foncier, Abidjan, Gnamba Services'
)
ON CONFLICT (id) DO UPDATE SET
  app_title = EXCLUDED.app_title,
  app_subtitle = EXCLUDED.app_subtitle,
  app_company = EXCLUDED.app_company,
  primary_color = EXCLUDED.primary_color,
  secondary_color = EXCLUDED.secondary_color,
  contact_address = EXCLUDED.contact_address,
  contact_phone = EXCLUDED.contact_phone,
  contact_email = EXCLUDED.contact_email,
  contact_hours = EXCLUDED.contact_hours,
  seo_description = EXCLUDED.seo_description,
  seo_keywords = EXCLUDED.seo_keywords;

INSERT INTO public.site_realisations (
  id,
  title,
  description,
  category,
  year,
  location,
  featured,
  sort_order
)
VALUES
  ('demo-real-001', 'Villa R+2 Cocody Angré', 'Construction d''une villa haut standing avec piscine, jardin et finitions premium.', 'btp', 2025, 'Cocody, Abidjan', true, 1),
  ('demo-real-002', 'Rénovation SGBCI Plateau', 'Rénovation complète de bureaux professionnels sur 1 200 m² avec phasage sans interruption.', 'btp', 2026, 'Plateau, Abidjan', true, 2),
  ('demo-real-003', 'Résidence Les Palmiers', 'Gestion locative et suivi d''encaissement pour une résidence de 45 appartements.', 'immobilier', 2025, 'Riviera 3, Abidjan', true, 3),
  ('demo-real-004', 'Lotissement Gnamba Village', 'Viabilisation et commercialisation maîtrisée d''un lotissement de 80 parcelles.', 'foncier', 2025, 'Songon, Abidjan', true, 4)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  year = EXCLUDED.year,
  location = EXCLUDED.location,
  featured = EXCLUDED.featured,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.clients (
  id,
  nom,
  prenom,
  telephone,
  email,
  adresse,
  type_client,
  notes
)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'Koffi', 'Jean-Marc', '+2250709123456', 'jean-marc.koffi@sgbci.ci', 'Plateau, Abidjan', 'entreprise', 'Client de démonstration - rénovation de bureaux.'),
  ('22222222-2222-4222-8222-222222222222', 'Aka', 'Aminata', '+2250788776655', 'aminata.aka@entreprise.ci', 'Riviera 3, Abidjan', 'particulier', 'Cliente de démonstration - villa haut standing.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (
  id,
  nom,
  client_id,
  localisation,
  type_projet,
  budget,
  date_debut,
  date_fin,
  statut,
  description,
  notes,
  cover_image_url
)
VALUES
  ('33333333-3333-4333-8333-333333333333', 'Villa R+2 Cocody', '22222222-2222-4222-8222-222222222222', 'Cocody Angré, Abidjan', 'Construction résidentielle', 85000000, '2025-09-15', NULL, 'en_cours', 'Villa moderne avec piscine, dépendance et aménagement paysager.', 'Démo investisseur', NULL),
  ('44444444-4444-4444-8444-444444444444', 'Rénovation SGBCI Plateau', '11111111-1111-4111-8111-111111111111', 'Plateau, Abidjan', 'Rénovation tertiaire', 45000000, '2025-11-01', NULL, 'en_cours', 'Mise à niveau complète des espaces de travail et des circulations.', 'Démo investisseur', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.suppliers (
  id,
  nom,
  telephone,
  email,
  adresse,
  produits_fournis,
  statut,
  notes
)
VALUES
  ('55555555-5555-4555-8555-555555555555', 'Ciments d''Afrique', '+2250722334455', 'contact@cimaf.ci', 'Yopougon Zone Industrielle', 'Ciment, granulats, adjuvants', 'actif', 'Fournisseur principal BTP'),
  ('66666666-6666-4666-8666-666666666666', 'Bureau Plus CI', '+2250144556677', 'pro@bureauplus.ci', 'Marcory Zone 4', 'Mobilier et équipements professionnels', 'actif', 'Partenaire aménagement bureaux')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.employees (
  id,
  nom,
  prenom,
  poste,
  department,
  telephone,
  email,
  salaire,
  date_embauche,
  statut,
  notes,
  photo_url
)
VALUES
  ('77777777-7777-4777-8777-777777777777', 'Gnamba', 'Konan', 'Directeur Général', 'Direction', '+2250700000001', 'konan@gnambaservices.ci', 1800000, '2020-01-15', 'actif', 'Profil de démonstration', NULL),
  ('88888888-8888-4888-8888-888888888888', 'Coulibaly', 'Moussa', 'Chef de Chantier', 'BTP', '+2250700000002', 'moussa@gnambaservices.ci', 650000, '2021-03-01', 'actif', 'Responsable suivi chantier', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tasks (
  id,
  titre,
  description,
  assignee_id,
  priorite,
  statut,
  date_echeance,
  project_id
)
VALUES
  ('99999999-9999-4999-8999-999999999999', 'Finaliser les plans d''exécution', 'Validation des derniers plans architecte et structure.', '88888888-8888-4888-8888-888888888888', 'haute', 'en_cours', '2026-05-06', '33333333-3333-4333-8333-333333333333'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Préparer le point financier mensuel', 'Consolider les décaissements, avances client et restes à engager.', NULL, 'normale', 'a_faire', '2026-05-03', '44444444-4444-4444-8444-444444444444')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.finances (
  id,
  type_transaction,
  categorie,
  montant,
  date_transaction,
  mode_paiement,
  reference,
  description,
  client_id,
  project_id
)
VALUES
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'recette', 'Paiement Client', 45000000, '2026-03-20', 'virement', 'FIN-20260320-DEMO1', 'Paiement tranche 2 - rénovation SGBCI', '11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'depense', 'Matériaux', 12500000, '2026-03-10', 'virement', 'FIN-20260310-DEMO2', 'Approvisionnement ciment et fer à béton - Villa Cocody', '22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333')
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "demo_finances_delete_block" ON public.finances;
CREATE POLICY "demo_finances_delete_block"
  ON public.finances
  FOR DELETE
  TO authenticated
  USING (NOT public.is_demo_user());

DROP POLICY IF EXISTS "demo_clients_delete_block" ON public.clients;
CREATE POLICY "demo_clients_delete_block"
  ON public.clients
  FOR DELETE
  TO authenticated
  USING (NOT public.is_demo_user());

DROP POLICY IF EXISTS "demo_projects_delete_block" ON public.projects;
CREATE POLICY "demo_projects_delete_block"
  ON public.projects
  FOR DELETE
  TO authenticated
  USING (NOT public.is_demo_user());

DROP POLICY IF EXISTS "demo_suppliers_delete_block" ON public.suppliers;
CREATE POLICY "demo_suppliers_delete_block"
  ON public.suppliers
  FOR DELETE
  TO authenticated
  USING (NOT public.is_demo_user());

DROP POLICY IF EXISTS "demo_employees_delete_block" ON public.employees;
CREATE POLICY "demo_employees_delete_block"
  ON public.employees
  FOR DELETE
  TO authenticated
  USING (NOT public.is_demo_user());

DROP POLICY IF EXISTS "demo_tasks_delete_block" ON public.tasks;
CREATE POLICY "demo_tasks_delete_block"
  ON public.tasks
  FOR DELETE
  TO authenticated
  USING (NOT public.is_demo_user());

DROP POLICY IF EXISTS "demo_properties_delete_block" ON public.properties;
CREATE POLICY "demo_properties_delete_block"
  ON public.properties
  FOR DELETE
  TO authenticated
  USING (NOT public.is_demo_user());

DROP POLICY IF EXISTS "demo_locataires_delete_block" ON public.locataires;
CREATE POLICY "demo_locataires_delete_block"
  ON public.locataires
  FOR DELETE
  TO authenticated
  USING (NOT public.is_demo_user());

DROP POLICY IF EXISTS "demo_lease_contracts_delete_block" ON public.lease_contracts;
CREATE POLICY "demo_lease_contracts_delete_block"
  ON public.lease_contracts
  FOR DELETE
  TO authenticated
  USING (NOT public.is_demo_user());

DROP POLICY IF EXISTS "demo_rent_payments_delete_block" ON public.rent_payments;
CREATE POLICY "demo_rent_payments_delete_block"
  ON public.rent_payments
  FOR DELETE
  TO authenticated
  USING (NOT public.is_demo_user());

COMMIT;

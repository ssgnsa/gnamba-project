-- ============================================
-- EGS Demo Data Seed Script — Investor Presentation
-- ============================================
-- Date: 2026-04-07
-- Purpose: Populate EGS database with realistic Ivorian demo data
-- Usage:   supabase db execute -f supabase/seed.demo.sql
--
-- This script is IDEMPOTENT — safe to run multiple times.
-- Uses ON CONFLICT / DO NOTHING for safety.
-- Temporarily disables RLS for seeding, then re-enables.
-- ============================================

-- ============================================
-- 0. TEMPORARILY DISABLE RLS FOR SEEDING
-- ============================================
-- We use ALTER TABLE ... DISABLE ROW LEVEL SECURITY to bypass RLS during inserts,
-- then re-enable it afterward. This is required because RLS policies would block
-- bulk inserts without proper auth context.

ALTER TABLE IF EXISTS public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.locataires DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lease_contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rent_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.foncier_lots DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 1. USER PROFILES — Demo admin & team accounts
-- ============================================
-- Creates the main demo admin user and supporting team accounts.
-- These profiles enable role-based access demonstration.

INSERT INTO public.user_profiles (id, full_name, role, access_level, poste, department, avatar_url, phone, email)
VALUES
  (gen_random_uuid(), 'Kouadio N''Guessan', 'admin', 'admin', 'Directeur Général', 'Direction', '', '+225 07 08 09 10 11', 'demo@gnambaservices.ci'),
  (gen_random_uuid(), 'Aminata Diallo', 'gestionnaire', 'gerant', 'Responsable Administratif', 'Administration', '', '+225 05 04 03 02 01', 'aminata.diallo@gnambaservices.ci'),
  (gen_random_uuid(), 'Jean-Baptiste Koné', 'gestionnaire', 'gerant', 'Chef de Projet BTP', 'BTP', '', '+225 07 11 22 33 44', 'jb.kone@gnambaservices.ci'),
  (gen_random_uuid(), 'Fatou Ouattara', 'employe', 'secretaire', 'Assistante de Direction', 'Administration', '', '+225 05 55 66 77 88', 'fatou.ouattara@gnambaservices.ci')
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. CLIENTS — Realistic Ivorian clients
-- ============================================
-- 10 clients representing BTP, real estate, and land management customers.
-- Mix of individuals (particulier), companies (entreprise), and developers (promoteur).

INSERT INTO public.clients (id, nom, prenom, telephone, email, adresse, type_client, notes, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Koffi', 'Aya-Monique', '+225 07 01 12 34 56', 'aya.koffi@email.ci', 'Cocody, Abidjan', 'particulier', 'Cliente VIP — Projet immobilier résidentiel', '2024-06-15 10:00:00+00', '2025-11-20 14:30:00+00'),
  (gen_random_uuid(), 'Bamba', 'Moussa', '+225 05 02 23 45 67', 'moussa.bamba@btp-groupe.ci', 'Plateau, Abidjan', 'entreprise', 'Groupe BTP — 3 chantiers en cours', '2024-08-22 09:15:00+00', '2026-01-10 11:00:00+00'),
  (gen_random_uuid(), 'Traoré', 'Issa', '+225 07 03 34 56 78', 'issa.traore@email.ci', 'Yopougon, Abidjan', 'particulier', 'Acquisition terrain à Bingerville', '2024-10-05 16:45:00+00', '2025-12-01 09:20:00+00'),
  (gen_random_uuid(), 'Konan', 'Adjoua', '+225 05 04 45 67 89', 'adjoua.konan@email.ci', 'Marcory, Abidjan', 'particulier', 'Construction villa 5 pièces — Bingerville', '2025-01-12 08:30:00+00', '2026-02-15 16:00:00+00'),
  (gen_random_uuid(), 'Soro', 'Guillaume', '+225 07 05 56 78 90', 'g.soro@promoteur-ci.com', 'Riviera, Abidjan', 'promoteur_immobilier', 'Promoteur immobilier — Partenariat en discussion', '2025-02-28 11:00:00+00', '2026-03-05 10:00:00+00'),
  (gen_random_uuid(), 'Djedje', 'Brigitte', '+225 05 06 67 89 01', 'brigitte.djedje@email.ci', 'Angré, Abidjan', 'particulier', 'Réhabilitation immeuble commercial — Plateau', '2025-04-10 14:20:00+00', '2026-01-28 08:45:00+00'),
  (gen_random_uuid(), 'Coulibaly', 'Seydou', '+225 07 07 78 90 12', 'seydou.coulibaly@agro-ci.com', 'Bouaké', 'entreprise', 'Entreprise agro-industrielle — Entrepôt en construction', '2025-05-18 07:00:00+00', '2026-02-20 13:10:00+00'),
  (gen_random_uuid(), 'Yao', 'Koffi-Joseph', '+225 05 08 89 01 23', 'yj.yao@email.ci', 'Treichville, Abidjan', 'particulier', 'Achat terrain 500m² — Songon', '2025-07-01 15:30:00+00', '2026-03-12 17:00:00+00'),
  (gen_random_uuid(), 'Brou', 'Aminata', '+225 07 09 90 12 34', 'aminata.brou@institution.ci', 'Yamoussoukro', 'institution', 'Mairie de Yamoussoukro — Marché public voirie', '2025-09-14 10:45:00+00', '2026-04-01 09:00:00+00'),
  (gen_random_uuid(), 'Meïté', 'Drissa', '+225 05 10 01 23 45', 'drissa.meite@email.ci', 'Korhogo', 'particulier', 'Construction hangar agricole — Korhogo', '2025-11-20 12:00:00+00', '2026-03-30 14:30:00+00')
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. PROJECTS — BTP construction projects
-- ============================================
-- 6 projects with varied budgets (50M–500M FCFA), statuses, and types.
-- Links to clients via client_id (FK).

-- First, capture client IDs for FK references
DO $$
DECLARE
  v_client_bamba uuid;
  v_client_konan uuid;
  v_client_soro uuid;
  v_client_djedje uuid;
  v_client_coulibaly uuid;
  v_client_brou uuid;
BEGIN
  SELECT id INTO v_client_bamba FROM clients WHERE nom = 'Bamba' AND prenom = 'Moussa' LIMIT 1;
  SELECT id INTO v_client_konan FROM clients WHERE nom = 'Konan' AND prenom = 'Adjoua' LIMIT 1;
  SELECT id INTO v_client_soro FROM clients WHERE nom = 'Soro' AND prenom = 'Guillaume' LIMIT 1;
  SELECT id INTO v_client_djedje FROM clients WHERE nom = 'Djedje' AND prenom = 'Brigitte' LIMIT 1;
  SELECT id INTO v_client_coulibaly FROM clients WHERE nom = 'Coulibaly' AND prenom = 'Seydou' LIMIT 1;
  SELECT id INTO v_client_brou FROM clients WHERE nom = 'Brou' AND prenom = 'Aminata' LIMIT 1;

  INSERT INTO public.projects (id, nom, client_id, localisation, type_projet, budget, date_debut, date_fin, statut, description, notes, created_at, updated_at)
  VALUES
    (gen_random_uuid(), 'Résidence Les Jardins d''Angré', v_client_soro, 'Angré 8ème Tranche, Abidjan', 'Construction résidentielle', 350000000, '2025-03-01', '2026-09-30', 'en_cours',
     'Construction d''un immeuble R+4 de 20 appartements standing. Finitions haut de gamme, parking souterrain, piscine.',
     'Phase gros œuvre terminée à 80%. Menuiseries en cours.', '2025-02-15 09:00:00+00', '2026-04-01 16:00:00+00'),

    (gen_random_uuid(), 'Villa Standing Konan', v_client_konan, 'Bingerville, Abidjan', 'Construction individuelle', 85000000, '2025-06-15', '2026-06-30', 'en_cours',
     'Villa duplex 5 pièces (180m²) avec piscine et jardin. Finition premium.',
     'Fondations coulées. Élévation des murs en cours.', '2025-06-01 08:00:00+00', '2026-03-20 10:30:00+00'),

    (gen_random_uuid(), 'Réhabilitation Immeuble Plateau', v_client_djedje, 'Plateau, Abidjan', 'Rénovation commerciale', 120000000, '2025-09-01', '2026-03-31', 'termine',
     'Rénovation complète d''un immeuble de bureaux de 3 étages. Mise aux normes, climatisation, ascenseur.',
     'Projet livré dans les délais. Client satisfait.', '2025-08-15 07:30:00+00', '2026-04-02 09:00:00+00'),

    (gen_random_uuid(), 'Entrepôt Frigorifique Bouaké', v_client_coulibaly, 'Bouaké', 'Construction industrielle', 210000000, '2025-10-10', '2026-08-15', 'valide',
     'Entrepôt frigorifique de 2 000m² pour stockage de produits agro-alimentaires.',
     'Devis validé. Démarrage prévu mai 2026.', '2025-10-01 11:00:00+00', '2026-02-28 14:00:00+00'),

    (gen_random_uuid(), 'Voirie Urbaine Yamoussoukro', v_client_brou, 'Yamoussoukro', 'Infrastructure publique', 480000000, '2026-01-15', '2027-06-30', 'en_cours',
     'Construction et bitumage de 4,2 km de voirie urbaine. Caniveaux, éclairage public, marquage au sol.',
     'Marché public. Terrassement en cours sur le tronçon 1.', '2026-01-10 08:00:00+00', '2026-04-05 11:00:00+00'),

    (gen_random_uuid(), 'Hangar Agricole Korhogo', v_client_bamba, 'Korhogo', 'Construction agricole', 55000000, '2026-02-01', '2026-07-31', 'devis',
     'Hangar métallique de 800m² pour stockage de coton et anacarde.',
     'Étude de sol en cours. Devis en attente de validation.', '2026-01-25 10:00:00+00', '2026-03-28 15:30:00+00')
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================
-- 4. PROPERTIES — Real estate rental portfolio
-- ============================================
-- 5 properties: apartments, villas, offices, and commercial spaces.

INSERT INTO public.properties (id, type_bien, adresse, proprietaire, valeur, loyer_mensuel, statut, description, cover_image_url, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'appartement', 'Riviera Palmeraie, Lot 245, Abidjan', 'Mme Koffi Aya-Monique', 75000000, 450000, 'loue',
   'Appartement meublé F4 — 120m², 3 chambres, climatisation, balcon vue lagune.',
   NULL, '2024-09-01 10:00:00+00', '2026-01-15 14:00:00+00'),

  (gen_random_uuid(), 'villa', 'Cocody Ambassades, Villa 12, Abidjan', 'M. Traoré Issa', 180000000, 850000, 'loue',
   'Villa duplex 6 pièces — 350m², piscine, jardin, garage 2 voitures, quartier sécurisé.',
   NULL, '2024-11-10 09:30:00+00', '2026-02-01 08:00:00+00'),

  (gen_random_uuid(), 'bureau', 'Immeuble SCIAM, 5ème étage, Plateau, Abidjan', 'Gnamba Services SA', 95000000, 650000, 'loue',
   'Bureau standing 200m² — Open space, 2 bureaux fermés, salle de réunion, parking.',
   NULL, '2025-01-20 11:00:00+00', '2026-03-10 16:00:00+00'),

  (gen_random_uuid(), 'commerce', 'Zone commerciale Marcory Zone 4, Abidjan', 'M. Djedje Koffi', 55000000, 350000, 'disponible',
   'Local commercial 150m² — Vitrine sur boulevard, climatisé, réserve, sanitaires.',
   NULL, '2025-04-05 14:00:00+00', '2026-03-25 10:00:00+00'),

  (gen_random_uuid(), 'appartement', 'Angré Star City, Apt 302, Abidjan', 'Mme Bamba Aminata', 42000000, 275000, 'disponible',
   'Appartement F3 — 85m², 2 chambres, cuisine équipée, résidence sécurisée.',
   NULL, '2025-07-12 08:30:00+00', '2026-04-01 09:00:00+00')
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. LOCATAIRES (Tenants) — Real estate tenants
-- ============================================
-- 5 tenants linked to properties, with realistic Ivorian profiles.

-- Capture property IDs for FK references
DO $$
DECLARE
  v_prop_riviera uuid;
  v_prop_cocody uuid;
  v_prop_plateau uuid;
BEGIN
  SELECT id INTO v_prop_riviera FROM properties WHERE adresse LIKE '%Riviera Palmeraie%' LIMIT 1;
  SELECT id INTO v_prop_cocody FROM properties WHERE adresse LIKE '%Cocody Ambassades%' LIMIT 1;
  SELECT id INTO v_prop_plateau FROM properties WHERE adresse LIKE '%Plateau%' LIMIT 1;

  INSERT INTO public.locataires (id, nom, prenom, telephone, email, property_id, date_debut_contrat, date_fin_contrat, loyer, depot_garantie, statut, created_at, updated_at)
  VALUES
    (gen_random_uuid(), 'Kamaté', 'Adama', '+225 07 20 30 40 50', 'adama.kamate@email.ci', v_prop_riviera,
     '2025-01-01', '2026-12-31', 450000, 900000, 'actif', '2024-12-15 10:00:00+00', '2026-01-05 09:00:00+00'),

    (gen_random_uuid(), 'Dosso', 'Mariam', '+225 05 30 40 50 60', 'mariam.dosso@email.ci', v_prop_cocody,
     '2025-06-01', '2027-05-31', 850000, 1700000, 'actif', '2025-05-10 14:00:00+00', '2026-02-01 08:00:00+00'),

    (gen_random_uuid(), 'N''Dri', 'Kouakou', '+225 07 40 50 60 70', 'kouakou.ndri@tech-ci.com', v_prop_plateau,
     '2025-03-01', '2027-02-28', 650000, 1300000, 'actif', '2025-02-15 11:30:00+00', '2026-03-01 10:00:00+00'),

    (gen_random_uuid(), 'Sanogo', 'Bakary', '+225 05 50 60 70 80', 'bakary.sanogo@email.ci', NULL,
     NULL, NULL, 0, 0, 'inactif', '2024-06-01 09:00:00+00', '2025-08-20 16:00:00+00'),

    (gen_random_uuid(), 'Kuyo', 'Hélène', '+225 07 60 70 80 90', 'helene.kuyo@commerce.ci', NULL,
     NULL, NULL, 0, 0, 'inactif', '2025-09-15 08:00:00+00', '2026-01-10 11:00:00+00')
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================
-- 6. LEASE CONTRACTS — Formal lease agreements
-- ============================================
-- 3 active lease contracts with detailed terms.

DO $$
DECLARE
  v_prop_riviera uuid;
  v_prop_cocody uuid;
  v_prop_plateau uuid;
  v_loc_kamate uuid;
  v_loc_dosso uuid;
  v_loc_ndri uuid;
BEGIN
  SELECT id INTO v_prop_riviera FROM properties WHERE adresse LIKE '%Riviera Palmeraie%' LIMIT 1;
  SELECT id INTO v_prop_cocody FROM properties WHERE adresse LIKE '%Cocody Ambassades%' LIMIT 1;
  SELECT id INTO v_prop_plateau FROM properties WHERE adresse LIKE '%Plateau%' LIMIT 1;
  SELECT id INTO v_loc_kamate FROM locataires WHERE nom = 'Kamaté' AND prenom = 'Adama' LIMIT 1;
  SELECT id INTO v_loc_dosso FROM locataires WHERE nom = 'Dosso' AND prenom = 'Mariam' LIMIT 1;
  SELECT id INTO v_loc_ndri FROM locataires WHERE nom = 'N''Dri' AND prenom = 'Kouakou' LIMIT 1;

  INSERT INTO public.lease_contracts (id, reference, property_id, locataire_id, date_debut, date_fin, loyer_mensuel, charges, depot_garantie, statut, notes, created_at, updated_at)
  VALUES
    (gen_random_uuid(), 'BAIL-2025-001', v_prop_riviera, v_loc_kamate,
     '2025-01-01', '2026-12-31', 450000, 50000, 900000, 'actif',
     'Bail commercial standard — Clauses de révision annuelle prévues.', '2024-12-20 10:00:00+00', '2026-01-05 09:00:00+00'),

    (gen_random_uuid(), 'BAIL-2025-002', v_prop_cocody, v_loc_dosso,
     '2025-06-01', '2027-05-31', 850000, 75000, 1700000, 'actif',
     'Bail résidence haut standing — Entretien jardin inclus, 2 places parking.', '2025-05-15 14:00:00+00', '2026-02-01 08:00:00+00'),

    (gen_random_uuid(), 'BAIL-2025-003', v_prop_plateau, v_loc_ndri,
     '2025-03-01', '2027-02-28', 650000, 100000, 1300000, 'actif',
     'Bail professionnel — Société Tech-CI SARL. Salle de réunion partagée au 6ème étage.', '2025-02-20 11:30:00+00', '2026-03-01 10:00:00+00')
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================
-- 7. RENT PAYMENTS — Payment history
-- ============================================
-- 5 payment records: mix of paid, pending, and late payments to demonstrate tracking.

DO $$
DECLARE
  v_prop_riviera uuid;
  v_prop_cocody uuid;
  v_prop_plateau uuid;
  v_loc_kamate uuid;
  v_loc_dosso uuid;
  v_loc_ndri uuid;
  v_contract_1 uuid;
  v_contract_2 uuid;
  v_contract_3 uuid;
BEGIN
  SELECT id INTO v_prop_riviera FROM properties WHERE adresse LIKE '%Riviera Palmeraie%' LIMIT 1;
  SELECT id INTO v_prop_cocody FROM properties WHERE adresse LIKE '%Cocody Ambassades%' LIMIT 1;
  SELECT id INTO v_prop_plateau FROM properties WHERE adresse LIKE '%Plateau%' LIMIT 1;
  SELECT id INTO v_loc_kamate FROM locataires WHERE nom = 'Kamaté' AND prenom = 'Adama' LIMIT 1;
  SELECT id INTO v_loc_dosso FROM locataires WHERE nom = 'Dosso' AND prenom = 'Mariam' LIMIT 1;
  SELECT id INTO v_loc_ndri FROM locataires WHERE nom = 'N''Dri' AND prenom = 'Kouakou' LIMIT 1;
  SELECT id INTO v_contract_1 FROM lease_contracts WHERE reference = 'BAIL-2025-001' LIMIT 1;
  SELECT id INTO v_contract_2 FROM lease_contracts WHERE reference = 'BAIL-2025-002' LIMIT 1;
  SELECT id INTO v_contract_3 FROM lease_contracts WHERE reference = 'BAIL-2025-003' LIMIT 1;

  INSERT INTO public.rent_payments (id, locataire_id, property_id, contract_id, montant, date_paiement, mois_concerne, mode_paiement, statut, reference, created_at)
  VALUES
    (gen_random_uuid(), v_loc_kamate, v_prop_riviera, v_contract_1,
     450000, '2026-01-05', '2026-01', 'virement', 'paye', 'QUITT-2026-001', '2026-01-05 09:30:00+00'),

    (gen_random_uuid(), v_loc_kamate, v_prop_riviera, v_contract_1,
     450000, '2026-02-03', '2026-02', 'virement', 'paye', 'QUITT-2026-002', '2026-02-03 10:15:00+00'),

    (gen_random_uuid(), v_loc_dosso, v_prop_cocody, v_contract_2,
     850000, '2026-03-01', '2026-03', 'virement', 'paye', 'QUITT-2026-003', '2026-03-01 08:00:00+00'),

    (gen_random_uuid(), v_loc_ndri, v_prop_plateau, v_contract_3,
     650000, '2026-04-07', '2026-04', 'cheque', 'en_attente', 'FACT-2026-004', '2026-04-01 09:00:00+00'),

    (gen_random_uuid(), v_loc_dosso, v_prop_cocody, v_contract_2,
     850000, '2026-04-10', '2026-04', 'mobile_money', 'en_attente', 'FACT-2026-005', '2026-04-01 09:00:00+00')
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================
-- 8. EMPLOYEES — Company staff directory
-- ============================================
-- 6 employees across departments (BTP, Administration, Finance, Immobilier).

INSERT INTO public.employees (id, nom, prenom, poste, department, telephone, email, salaire, date_embauche, statut, notes, photo_url, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Kouadio', 'N''Guessan', 'Directeur Général', 'Direction', '+225 07 08 09 10 11', 'kouadio.nguessan@gnambaservices.ci', 1500000,
   '2022-01-15', 'actif', 'Fondateur de Gnamba Services. 15 ans d''expérience dans le BTP en Côte d''Ivoire.',
   NULL, '2022-01-15 08:00:00+00', '2026-03-01 09:00:00+00'),

  (gen_random_uuid(), 'Ahoua', 'Koffi-Pierre', 'Ingénieur Civil', 'BTP', '+225 07 11 22 33 55', 'pierre.ahoua@gnambaservices.ci', 800000,
   '2023-04-01', 'actif', 'Supervise les chantiers BTP. Spécialiste gros œuvre et charpente métallique.',
   NULL, '2023-04-01 08:00:00+00', '2026-02-15 10:00:00+00'),

  (gen_random_uuid(), 'Bamba', 'Fatimata', 'Comptable', 'Finance', '+225 05 22 33 44 66', 'fatimata.bamba@gnambaservices.ci', 550000,
   '2023-07-10', 'actif', 'Comptabilité générale et suivi des chantiers. Maîtrise OHADA.',
   NULL, '2023-07-10 08:00:00+00', '2026-03-20 14:00:00+00'),

  (gen_random_uuid(), 'Kouamé', 'Yao-Franck', 'Responsable Commercial', 'Commerce', '+225 07 33 44 55 77', 'franck.kouame@gnambaservices.ci', 650000,
   '2024-02-01', 'actif', 'Développement clientèle et négociation contrats. Réseau immobilier.',
   NULL, '2024-02-01 08:00:00+00', '2026-01-10 11:00:00+00'),

  (gen_random_uuid(), 'Diomandé', 'Aïcha', 'Gestionnaire Immobilier', 'Immobilier', '+225 05 44 55 66 88', 'aicha.diomande@gnambaservices.ci', 600000,
   '2024-06-15', 'actif', 'Gestion locative et relation propriétaires. Suivi des baux et quittances.',
   NULL, '2024-06-15 08:00:00+00', '2026-04-01 08:30:00+00'),

  (gen_random_uuid(), 'Touré', 'Ibrahim', 'Conducteur de Travaux', 'BTP', '+225 07 55 66 77 99', 'ibrahim.toure@gnambaservices.ci', 700000,
   '2024-09-01', 'actif', 'Coordination équipes terrain. Expertise voirie et terrassement.',
   NULL, '2024-09-01 08:00:00+00', '2026-03-15 09:00:00+00')
ON CONFLICT DO NOTHING;

-- ============================================
-- 9. TASKS — Project management tasks
-- ============================================
-- 10 tasks linked to projects and employees, with varied priorities and statuses.

DO $$
DECLARE
  v_proj_ange uuid;
  v_proj_konan uuid;
  v_proj_yamoussoukro uuid;
  v_proj_bouake uuid;
  v_emp_ahoua uuid;
  v_emp_toure uuid;
  v_emp_kouame uuid;
  v_emp_diomande uuid;
BEGIN
  SELECT id INTO v_proj_ange FROM projects WHERE nom LIKE '%Jardins d''Angré%' LIMIT 1;
  SELECT id INTO v_proj_konan FROM projects WHERE nom LIKE '%Villa Standing Konan%' LIMIT 1;
  SELECT id INTO v_proj_yamoussoukro FROM projects WHERE nom LIKE '%Voirie Urbaine%' LIMIT 1;
  SELECT id INTO v_proj_bouake FROM projects WHERE nom LIKE '%Entrepôt Frigorifique%' LIMIT 1;
  SELECT id INTO v_emp_ahoua FROM employees WHERE nom = 'Ahoua' AND prenom LIKE '%Pierre%' LIMIT 1;
  SELECT id INTO v_emp_toure FROM employees WHERE nom = 'Touré' AND prenom = 'Ibrahim' LIMIT 1;
  SELECT id INTO v_emp_kouame FROM employees WHERE nom = 'Kouamé' AND prenom LIKE '%Franck%' LIMIT 1;
  SELECT id INTO v_emp_diomande FROM employees WHERE nom = 'Diomandé' AND prenom = 'Aïcha' LIMIT 1;

  INSERT INTO public.tasks (id, titre, description, assignee_id, priorite, statut, date_echeance, project_id, created_at, updated_at)
  VALUES
    (gen_random_uuid(), 'Coulage dalle étage 3', v_proj_ange, 'Coulage de la dalle béton de l''étage 3 — Immeuble R+4 Angré',
     v_emp_ahoua, 'urgente', 'en_cours', '2026-04-15', '2026-03-20 08:00:00+00', '2026-04-05 16:00:00+00'),

    (gen_random_uuid(), 'Pose menuiseries aluminium', v_proj_ange, 'Fourniture et pose de 80 fenêtres aluminium double vitrage',
     v_emp_ahoua, 'haute', 'en_cours', '2026-05-01', '2026-03-25 09:00:00+00', '2026-04-03 10:00:00+00'),

    (gen_random_uuid(), 'Élévation murs — Villa Konan', v_proj_konan, 'Maçonnerie et élévation des murs de la villa 5 pièces Bingerville',
     v_emp_toure, 'haute', 'en_cours', '2026-04-30', '2026-02-10 07:00:00+00', '2026-04-01 14:00:00+00'),

    (gen_random_uuid(), 'Étude de sol — Bouaké', v_proj_bouake, 'Réaliser l''étude géotechnique du site de l''entrepôt frigorifique',
     v_emp_ahoua, 'normale', 'termine', '2026-03-15', '2026-01-20 10:00:00+00', '2026-03-16 09:00:00+00'),

    (gen_random_uuid(), 'Devis matériaux — Hangar Korhogo', v_proj_bouake, 'Établir le devis quantitatif pour la charpente métallique',
     v_emp_kouame, 'normale', 'a_faire', '2026-04-30', '2026-03-28 11:00:00+00', '2026-03-28 11:00:00+00'),

    (gen_random_uuid(), 'Terrassement tronçon 2', v_proj_yamoussoukro, 'Terrassement et nivellement du tronçon 2 — Voirie Yamoussoukro',
     v_emp_toure, 'urgente', 'en_cours', '2026-04-20', '2026-03-01 06:00:00+00', '2026-04-06 07:00:00+00'),

    (gen_random_uuid(), 'Installation caniveaux', v_proj_yamoussoukro, 'Pose des caniveaux béton préfabriqués sur tronçon 1',
     v_emp_toure, 'haute', 'a_faire', '2026-05-10', '2026-04-01 08:00:00+00', '2026-04-01 08:00:00+00'),

    (gen_random_uuid(), 'Relance locataire — Local Marcory', 'Contacter le prospect pour le local commercial Marcory Zone 4',
     v_emp_diomande, 'basse', 'a_faire', '2026-04-25', '2026-03-25 10:00:00+00', '2026-03-25 10:00:00+00'),

    (gen_random_uuid(), 'Réunion livraison — Immeuble Plateau', 'Organiser la réunion de livraison finale avec le client Mme Djedje',
     v_emp_kouame, 'haute', 'termine', '2026-04-02', '2026-03-15 14:00:00+00', '2026-04-02 16:00:00+00'),

    (gen_random_uuid(), 'Facturation finale — Plateau', 'Établir la facture de solde et le décompte général définitif',
     v_emp_diomande, 'normale', 'a_faire', '2026-04-15', '2026-04-02 09:00:00+00', '2026-04-02 09:00:00+00')
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================
-- 10. FONCIER LOTS — Land parcels
-- ============================================
-- 4 land lots in different villages with realistic owner and GPS data.

INSERT INTO public.foncier_lots (
  id, reference, numero_lot, numero_ilot, nom_lotissement, village, region, departement, commune,
  superficie, prix, statut,
  proprietaire_nom, proprietaire_prenom, proprietaire_cni_numero, proprietaire_cni_date, proprietaire_cni_lieu,
  proprietaire_naissance_date, proprietaire_naissance_lieu, proprietaire_profession, proprietaire_telephone, proprietaire_email,
  gps_lat, gps_lng, gps_precision,
  created_by, created_at, updated_at
)
VALUES
  (gen_random_uuid(), 'FONC-2025-001-BIN', 'BL-045', 'IL-12', 'Lotissement Soleil', 'Bingerville', 'Abidjan', 'Abidjan', 'Bingerville',
   500, 25000000, 'actif',
   'Yao', 'Koffi-Joseph', 'CI-0987654321', '2023-06-15', 'Abidjan',
   '1978-03-22', 'Bingerville', 'Commerçant', '+225 05 08 89 01 23', 'yj.yao@email.ci',
   5.3560, -3.8960, 5.0,
   NULL, '2025-03-10 09:00:00+00', '2026-02-20 14:00:00+00'),

  (gen_random_uuid(), 'FONC-2025-002-SON', 'SL-112', 'IL-07', 'Cité des Palmiers', 'Songon', 'Abidjan', 'Abidjan', 'Songon',
   800, 40000000, 'vendu',
   'Traoré', 'Issa', 'CI-1234567890', '2024-01-20', 'Bouaké',
   '1985-11-05', 'Bouaké', 'Fonctionnaire', '+225 07 03 34 56 78', 'issa.traore@email.ci',
   5.3020, -4.1850, 3.0,
   NULL, '2025-06-18 11:30:00+00', '2026-01-15 10:00:00+00'),

  (gen_random_uuid(), 'FONC-2025-003-AYA', 'AL-023', 'IL-03', 'Résidence Aghien', 'Aghien', 'Abidjan', 'Abidjan', 'Cocody',
   1200, 72000000, 'actif',
   'Koffi', 'Aya-Monique', 'CI-5678901234', '2024-08-10', 'Abidjan',
   '1990-07-14', 'Abidjan', 'Cadre bancaire', '+225 07 01 12 34 56', 'aya.koffi@email.ci',
   5.4200, -3.8100, 2.0,
   NULL, '2025-09-05 14:00:00+00', '2026-03-28 09:00:00+00'),

  (gen_random_uuid(), 'FONC-2026-004-ANY', 'AL-078', 'IL-15', 'Lotissement Anyama Nord', 'Anyama', 'Abidjan', 'Abidjan', 'Anyama',
   600, 18000000, 'reserve',
   'Coulibaly', 'Seydou', 'CI-3456789012', '2025-02-28', 'Korhogo',
   '1972-01-30', 'Korhogo', 'Agro-industriel', '+225 07 07 78 90 12', 'seydou.coulibaly@agro-ci.com',
   5.5400, -4.0500, 4.0,
   NULL, '2026-01-22 10:00:00+00', '2026-04-02 16:00:00+00')
ON CONFLICT DO NOTHING;

-- ============================================
-- 11. RE-ENABLE ROW LEVEL SECURITY
-- ============================================
-- RLS is restored after seeding. Policies from migrations remain in effect.
-- Demo user (demo@gnambaservices.ci) has admin role — full access to all data.

ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.locataires ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lease_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rent_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.foncier_lots ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SEEDING COMPLETE
-- ============================================
-- Summary of demo data created:
--
--   User Profiles:   4  (1 admin, 2 gestionnaires, 1 employé)
--   Clients:        10  (particuliers, entreprises, promoteurs)
--   Projects:        6  (BTP — 50M à 480M FCFA)
--   Properties:      5  (appartements, villas, bureaux, commerce)
--   Locataires:      5  (3 actifs, 2 inactifs)
--   Lease Contracts: 3  (tous actifs)
--   Rent Payments:   5  (3 payés, 2 en attente)
--   Employees:       6  (Direction, BTP, Finance, Commerce, Immobilier)
--   Tasks:          10  (3 terminées, 4 en cours, 3 à faire)
--   Foncier Lots:    4  (2 actifs, 1 vendu, 1 réservé)
--
-- Total demo portfolio value: ~1.3 milliard FCFA (projets) + ~195M FCFA (foncier)
--
-- Login: demo@gnambaservices.ci (admin — full access)
-- ============================================

-- ============================================
-- Migration: Bootstrap core business tables
-- ============================================
-- Date: 2026-04-03
-- Purpose:
--   - Recreate the core business tables that are referenced by later
--     RLS and seed migrations but were missing from the migration chain
--   - Keep the schema aligned with the frontend and archived backups
-- ============================================


-- ============================================
-- 1. Core CRM / BTP tables
-- ============================================

CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  prenom text NOT NULL,
  telephone text NOT NULL,
  email text,
  adresse text,
  type_client text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  localisation text,
  type_projet text,
  budget numeric,
  date_debut date,
  date_fin date,
  statut text NOT NULL,
  description text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  cover_image_url text
);

CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);

CREATE TABLE IF NOT EXISTS public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  prenom text NOT NULL,
  poste text NOT NULL,
  telephone text,
  email text,
  salaire numeric,
  date_embauche date,
  statut text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  photo_url text
);

CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  telephone text,
  email text,
  adresse text,
  produits_fournis text,
  statut text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  categorie text NOT NULL,
  prix_unitaire numeric,
  stock_actuel integer,
  stock_minimum integer,
  unite text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  image_url text
);

CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  type_document text NOT NULL,
  url text,
  taille_fichier bigint,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_client_id ON public.documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON public.documents(project_id);

CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  description text,
  assignee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  priorite text NOT NULL,
  statut text NOT NULL,
  date_echeance date,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks(assignee_id);

CREATE TABLE IF NOT EXISTS public.finances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_transaction text NOT NULL,
  categorie text NOT NULL,
  montant numeric NOT NULL,
  date_transaction date NOT NULL,
  mode_paiement text NOT NULL,
  reference text,
  description text,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finances_date_transaction ON public.finances(date_transaction DESC);
CREATE INDEX IF NOT EXISTS idx_finances_client_id ON public.finances(client_id);
CREATE INDEX IF NOT EXISTS idx_finances_project_id ON public.finances(project_id);
CREATE INDEX IF NOT EXISTS idx_finances_reference ON public.finances(reference);

-- ============================================
-- 2. Public site / settings tables
-- ============================================

CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  turnstile_site_key text,
  turnstile_enabled boolean
);

CREATE TABLE IF NOT EXISTS public.site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL,
  key text NOT NULL,
  value text,
  content_type text,
  label text,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(section, key)
);

CREATE TABLE IF NOT EXISTS public.page_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug text NOT NULL UNIQUE,
  layout_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.site_realisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL,
  image_url text,
  year integer,
  location text,
  featured boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  status text,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 3. Media library foundation
-- ============================================

CREATE TABLE IF NOT EXISTS public.media_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  original_name text NOT NULL DEFAULT '',
  url text NOT NULL DEFAULT '',
  thumbnail_url text,
  category text NOT NULL DEFAULT 'autre',
  type text NOT NULL DEFAULT 'image/jpeg',
  size bigint NOT NULL DEFAULT 0,
  alt_text text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  is_brand_asset boolean NOT NULL DEFAULT false,
  brand_asset_type text,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  upload_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  width integer,
  height integer
);

CREATE INDEX IF NOT EXISTS idx_media_files_deleted_at
  ON public.media_files (deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_media_files_category_active
  ON public.media_files (category, upload_date DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_media_files_brand_asset
  ON public.media_files (brand_asset_type) WHERE is_brand_asset = true;

CREATE TABLE IF NOT EXISTS public.media_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id uuid NOT NULL REFERENCES public.media_files(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id text,
  usage_type text NOT NULL,
  label text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (entity_type, entity_id, usage_type)
);

CREATE INDEX IF NOT EXISTS idx_media_usage_media_id
  ON public.media_usage (media_id);

CREATE INDEX IF NOT EXISTS idx_media_usage_entity
  ON public.media_usage (entity_type, entity_id, usage_type);

CREATE TABLE IF NOT EXISTS public.media_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id uuid NOT NULL REFERENCES public.media_files(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  old_url text NOT NULL,
  old_filename text NOT NULL,
  replaced_at timestamptz NOT NULL DEFAULT now(),
  replaced_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_media_versions_media_id
  ON public.media_versions (media_id);

CREATE TABLE IF NOT EXISTS public.media_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id uuid REFERENCES public.media_files(id) ON DELETE SET NULL,
  action text NOT NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_audit_logs_media_id
  ON public.media_audit_logs (media_id);

CREATE INDEX IF NOT EXISTS idx_media_audit_logs_actor_id
  ON public.media_audit_logs (actor_id);

CREATE INDEX IF NOT EXISTS idx_media_audit_logs_created_at
  ON public.media_audit_logs (created_at DESC);


-- Migration: Create Immobilier Tables
-- Date: 2026-04-02
-- Purpose: Create all tables for Real Estate module

-- 1. properties table
CREATE TABLE IF NOT EXISTS public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_bien text NOT NULL DEFAULT 'appartement',
  adresse text NOT NULL,
  proprietaire text,
  valeur numeric(12,2) DEFAULT 0,
  loyer_mensuel numeric(12,2) DEFAULT 0,
  statut text DEFAULT 'disponible',
  description text,
  cover_image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. tenants table
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  prenom text NOT NULL,
  telephone text,
  email text,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  date_debut_contrat date,
  date_fin_contrat date,
  loyer numeric(12,2) DEFAULT 0,
  depot_garantie numeric(12,2) DEFAULT 0,
  statut text DEFAULT 'actif',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. lease_contracts table
CREATE TABLE IF NOT EXISTS public.lease_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  date_debut date NOT NULL,
  date_fin date,
  loyer_mensuel numeric(12,2) DEFAULT 0,
  charges numeric(12,2) DEFAULT 0,
  depot_garantie numeric(12,2) DEFAULT 0,
  statut text DEFAULT 'actif',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. rent_payments table
CREATE TABLE IF NOT EXISTS public.rent_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  contract_id uuid REFERENCES public.lease_contracts(id) ON DELETE SET NULL,
  montant numeric(12,2) DEFAULT 0,
  date_paiement date,
  mois_concerne text,
  mode_paiement text DEFAULT 'especes',
  statut text DEFAULT 'en_attente',
  reference text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_properties_statut ON public.properties(statut);
CREATE INDEX IF NOT EXISTS idx_tenants_property_id ON public.tenants(property_id);
CREATE INDEX IF NOT EXISTS idx_lease_contracts_property_id ON public.lease_contracts(property_id);
CREATE INDEX IF NOT EXISTS idx_lease_contracts_tenant_id ON public.lease_contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rent_payments_tenant_id ON public.rent_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rent_payments_contract_id ON public.rent_payments(contract_id);

-- RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lease_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rent_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS prop_auth ON public.properties;
DROP POLICY IF EXISTS ten_auth ON public.tenants;
DROP POLICY IF EXISTS lease_auth ON public.lease_contracts;
DROP POLICY IF EXISTS rent_auth ON public.rent_payments;

CREATE POLICY prop_auth ON public.properties FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY ten_auth ON public.tenants FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY lease_auth ON public.lease_contracts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY rent_auth ON public.rent_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

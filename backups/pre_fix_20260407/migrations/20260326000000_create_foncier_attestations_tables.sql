/*
  Migration: Create Foncier Attestations Tables
  Date: 2026-03-26
  Purpose: Create foncier_attestations and foncier_attestation_temoins tables
  
  CRITICAL: This migration must be run in Supabase SQL Editor before attestation generation will work.
  
  Run order:
  1. This file (create tables)
  2. 20260326000000_fix_unique_constraint.sql (unique constraints)
*/

-- ============================================
-- TABLE: foncier_attestations
-- ============================================

-- Create table if not exists
-- NOTE: lot_id FK to foncier_lots is added later (20260405150000) after foncier_lots is created
CREATE TABLE IF NOT EXISTS public.foncier_attestations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id uuid,  -- FK added later to avoid circular dependency
  reference text UNIQUE NOT NULL,
  version integer DEFAULT 1,
  type text NOT NULL DEFAULT 'standard',
  statut text NOT NULL DEFAULT 'brouillon',
  date_etablissement date,
  date_expiration timestamptz,
  mode_acquisition text,
  historique_possession text,
  domicile text,
  
  -- Cession fields
  cedant_nom text,
  cedant_prenom text,
  cedant_cni_numero text,
  cedant_telephone text,
  cedant_domicile text,
  
  -- Boundaries
  limites_nord text,
  limites_sud text,
  limites_est text,
  limites_ouest text,
  
  -- GPS
  gps_lat numeric(10, 8),
  gps_lng numeric(11, 8),
  gps_precision numeric(5, 2),
  gps_points jsonb,
  
  -- Registration
  registre_volume text,
  registre_page integer,
  registre_ligne integer,
  numero_enregistrement text,
  
  -- Security & verification
  qr_payload text,
  signature_numerique text,
  hash_sha256 text,
  control_number text,
  signature_nonce text,
  signature_issued_at timestamptz,
  
  -- Validation workflow
  validation_agent_nom text,
  validation_agent_id uuid,
  validation_agent_date timestamptz,
  validation_chef_nom text,
  validation_chef_id uuid,
  validation_chef_date timestamptz,
  
  -- Biometric & physical signature
  proprietaire_photo_url text,
  proprietaire_empreinte_url text,
  chef_signature_manuscrite_requise boolean DEFAULT true,
  chef_empreinte_url text,
  temoin_empreinte_urls jsonb,
  
  -- Revocation
  revoke_reason text,
  revoked_at timestamptz,
  revoked_by uuid REFERENCES auth.users(id),
  
  -- Audit
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  client_updated_at timestamptz,
  last_modified_device_id text,
  deleted_at timestamptz
);

-- Add missing columns if table already exists (for incremental migration)
DO $$ BEGIN
  -- Add hash_sha256 if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'foncier_attestations' AND column_name = 'hash_sha256') THEN
    ALTER TABLE public.foncier_attestations ADD COLUMN hash_sha256 text;
  END IF;
  
  -- Add revoked_at if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'foncier_attestations' AND column_name = 'revoked_at') THEN
    ALTER TABLE public.foncier_attestations ADD COLUMN revoked_at timestamptz;
  END IF;
  
  -- Add revoke_reason if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'foncier_attestations' AND column_name = 'revoke_reason') THEN
    ALTER TABLE public.foncier_attestations ADD COLUMN revoke_reason text;
  END IF;
  
  -- Add revoked_by if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'foncier_attestations' AND column_name = 'revoked_by') THEN
    ALTER TABLE public.foncier_attestations ADD COLUMN revoked_by uuid REFERENCES auth.users(id);
  END IF;
  
  -- Add gps_points if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'foncier_attestations' AND column_name = 'gps_points') THEN
    ALTER TABLE public.foncier_attestations ADD COLUMN gps_points jsonb;
  END IF;
  
  -- Add version if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'foncier_attestations' AND column_name = 'version') THEN
    ALTER TABLE public.foncier_attestations ADD COLUMN version integer DEFAULT 1;
  END IF;
  
  -- Add date_expiration if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'foncier_attestations' AND column_name = 'date_expiration') THEN
    ALTER TABLE public.foncier_attestations ADD COLUMN date_expiration timestamptz;
  END IF;
  
  -- Add proprietaire_photo_url if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'foncier_attestations' AND column_name = 'proprietaire_photo_url') THEN
    ALTER TABLE public.foncier_attestations ADD COLUMN proprietaire_photo_url text;
  END IF;
  
  -- Add proprietaire_empreinte_url if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'foncier_attestations' AND column_name = 'proprietaire_empreinte_url') THEN
    ALTER TABLE public.foncier_attestations ADD COLUMN proprietaire_empreinte_url text;
  END IF;
  
  -- Add chef_signature_manuscrite_requise if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'foncier_attestations' AND column_name = 'chef_signature_manuscrite_requise') THEN
    ALTER TABLE public.foncier_attestations ADD COLUMN chef_signature_manuscrite_requise boolean DEFAULT true;
  END IF;
  
  -- Add chef_empreinte_url if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'foncier_attestations' AND column_name = 'chef_empreinte_url') THEN
    ALTER TABLE public.foncier_attestations ADD COLUMN chef_empreinte_url text;
  END IF;
  
  -- Add temoin_empreinte_urls if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'foncier_attestations' AND column_name = 'temoin_empreinte_urls') THEN
    ALTER TABLE public.foncier_attestations ADD COLUMN temoin_empreinte_urls jsonb;
  END IF;
  
  -- Add validation_agent_nom if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'foncier_attestations' AND column_name = 'validation_agent_nom') THEN
    ALTER TABLE public.foncier_attestations ADD COLUMN validation_agent_nom text;
  END IF;
  
  -- Add validation_agent_id if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'foncier_attestations' AND column_name = 'validation_agent_id') THEN
    ALTER TABLE public.foncier_attestations ADD COLUMN validation_agent_id uuid;
  END IF;
  
  -- Add validation_agent_date if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'foncier_attestations' AND column_name = 'validation_agent_date') THEN
    ALTER TABLE public.foncier_attestations ADD COLUMN validation_agent_date timestamptz;
  END IF;
  
  -- Add validation_chef_nom if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'foncier_attestations' AND column_name = 'validation_chef_nom') THEN
    ALTER TABLE public.foncier_attestations ADD COLUMN validation_chef_nom text;
  END IF;
  
  -- Add validation_chef_id if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'foncier_attestations' AND column_name = 'validation_chef_id') THEN
    ALTER TABLE public.foncier_attestations ADD COLUMN validation_chef_id uuid;
  END IF;
  
  -- Add validation_chef_date if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'foncier_attestations' AND column_name = 'validation_chef_date') THEN
    ALTER TABLE public.foncier_attestations ADD COLUMN validation_chef_date timestamptz;
  END IF;
  
  -- Add client_updated_at if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'foncier_attestations' AND column_name = 'client_updated_at') THEN
    ALTER TABLE public.foncier_attestations ADD COLUMN client_updated_at timestamptz;
  END IF;
  
  -- Add last_modified_device_id if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'foncier_attestations' AND column_name = 'last_modified_device_id') THEN
    ALTER TABLE public.foncier_attestations ADD COLUMN last_modified_device_id text;
  END IF;

  -- Add deleted_at if missing (compatibility for older tables)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'foncier_attestations' AND column_name = 'deleted_at') THEN
    ALTER TABLE public.foncier_attestations ADD COLUMN deleted_at timestamptz;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.foncier_attestations ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_foncier_attestations_lot ON public.foncier_attestations(lot_id);
CREATE INDEX IF NOT EXISTS idx_foncier_attestations_reference ON public.foncier_attestations(reference);
CREATE INDEX IF NOT EXISTS idx_foncier_attestations_statut ON public.foncier_attestations(statut);
CREATE INDEX IF NOT EXISTS idx_foncier_attestations_revoked ON public.foncier_attestations(revoked_at) WHERE revoked_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_foncier_attestations_expiration ON public.foncier_attestations(date_expiration) WHERE date_expiration IS NOT NULL;

-- Comments
COMMENT ON TABLE public.foncier_attestations IS 'Attestations de propriété coutumière pour les lots fonciers';
COMMENT ON COLUMN public.foncier_attestations.version IS 'Version de l''attestation (incrémentée à chaque modification majeure)';
COMMENT ON COLUMN public.foncier_attestations.hash_sha256 IS 'Hash SHA-256 pour vérification d''intégrité';
COMMENT ON COLUMN public.foncier_attestations.qr_payload IS 'Données encodées dans le QR Code de vérification';
COMMENT ON COLUMN public.foncier_attestations.chef_signature_manuscrite_requise IS 'Indique que la signature manuscrite du Chef est requise';
COMMENT ON COLUMN public.foncier_attestations.date_expiration IS 'Date d''expiration de l''attestation (6 mois après émission par défaut)';
COMMENT ON COLUMN public.foncier_attestations.revoke_reason IS 'Motif de révocation: vol, perte, erreur, fraude, autre';

-- ============================================
-- TABLE: foncier_attestation_temoins
-- ============================================

CREATE TABLE IF NOT EXISTS public.foncier_attestation_temoins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attestation_id uuid REFERENCES public.foncier_attestations(id) ON DELETE CASCADE,
  nom text NOT NULL,
  prenom text NOT NULL,
  profession text,
  telephone text,
  cni text,
  empreinte_url text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.foncier_attestation_temoins ENABLE ROW LEVEL SECURITY;

-- Index
CREATE INDEX IF NOT EXISTS idx_foncier_temoins_attestation ON public.foncier_attestation_temoins(attestation_id);

-- Comment
COMMENT ON TABLE public.foncier_attestation_temoins IS 'Témoins pour les attestations de propriété coutumière';

-- ============================================
-- RLS POLICIES: foncier_attestations
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view foncier_attestations" ON public.foncier_attestations;
DROP POLICY IF EXISTS "Authenticated users can insert foncier_attestations" ON public.foncier_attestations;
DROP POLICY IF EXISTS "Authenticated users can update foncier_attestations" ON public.foncier_attestations;
DROP POLICY IF EXISTS "Admins can delete foncier_attestations" ON public.foncier_attestations;

-- SELECT: All authenticated users can view
CREATE POLICY "Authenticated users can view foncier_attestations"
  ON public.foncier_attestations FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: All authenticated users can create
CREATE POLICY "Authenticated users can insert foncier_attestations"
  ON public.foncier_attestations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: All authenticated users can update
CREATE POLICY "Authenticated users can update foncier_attestations"
  ON public.foncier_attestations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE: Only admins can delete
CREATE POLICY "Admins can delete foncier_attestations"
  ON public.foncier_attestations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- ============================================
-- RLS POLICIES: foncier_attestation_temoins
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view foncier_attestation_temoins" ON public.foncier_attestation_temoins;
DROP POLICY IF EXISTS "Authenticated users can manage foncier_attestation_temoins" ON public.foncier_attestation_temoins;

-- SELECT: All authenticated users can view
CREATE POLICY "Authenticated users can view foncier_attestation_temoins"
  ON public.foncier_attestation_temoins FOR SELECT
  TO authenticated
  USING (true);

-- ALL: All authenticated users can manage
CREATE POLICY "Authenticated users can manage foncier_attestation_temoins"
  ON public.foncier_attestation_temoins
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to check attestation expiration
CREATE OR REPLACE FUNCTION public.check_attestation_expiration()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update status if expired
  IF NEW.date_expiration IS NOT NULL
     AND NEW.date_expiration < NOW()
     AND NEW.statut NOT IN ('revoque', 'expire') THEN
    NEW.statut := 'expire';
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to check expiration automatically
DROP TRIGGER IF EXISTS trg_check_attestation_expiration
  ON public.foncier_attestations;

CREATE TRIGGER trg_check_attestation_expiration
  BEFORE INSERT OR UPDATE ON public.foncier_attestations
  FOR EACH ROW
  EXECUTE FUNCTION public.check_attestation_expiration();

-- Function to revoke attestation
CREATE OR REPLACE FUNCTION public.revoke_foncier_attestation(
  p_attestation_id uuid,
  p_reason text,
  p_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_attestation public.foncier_attestations%ROWTYPE;
BEGIN
  -- Check attestation exists
  SELECT * INTO v_attestation
  FROM public.foncier_attestations
  WHERE id = p_attestation_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Attestation introuvable'
    );
  END IF;

  -- Check not already revoked
  IF v_attestation.revoked_at IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Attestation déjà révoquée'
    );
  END IF;

  -- Revoke attestation
  UPDATE public.foncier_attestations
  SET
    revoke_reason = p_reason,
    revoked_at = NOW(),
    revoked_by = p_user_id,
    statut = 'revoque',
    updated_at = NOW()
  WHERE id = p_attestation_id;

  -- Log action in audit
  INSERT INTO public.foncier_audit (parcelle_id, action, utilisateur_nom, details)
  SELECT
    v_attestation.lot_id,
    'REVOCATION',
    (SELECT full_name FROM user_profiles WHERE id = p_user_id),
    json_build_object(
      'attestation_id', p_attestation_id,
      'reference', v_attestation.reference,
      'reason', p_reason
    );

  RETURN json_build_object(
    'success', true,
    'message', 'Attestation révoquée avec succès',
    'revoked_at', NOW()
  );
END;
$$;

-- Grant execute
GRANT EXECUTE ON FUNCTION public.revoke_foncier_attestation TO authenticated;

-- ============================================
-- VIEW: Expired attestations
-- ============================================

CREATE OR REPLACE VIEW public.v_foncier_attestations_expirees AS
SELECT
  fa.id,
  fa.reference,
  fa.lot_id,
  fa.date_etablissement,
  fa.date_expiration,
  fa.statut,
  fl.proprietaire_nom,
  fl.proprietaire_prenom
FROM public.foncier_attestations fa
LEFT JOIN public.foncier_lots fl ON fl.id = fa.lot_id
WHERE fa.date_expiration IS NOT NULL
  AND fa.date_expiration < NOW()
  AND fa.statut NOT IN ('revoque', 'expire');

COMMENT ON VIEW public.v_foncier_attestations_expirees IS 'Attestations expirées à révoquer automatiquement';

-- ============================================
-- GRANTS
-- ============================================

GRANT ALL ON public.foncier_attestations TO authenticated;
GRANT ALL ON public.foncier_attestation_temoins TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ============================================
-- END OF MIGRATION
-- ============================================

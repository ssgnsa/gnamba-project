-- ============================================
-- Migration: Phase 3 - Foncier public verification hardening
-- Date: 2026-06-09
-- Purpose:
--   - add a minimal verification view for the public attestation endpoint
--   - keep the verification endpoint on a narrow data surface
--   - add an index for hash-based lookups
-- ============================================


CREATE INDEX IF NOT EXISTS idx_foncier_attestations_hash_sha256
  ON public.foncier_attestations(hash_sha256)
  WHERE hash_sha256 IS NOT NULL;

CREATE OR REPLACE VIEW public.v_foncier_attestation_verification
WITH (security_invoker = true)
AS
SELECT
  fa.reference,
  fa.date_etablissement,
  fa.control_number,
  fa.statut,
  fa.qr_payload,
  fa.hash_sha256,
  fa.signature_numerique,
  fa.created_at,
  fa.version,
  fa.deleted_at,
  fl.reference AS lot_reference,
  fl.numero_lot AS lot_numero_lot,
  fl.nom_lotissement AS lot_nom_lotissement,
  fl.village AS lot_village,
  fl.superficie AS lot_superficie,
  NULL::text AS lot_quartier,
  fl.commune AS lot_commune,
  fl.departement AS lot_departement,
  fl.region AS lot_region
FROM public.foncier_attestations fa
LEFT JOIN public.foncier_lots fl
  ON fl.id = fa.lot_id
WHERE fa.statut NOT IN ('archive');

COMMENT ON VIEW public.v_foncier_attestation_verification IS
  'Surface minimale utilisée par l''Edge Function de vérification publique.';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = 'service_role'
  ) THEN
    EXECUTE 'GRANT SELECT ON public.v_foncier_attestation_verification TO service_role';
  END IF;
END
$$;


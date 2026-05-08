-- ============================================
-- Migration: Fix SECURITY DEFINER functions — add role checks
-- ============================================
-- Date: 2026-04-09
-- Purpose:
--   - soft_delete_foncier_lot(), restore_foncier_lot(), log_foncier_audit()
--     had SECURITY DEFINER with NO role validation inside
--   - Any authenticated user could call these via RPC to modify/delete data
--   - This migration adds role checks to restrict to admin/gestionnaire
--
-- Functions patched:
--   1. soft_delete_foncier_lot() — now requires admin or gestionnaire
--   2. restore_foncier_lot() — now requires admin or gestionnaire
--   3. log_foncier_audit() — now requires authenticated (read-only audit writes are OK but log source)
--   4. revoke_foncier_attestation() — now requires admin or gestionnaire
--
-- Original functions defined in:
--   - 20260405150000_create_foncier_base_tables_and_rpc.sql (soft_delete, restore, log_audit)
--   - 20260326000000_create_foncier_attestations_tables.sql (revoke)
-- ============================================

BEGIN;

-- ============================================
-- 1. soft_delete_foncier_lot — restrict to admin/gestionnaire
-- ============================================
CREATE OR REPLACE FUNCTION soft_delete_foncier_lot(p_lot_id UUID)
RETURNS VOID AS $$
DECLARE
  v_user_role TEXT;
BEGIN
  -- Verify caller has permission
  SELECT role INTO v_user_role FROM user_profiles WHERE id = auth.uid();

  IF v_user_role NOT IN ('admin', 'gestionnaire') THEN
    RAISE EXCEPTION 'Permission refusée : seuls les admin et gestionnaire peuvent archiver des lots';
  END IF;

  UPDATE foncier_lots
  SET
    statut = 'archive',
    archived_at = NOW(),
    updated_at = NOW()
  WHERE id = p_lot_id;

  INSERT INTO foncier_audit (lot_id, action, old_values, performed_by)
  VALUES (p_lot_id, 'soft_delete', NULL, auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. restore_foncier_lot — restrict to admin/gestionnaire
-- ============================================
CREATE OR REPLACE FUNCTION restore_foncier_lot(p_lot_id UUID)
RETURNS VOID AS $$
DECLARE
  v_user_role TEXT;
BEGIN
  SELECT role INTO v_user_role FROM user_profiles WHERE id = auth.uid();

  IF v_user_role NOT IN ('admin', 'gestionnaire') THEN
    RAISE EXCEPTION 'Permission refusée : seuls les admin et gestionnaire peuvent restaurer des lots';
  END IF;

  UPDATE foncier_lots
  SET
    statut = 'actif',
    archived_at = NULL,
    updated_at = NOW()
  WHERE id = p_lot_id;

  INSERT INTO foncier_audit (lot_id, action, old_values, performed_by)
  VALUES (p_lot_id, 'restore', NULL, auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. log_foncier_audit — restrict to admin/gestionnaire
-- ============================================
CREATE OR REPLACE FUNCTION log_foncier_audit(
  p_lot_id UUID,
  p_action TEXT,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_user_role TEXT;
BEGIN
  SELECT role INTO v_user_role FROM user_profiles WHERE id = auth.uid();

  IF v_user_role NOT IN ('admin', 'gestionnaire') THEN
    RAISE EXCEPTION 'Permission refusée : seuls les admin et gestionnaire peuvent écrire dans l''audit';
  END IF;

  INSERT INTO foncier_audit (lot_id, action, old_values, new_values, performed_by)
  VALUES (p_lot_id, p_action, p_old_values, p_new_values, auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. revoke_foncier_attestation — restrict to admin/gestionnaire
-- ============================================
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
  v_user_role TEXT;
BEGIN
  -- Verify caller has permission
  SELECT role INTO v_user_role FROM public.user_profiles WHERE id = auth.uid();

  IF v_user_role NOT IN ('admin', 'gestionnaire') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Permission refusée : seuls les admin et gestionnaire peuvent révoquer des attestations'
    );
  END IF;

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

COMMIT;

DO $$
BEGIN
  RAISE NOTICE '✅ SECURITY DEFINER functions patched: soft_delete, restore, log_audit, revoke_attestation';
END $$;

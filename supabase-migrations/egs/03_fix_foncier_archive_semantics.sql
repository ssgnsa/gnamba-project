-- Fix foncier archive semantics by using deleted_at/deleted_reason and preserving lot status
BEGIN;

CREATE OR REPLACE FUNCTION soft_delete_foncier_lot(
  p_lot_id uuid,
  p_reason text DEFAULT 'archivage'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_role TEXT;
BEGIN
  SELECT role INTO v_user_role FROM user_profiles WHERE id = auth.uid();

  IF v_user_role NOT IN ('admin', 'gestionnaire') THEN
    RAISE EXCEPTION 'Permission refusée : seuls les admin et gestionnaire peuvent archiver des lots';
  END IF;

  UPDATE foncier_lots
  SET deleted_at = now(),
      deleted_by = auth.uid(),
      deleted_reason = NULLIF(trim(p_reason), ''),
      archived_at = now(),
      updated_at = now()
  WHERE id = p_lot_id
    AND deleted_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION restore_foncier_lot(
  p_lot_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_role TEXT;
BEGIN
  SELECT role INTO v_user_role FROM user_profiles WHERE id = auth.uid();

  IF v_user_role NOT IN ('admin', 'gestionnaire') THEN
    RAISE EXCEPTION 'Permission refusée : seuls les admin et gestionnaire peuvent restaurer des lots';
  END IF;

  UPDATE foncier_lots
  SET deleted_at = NULL,
      deleted_by = NULL,
      deleted_reason = NULL,
      archived_at = NULL,
      updated_at = now()
  WHERE id = p_lot_id
    AND deleted_at IS NOT NULL;
END;
$$;

COMMIT;

-- ============================================
-- Migration: Fix Foncier Module Critical Issues
-- Date: 2026-05-08
-- Purpose: Apply audit recommendations for foncier module
-- ============================================

BEGIN;

-- ============================================
-- 1. Update search_foncier_lots with all required parameters
-- ============================================
DROP FUNCTION IF EXISTS search_foncier_lots(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INT, INT, BOOLEAN);
CREATE OR REPLACE FUNCTION search_foncier_lots(
  p_search TEXT DEFAULT '',
  p_statut TEXT DEFAULT '',
  p_village TEXT DEFAULT '',
  p_quartier TEXT DEFAULT '',
  p_lotissement TEXT DEFAULT '',
  p_sort TEXT DEFAULT 'created_at',
  p_dir TEXT DEFAULT 'desc',
  p_page INT DEFAULT 1,
  p_limit INT DEFAULT 20,
  p_include_archived BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id UUID,
  reference TEXT,
  numero_lot TEXT,
  numero_ilot TEXT,
  nom_lotissement TEXT,
  village TEXT,
  superficie NUMERIC,
  prix NUMERIC,
  statut TEXT,
  proprietaire_nom TEXT,
  proprietaire_prenom TEXT,
  proprietaire_telephone TEXT,
  created_at TIMESTAMPTZ,
  total_count BIGINT
) AS $$
DECLARE
  v_offset INT;
  v_order_by TEXT;
  v_where_conditions TEXT := '';
BEGIN
  v_offset := (p_page - 1) * p_limit;

  -- Build ORDER BY clause
  IF p_sort = 'created_at' THEN
    v_order_by := 'fl.created_at';
  ELSIF p_sort = 'reference' THEN
    v_order_by := 'fl.reference';
  ELSIF p_sort = 'superficie' THEN
    v_order_by := 'fl.superficie';
  ELSE
    v_order_by := 'fl.created_at';
  END IF;

  IF p_dir = 'asc' THEN
    v_order_by := v_order_by || ' ASC';
  ELSE
    v_order_by := v_order_by || ' DESC';
  END IF;

  -- Build WHERE conditions
  IF p_search != '' THEN
    v_where_conditions := v_where_conditions || ' AND (fl.reference ILIKE ''%' || p_search || '%'' OR fl.numero_lot ILIKE ''%' || p_search || '%'' OR fl.nom_lotissement ILIKE ''%' || p_search || '%'' OR fl.village ILIKE ''%' || p_search || '%'' OR fl.proprietaire_nom ILIKE ''%' || p_search || '%'' OR fl.proprietaire_prenom ILIKE ''%' || p_search || '%'')';
  END IF;

  IF p_statut != '' THEN
    v_where_conditions := v_where_conditions || ' AND fl.statut = ''' || p_statut || '''';
  END IF;

  IF p_village != '' THEN
    v_where_conditions := v_where_conditions || ' AND fl.village = ''' || p_village || '''';
  END IF;

  IF p_quartier != '' THEN
    v_where_conditions := v_where_conditions || ' AND fl.quartier ILIKE ''%' || p_quartier || '%''';
  END IF;

  IF p_lotissement != '' THEN
    v_where_conditions := v_where_conditions || ' AND fl.nom_lotissement ILIKE ''%' || p_lotissement || '%''';
  END IF;

  IF NOT p_include_archived THEN
    v_where_conditions := v_where_conditions || ' AND fl.deleted_at IS NULL';
  END IF;

  -- Execute query with dynamic conditions
  RETURN QUERY EXECUTE '
    SELECT
      fl.id,
      fl.reference,
      fl.numero_lot,
      fl.numero_ilot,
      fl.nom_lotissement,
      fl.village,
      fl.superficie,
      fl.prix,
      fl.statut,
      fl.proprietaire_nom,
      fl.proprietaire_prenom,
      fl.proprietaire_telephone,
      fl.created_at,
      COUNT(*) OVER () as total_count
    FROM foncier_lots fl
    WHERE 1=1' || v_where_conditions || '
    ORDER BY ' || v_order_by || '
    LIMIT ' || p_limit || ' OFFSET ' || v_offset;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. Update foncier_stats_by_village with p_include_archived
-- ============================================
CREATE OR REPLACE FUNCTION foncier_stats_by_village(p_include_archived BOOLEAN DEFAULT FALSE)
RETURNS TABLE (
  village TEXT,
  total_superficie NUMERIC,
  lots_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fl.village,
    COALESCE(SUM(fl.superficie), 0) as total_superficie,
    COUNT(*) as lots_count
  FROM foncier_lots fl
  WHERE (p_include_archived OR fl.deleted_at IS NULL)
  GROUP BY fl.village
  ORDER BY total_superficie DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. Fix soft_delete_foncier_lot to use deleted_at
-- ============================================
CREATE OR REPLACE FUNCTION soft_delete_foncier_lot(p_lot_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE foncier_lots
  SET
    deleted_at = NOW(),
    deleted_by = auth.uid(),
    updated_at = NOW()
  WHERE id = p_lot_id;

  INSERT INTO foncier_audit (lot_id, action, old_values, performed_by)
  VALUES (p_lot_id, 'soft_delete', NULL, auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. Fix restore_foncier_lot to use deleted_at
-- ============================================
CREATE OR REPLACE FUNCTION restore_foncier_lot(p_lot_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE foncier_lots
  SET
    deleted_at = NULL,
    deleted_by = NULL,
    updated_at = NOW()
  WHERE id = p_lot_id;

  INSERT INTO foncier_audit (lot_id, action, old_values, performed_by)
  VALUES (p_lot_id, 'restore', NULL, auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. Update RLS policies for foncier_lots with village access control
-- ============================================
DROP POLICY IF EXISTS "foncier_lots_select" ON public.foncier_lots;
DROP POLICY IF EXISTS "foncier_lots_insert" ON public.foncier_lots;
DROP POLICY IF EXISTS "foncier_lots_update" ON public.foncier_lots;
DROP POLICY IF EXISTS "foncier_lots_delete" ON public.foncier_lots;

CREATE POLICY "foncier_lots_select" ON foncier_lots
  FOR SELECT TO authenticated
  USING (
    current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.user_village_access uva
      WHERE uva.village = foncier_lots.village AND uva.user_id = auth.uid()
    )
  );

CREATE POLICY "foncier_lots_insert" ON foncier_lots
  FOR INSERT TO authenticated
  WITH CHECK (
    current_user_role() IN ('admin', 'gestionnaire')
    AND (
      current_user_role() = 'admin'
      OR EXISTS (
        SELECT 1 FROM public.user_village_access uva
        WHERE uva.village = foncier_lots.village AND uva.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "foncier_lots_update" ON foncier_lots
  FOR UPDATE TO authenticated
  USING (
    current_user_role() IN ('admin', 'gestionnaire')
    AND (
      current_user_role() = 'admin'
      OR EXISTS (
        SELECT 1 FROM public.user_village_access uva
        WHERE uva.village = foncier_lots.village AND uva.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    current_user_role() IN ('admin', 'gestionnaire')
    AND (
      current_user_role() = 'admin'
      OR EXISTS (
        SELECT 1 FROM public.user_village_access uva
        WHERE uva.village = foncier_lots.village AND uva.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "foncier_lots_delete" ON foncier_lots
  FOR DELETE TO authenticated
  USING (current_user_role() = 'admin');

COMMIT;
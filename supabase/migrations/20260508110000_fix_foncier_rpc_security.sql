-- ============================================
-- Migration: Fix Foncier RPC Functions with SECURITY DEFINER
-- Date: 2026-05-08
-- Purpose: Add SECURITY DEFINER to RPC functions to bypass RLS policies
-- ============================================

BEGIN;

-- ============================================
-- 1. Fix search_foncier_lots with SECURITY DEFINER
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
  prix_cession NUMERIC,
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
  v_is_admin BOOLEAN;
BEGIN
  -- Check if current user is admin (bypass village access control)
  v_is_admin := EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE public.user_profiles.id = auth.uid() AND role = 'admin'
  );

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
    v_where_conditions := v_where_conditions || ' AND (fl.reference ILIKE ''%' || REPLACE(p_search, '''', '''''') || '%'' OR fl.numero_lot ILIKE ''%' || REPLACE(p_search, '''', '''''') || '%'' OR fl.nom_lotissement ILIKE ''%' || REPLACE(p_search, '''', '''''') || '%'' OR fl.village ILIKE ''%' || REPLACE(p_search, '''', '''''') || '%'' OR fl.proprietaire_nom ILIKE ''%' || REPLACE(p_search, '''', '''''') || '%'' OR fl.proprietaire_prenom ILIKE ''%' || REPLACE(p_search, '''', '''''') || '%'')';
  END IF;

  IF p_statut != '' THEN
    v_where_conditions := v_where_conditions || ' AND fl.statut = ''' || REPLACE(p_statut, '''', '''''') || '''';
  END IF;

  -- If not admin, filter by user's villages
  IF NOT v_is_admin AND p_village = '' THEN
    -- Get user's allowed villages
    v_where_conditions := v_where_conditions || ' AND fl.village IN (SELECT village FROM public.user_village_access WHERE user_id = auth.uid())';
  ELSIF p_village != '' THEN
    v_where_conditions := v_where_conditions || ' AND fl.village = ''' || REPLACE(p_village, '''', '''''') || '''';
  END IF;

  IF p_quartier != '' THEN
    v_where_conditions := v_where_conditions || ' AND fl.quartier ILIKE ''%' || REPLACE(p_quartier, '''', '''''') || '%''';
  END IF;

  IF p_lotissement != '' THEN
    v_where_conditions := v_where_conditions || ' AND fl.nom_lotissement ILIKE ''%' || REPLACE(p_lotissement, '''', '''''') || '%''';
  END IF;

  IF NOT p_include_archived THEN
    v_where_conditions := v_where_conditions || ' AND (fl.deleted_at IS NULL OR fl.deleted_at > NOW() - INTERVAL ''30 days'')';
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
      fl.prix_cession,
      fl.statut,
      fl.proprietaire_nom,
      fl.proprietaire_prenom,
      fl.proprietaire_telephone,
      fl.created_at,
      COUNT(*) OVER () as total_count
    FROM public.foncier_lots fl
    WHERE 1=1' || v_where_conditions || '
    ORDER BY ' || v_order_by || '
    LIMIT ' || p_limit || ' OFFSET ' || v_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- ============================================
-- 2. Fix foncier_stats_by_village with SECURITY DEFINER
-- ============================================
DROP FUNCTION IF EXISTS foncier_stats_by_village(BOOLEAN);

CREATE OR REPLACE FUNCTION foncier_stats_by_village(p_include_archived BOOLEAN DEFAULT FALSE)
RETURNS TABLE (
  village TEXT,
  total_superficie NUMERIC,
  lots_count BIGINT
) AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Check if current user is admin
  v_is_admin := EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE public.user_profiles.id = auth.uid() AND role = 'admin'
  );

  RETURN QUERY
  SELECT
    fl.village,
    COALESCE(SUM(fl.superficie), 0) as total_superficie,
    COUNT(*) as lots_count
  FROM public.foncier_lots fl
  WHERE (p_include_archived OR fl.deleted_at IS NULL)
    AND (
      v_is_admin
      OR fl.village IN (SELECT village FROM public.user_village_access WHERE user_id = auth.uid())
    )
  GROUP BY fl.village
  ORDER BY total_superficie DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- ============================================
-- 3. Ensure user_village_access table exists and seed with admin access
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_village_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  village TEXT NOT NULL,
  access_level TEXT DEFAULT 'lecteur',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, village)
);

-- Add access for all admin users to all villages
INSERT INTO public.user_village_access (user_id, village, access_level)
SELECT DISTINCT up.id, 'Sikensi', 'admin'
FROM public.user_profiles up
WHERE up.role = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_village_access uva
    WHERE uva.user_id = up.id AND uva.village = 'Sikensi'
  )
ON CONFLICT (user_id, village) DO NOTHING;

-- ============================================
-- 4. Enable RLS on user_village_access
-- ============================================
ALTER TABLE IF EXISTS public.user_village_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_village_access_select" ON public.user_village_access;
DROP POLICY IF EXISTS "user_village_access_insert" ON public.user_village_access;
DROP POLICY IF EXISTS "user_village_access_update" ON public.user_village_access;
DROP POLICY IF EXISTS "user_village_access_delete" ON public.user_village_access;

CREATE POLICY "user_village_access_select" ON public.user_village_access
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE public.user_profiles.id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "user_village_access_insert" ON public.user_village_access
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE public.user_profiles.id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "user_village_access_update" ON public.user_village_access
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE public.user_profiles.id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE public.user_profiles.id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "user_village_access_delete" ON public.user_village_access
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE public.user_profiles.id = auth.uid() AND role = 'admin'
    )
  );

COMMIT;

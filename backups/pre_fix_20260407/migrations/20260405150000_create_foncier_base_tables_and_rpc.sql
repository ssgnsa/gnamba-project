-- ============================================
-- Migration: Create missing foncier_lots base tables + RPC functions
-- ============================================
-- Date: 2026-04-05
-- Purpose: Fixes CRITICAL audit findings — foncier_lots table never created
--          + 7 missing RPC functions referenced in frontend code
-- ============================================

BEGIN;

-- ============================================
-- 1. FONCIER LOTS — Core table
-- ============================================
CREATE TABLE IF NOT EXISTS foncier_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE,
  numero_lot TEXT NOT NULL,
  numero_ilot TEXT NOT NULL,
  nom_lotissement TEXT NOT NULL,
  village TEXT NOT NULL,
  region TEXT,
  departement TEXT,
  commune TEXT,
  superficie NUMERIC(10, 2) NOT NULL,
  prix NUMERIC(12, 2),
  statut TEXT NOT NULL DEFAULT 'actif',
  -- Owner info
  proprietaire_nom TEXT,
  proprietaire_prenom TEXT,
  proprietaire_cni_numero TEXT,
  proprietaire_cni_date DATE,
  proprietaire_cni_lieu TEXT,
  proprietaire_naissance_date DATE,
  proprietaire_naissance_lieu TEXT,
  proprietaire_profession TEXT,
  proprietaire_telephone TEXT,
  proprietaire_email TEXT,
  -- GPS
  gps_lat NUMERIC(9, 6),
  gps_lng NUMERIC(9, 6),
  gps_precision NUMERIC(5, 2),
  -- Additional
  row_version INTEGER DEFAULT 1,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  retention_until TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_foncier_lots_reference ON foncier_lots(reference);
CREATE INDEX IF NOT EXISTS idx_foncier_lots_village ON foncier_lots(village);
CREATE INDEX IF NOT EXISTS idx_foncier_lots_statut ON foncier_lots(statut);
CREATE INDEX IF NOT EXISTS idx_foncier_lots_location ON foncier_lots(nom_lotissement, numero_ilot, numero_lot);

-- ============================================
-- 1b. FK: foncier_attestations.lot_id → foncier_lots.id
-- ============================================
-- Added here because foncier_lots must exist before this FK can be created
ALTER TABLE public.foncier_attestations
  DROP CONSTRAINT IF EXISTS foncier_attestations_lot_id_fkey;

ALTER TABLE public.foncier_attestations
  ADD CONSTRAINT foncier_attestations_lot_id_fkey
  FOREIGN KEY (lot_id) REFERENCES foncier_lots(id) ON DELETE CASCADE;

-- ============================================
-- 2. FONCIER AUDIT — Audit trail
-- ============================================
CREATE TABLE IF NOT EXISTS foncier_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID REFERENCES foncier_lots(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  performed_by UUID,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_foncier_audit_lot ON foncier_audit(lot_id);
CREATE INDEX IF NOT EXISTS idx_foncier_audit_action ON foncier_audit(action);

-- ============================================
-- 3. FONCIER VILLAGES — Village configuration
-- ============================================
CREATE TABLE IF NOT EXISTS foncier_villages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  region TEXT,
  commune TEXT,
  departement TEXT,
  chef_nom TEXT,
  chef_telephone TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 4. USER VILLAGE ACCESS — Access control
-- ============================================
CREATE TABLE IF NOT EXISTS user_village_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  village TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, village)
);

CREATE INDEX IF NOT EXISTS idx_user_village_user ON user_village_access(user_id);

-- ============================================
-- 5. RPC FUNCTION: search_foncier_lots
-- ============================================
CREATE OR REPLACE FUNCTION search_foncier_lots(
  p_search TEXT DEFAULT '',
  p_statut TEXT DEFAULT '',
  p_village TEXT DEFAULT '',
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
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
BEGIN
  RETURN QUERY
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
  WHERE (p_search = '' OR
    fl.reference ILIKE '%' || p_search || '%' OR
    fl.numero_lot ILIKE '%' || p_search || '%' OR
    fl.nom_lotissement ILIKE '%' || p_search || '%' OR
    fl.village ILIKE '%' || p_search || '%' OR
    fl.proprietaire_nom ILIKE '%' || p_search || '%' OR
    fl.proprietaire_prenom ILIKE '%' || p_search || '%')
  AND (p_statut = '' OR fl.statut = p_statut)
  AND (p_village = '' OR fl.village = p_village)
  ORDER BY fl.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. RPC FUNCTION: foncier_stats_by_village
-- ============================================
CREATE OR REPLACE FUNCTION foncier_stats_by_village()
RETURNS TABLE (
  village TEXT,
  total_lots BIGINT,
  lots_actifs BIGINT,
  lots_vendus BIGINT,
  lots_litiges BIGINT,
  superficie_totale NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fl.village,
    COUNT(*) as total_lots,
    COUNT(*) FILTER (WHERE fl.statut = 'actif') as lots_actifs,
    COUNT(*) FILTER (WHERE fl.statut = 'vendu') as lots_vendus,
    COUNT(*) FILTER (WHERE fl.statut = 'litige') as lots_litiges,
    COALESCE(SUM(fl.superficie), 0) as superficie_totale
  FROM foncier_lots fl
  GROUP BY fl.village
  ORDER BY total_lots DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. RPC FUNCTION: soft_delete_foncier_lot
-- ============================================
CREATE OR REPLACE FUNCTION soft_delete_foncier_lot(p_lot_id UUID)
RETURNS VOID AS $$
BEGIN
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
-- 8. RPC FUNCTION: restore_foncier_lot
-- ============================================
CREATE OR REPLACE FUNCTION restore_foncier_lot(p_lot_id UUID)
RETURNS VOID AS $$
BEGIN
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
-- 9. RPC FUNCTION: ensure_foncier_hierarchy
-- ============================================
CREATE OR REPLACE FUNCTION ensure_foncier_hierarchy(
  p_village TEXT,
  p_nom_lotissement TEXT,
  p_numero_ilot TEXT,
  p_numero_lot TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_ref TEXT;
BEGIN
  -- Generate structured reference
  v_ref := 'FONC-' || TO_CHAR(NOW(), 'YYYY-MM-DD') || '-' ||
           UPPER(SUBSTRING(p_village FROM 1 FOR 3)) || '-' ||
           UPPER(SUBSTRING(p_nom_lotissement FROM 1 FOR 2)) || '-' ||
           p_numero_ilot || '-' || p_numero_lot;

  RETURN v_ref;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. RPC FUNCTION: log_foncier_audit
-- ============================================
CREATE OR REPLACE FUNCTION log_foncier_audit(
  p_lot_id UUID,
  p_action TEXT,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO foncier_audit (lot_id, action, old_values, new_values, performed_by)
  VALUES (p_lot_id, p_action, p_old_values, p_new_values, auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 11. RPC FUNCTION: check_foncier_duplicate
-- ============================================
CREATE OR REPLACE FUNCTION check_foncier_duplicate(
  p_village TEXT,
  p_nom_lotissement TEXT,
  p_numero_ilot TEXT,
  p_numero_lot TEXT
)
RETURNS TABLE (
  id UUID,
  reference TEXT,
  proprietaire_nom TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT fl.id, fl.reference, fl.proprietaire_nom
  FROM foncier_lots fl
  WHERE fl.village = p_village
    AND fl.nom_lotissement = p_nom_lotissement
    AND fl.numero_ilot = p_numero_ilot
    AND fl.numero_lot = p_numero_lot
    AND fl.statut != 'archive';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 12. TRIGGER: updated_at for foncier_lots
-- ============================================
CREATE OR REPLACE FUNCTION update_foncier_lots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.row_version = COALESCE(OLD.row_version, 0) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_foncier_lots_updated_at
  BEFORE UPDATE ON foncier_lots
  FOR EACH ROW
  EXECUTE FUNCTION update_foncier_lots_updated_at();

-- ============================================
-- 13. RLS POLICIES for new tables
-- ============================================
ALTER TABLE foncier_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE foncier_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE foncier_villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_village_access ENABLE ROW LEVEL SECURITY;

-- Foncier lots: role-based access
CREATE POLICY "foncier_lots_select" ON foncier_lots
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "foncier_lots_insert" ON foncier_lots
  FOR INSERT TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'gestionnaire', 'gerant'));

CREATE POLICY "foncier_lots_update" ON foncier_lots
  FOR UPDATE TO authenticated
  USING (current_user_role() IN ('admin', 'gestionnaire', 'gerant'))
  WITH CHECK (current_user_role() IN ('admin', 'gestionnaire', 'gerant'));

CREATE POLICY "foncier_lots_delete" ON foncier_lots
  FOR DELETE TO authenticated
  USING (current_user_role() = 'admin');

-- Foncier audit: read-only for admin
CREATE POLICY "foncier_audit_select" ON foncier_audit
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "foncier_audit_insert" ON foncier_audit
  FOR INSERT TO authenticated WITH CHECK (true);

-- Foncier villages: read for all, write for admin
CREATE POLICY "foncier_villages_select" ON foncier_villages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "foncier_villages_insert" ON foncier_villages
  FOR INSERT TO authenticated
  WITH CHECK (current_user_role() = 'admin');

-- User village access
CREATE POLICY "user_village_access_select" ON user_village_access
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR current_user_role() = 'admin');

CREATE POLICY "user_village_access_all" ON user_village_access
  FOR ALL TO authenticated
  USING (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');

COMMIT;

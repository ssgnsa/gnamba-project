-- ============================================
-- Fix: SECURITY DEFINER functions missing SET search_path
-- Date: 2026-05-15
-- Purpose: Bloquer les attaques search_path injection sur toutes les
--   fonctions SECURITY DEFINER qui n'ont pas SET search_path = public
-- CVE Pattern: PostgreSQL search_path hijacking via SECURITY DEFINER
-- ============================================

-- current_user_role (20260405130000 + 20260408120000)
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()),
    'employe'
  );
$$ LANGUAGE SQL SECURITY DEFINER SET search_path = public;

-- has_finance_access (20260405130000)
CREATE OR REPLACE FUNCTION public.has_finance_access()
RETURNS BOOLEAN AS $$
  SELECT public.current_user_role() IN ('admin', 'gestionnaire', 'gerant');
$$ LANGUAGE SQL SECURITY DEFINER SET search_path = public;

-- is_admin (20260408120000)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT public.current_user_role() = 'admin';
$$ LANGUAGE SQL SECURITY DEFINER SET search_path = public;

-- can_manage_content (20260408120000)
CREATE OR REPLACE FUNCTION public.can_manage_content()
RETURNS BOOLEAN AS $$
  SELECT public.current_user_role() IN ('admin', 'gestionnaire', 'gerant');
$$ LANGUAGE SQL SECURITY DEFINER SET search_path = public;

-- Leads module functions (20260515000002)
CREATE OR REPLACE FUNCTION public.update_lead_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.score := COALESCE(
    (NEW.budget_estime::NUMERIC / 10000000 * 30)::INT, 0
  ) +
  CASE NEW.statut
    WHEN 'chaud'    THEN 40
    WHEN 'qualifie' THEN 25
    WHEN 'nouveau'  THEN 10
    ELSE 0
  END +
  CASE NEW.canal_contact
    WHEN 'referral' THEN 30
    WHEN 'direct'   THEN 20
    ELSE 10
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.auto_assign_lead()
RETURNS TRIGGER AS $$
DECLARE
  v_agent_id UUID;
BEGIN
  IF NEW.agent_id IS NULL THEN
    SELECT id INTO v_agent_id
    FROM public.user_profiles
    WHERE role IN ('admin', 'gestionnaire', 'gerant')
    ORDER BY RANDOM()
    LIMIT 1;
    NEW.agent_id := v_agent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_derniere_interaction()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.leads
  SET derniere_interaction = NOW()
  WHERE id = NEW.lead_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_pipeline_stats()
RETURNS TRIGGER AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix foncier village creation and search access semantics
-- This migration adds a secure RPC for village creation with automatic access
-- for the creating user.
BEGIN;

SET search_path = public;

CREATE OR REPLACE FUNCTION public.create_foncier_village_with_access(
  p_nom TEXT,
  p_region TEXT DEFAULT NULL,
  p_commune TEXT DEFAULT NULL,
  p_departement TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  nom TEXT,
  region TEXT,
  commune TEXT,
  departement TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_role TEXT;
  v_name TEXT := trim(p_nom);
  v_village_id UUID;
BEGIN
  IF v_name = '' THEN
    RAISE EXCEPTION 'Nom du village requis';
  END IF;

  SELECT role INTO v_user_role FROM public.user_profiles WHERE id = auth.uid();
  IF v_user_role NOT IN ('admin', 'gestionnaire') THEN
    RAISE EXCEPTION 'Permission refusée : seuls les admin et gestionnaire peuvent créer un village';
  END IF;

  IF EXISTS (SELECT 1 FROM public.foncier_villages WHERE trim(nom) = v_name) THEN
    RAISE EXCEPTION 'Village déjà existant';
  END IF;

  INSERT INTO public.foncier_villages (nom, region, commune, departement)
  VALUES (
    v_name,
    nullif(trim(p_region), ''),
    nullif(trim(p_commune), ''),
    nullif(trim(p_departement), '')
  )
  RETURNING id INTO v_village_id;

  INSERT INTO public.user_village_access (user_id, village, access_level)
  VALUES (auth.uid(), v_name, 'gestionnaire')
  ON CONFLICT (user_id, village) DO NOTHING;

  RETURN QUERY
    SELECT id, nom, region, commune, departement, created_at
    FROM public.foncier_villages
    WHERE id = v_village_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_foncier_village_with_access(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Supprimer un village en toute sécurité : uniquement si aucun lot (même archivé)
-- n'est rattaché au village. Requiert rôle admin ou gestionnaire.
CREATE OR REPLACE FUNCTION public.delete_foncier_village(
  p_village_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_role TEXT;
  v_exists INT;
  v_result UUID := p_village_id;
BEGIN
  IF p_village_id IS NULL THEN
    RAISE EXCEPTION 'Identifiant village requis';
  END IF;

  SELECT role INTO v_user_role FROM public.user_profiles WHERE id = auth.uid();
  IF v_user_role NOT IN ('admin', 'gestionnaire') THEN
    RAISE EXCEPTION 'Permission refusée : seuls les admin et gestionnaire peuvent supprimer un village';
  END IF;

  SELECT COUNT(1) INTO v_exists FROM public.foncier_lots WHERE village = (
    SELECT nom FROM public.foncier_villages WHERE id = p_village_id
  );

  IF v_exists > 0 THEN
    RAISE EXCEPTION 'Impossible de supprimer le village : des lots y sont rattachés (%).', v_exists;
  END IF;

  DELETE FROM public.user_village_access WHERE village = (
    SELECT nom FROM public.foncier_villages WHERE id = p_village_id
  );

  DELETE FROM public.foncier_villages WHERE id = p_village_id;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_foncier_village(UUID) TO authenticated;

-- Mettre à jour un village en toute sécurité. Requiert rôle admin ou gestionnaire.
CREATE OR REPLACE FUNCTION public.update_foncier_village(
  p_village_id UUID,
  p_nom TEXT DEFAULT NULL,
  p_region TEXT DEFAULT NULL,
  p_commune TEXT DEFAULT NULL,
  p_departement TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  nom TEXT,
  region TEXT,
  commune TEXT,
  departement TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_role TEXT;
  v_old_nom TEXT;
  v_new_nom TEXT := CASE WHEN p_nom IS NOT NULL THEN trim(p_nom) ELSE NULL END;
BEGIN
  IF p_village_id IS NULL THEN
    RAISE EXCEPTION 'Identifiant village requis';
  END IF;

  SELECT role INTO v_user_role FROM public.user_profiles WHERE id = auth.uid();
  IF v_user_role NOT IN ('admin', 'gestionnaire') THEN
    RAISE EXCEPTION 'Permission refusée : seuls les admin et gestionnaire peuvent modifier un village';
  END IF;

  -- Récupérer l'ancien nom
  SELECT nom INTO v_old_nom FROM public.foncier_villages WHERE id = p_village_id;
  IF v_old_nom IS NULL THEN
    RAISE EXCEPTION 'Village introuvable';
  END IF;

  -- Vérifier si le nouveau nom existe déjà (si changement de nom)
  IF v_new_nom IS NOT NULL AND v_new_nom != '' AND v_new_nom != v_old_nom THEN
    IF EXISTS (SELECT 1 FROM public.foncier_villages WHERE trim(nom) = v_new_nom) THEN
      RAISE EXCEPTION 'Village déjà existant';
    END IF;
  END IF;

  -- Mettre à jour le village
  UPDATE public.foncier_villages
  SET
    nom = COALESCE(v_new_nom, nom),
    region = COALESCE(nullif(trim(p_region), ''), region),
    commune = COALESCE(nullif(trim(p_commune), ''), commune),
    departement = COALESCE(nullif(trim(p_departement), ''), departement),
    updated_at = now()
  WHERE id = p_village_id;

  -- Mettre à jour le village dans user_village_access si le nom a changé
  IF v_new_nom IS NOT NULL AND v_new_nom != '' AND v_new_nom != v_old_nom THEN
    UPDATE public.user_village_access
    SET village = v_new_nom
    WHERE village = v_old_nom;
  END IF;

  RETURN QUERY
    SELECT id, nom, region, commune, departement, created_at, updated_at
    FROM public.foncier_villages
    WHERE id = p_village_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_foncier_village(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

COMMIT;

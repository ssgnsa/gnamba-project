/*
  Migration: Atomic attestation generation
  Date: 2026-04-30
  Purpose:
    - create a robust SQL sequence for official attestation numbering
    - guarantee unique reference/control number generation server-side
    - create attestations + witnesses in a single transaction
    - archive previous attestation atomically during re-emission
*/

BEGIN;

CREATE SEQUENCE IF NOT EXISTS public.attestation_seq
  AS bigint
  INCREMENT BY 1
  MINVALUE 1
  START WITH 1
  CACHE 1;

GRANT USAGE, SELECT ON SEQUENCE public.attestation_seq TO authenticated;

ALTER TABLE public.foncier_attestations
  ADD COLUMN IF NOT EXISTS reference_sequence bigint;

CREATE UNIQUE INDEX IF NOT EXISTS idx_foncier_attestations_reference_unique
  ON public.foncier_attestations(reference);

CREATE UNIQUE INDEX IF NOT EXISTS idx_foncier_attestations_control_number_unique
  ON public.foncier_attestations(control_number)
  WHERE control_number IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_foncier_attestations_reference_sequence_unique
  ON public.foncier_attestations(reference_sequence)
  WHERE reference_sequence IS NOT NULL;

COMMENT ON SEQUENCE public.attestation_seq IS
  'Séquence officielle de numérotation des attestations foncières';

COMMENT ON COLUMN public.foncier_attestations.reference_sequence IS
  'Valeur séquentielle officielle utilisée pour générer la référence de l''attestation';

-- Function 1: attestation_luhn_check_digit
CREATE OR REPLACE FUNCTION public.attestation_luhn_check_digit(p_digits text)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_sum integer := 0;
  v_digit integer;
  v_double boolean := false;
  v_idx integer;
BEGIN
  IF p_digits IS NULL OR p_digits = '' THEN
    RETURN 0;
  END IF;

  FOR v_idx IN REVERSE 1..length(p_digits) LOOP
    v_digit := substring(p_digits from v_idx for 1)::integer;
    IF v_double THEN
      v_digit := v_digit * 2;
      IF v_digit > 9 THEN
        v_digit := v_digit - 9;
      END IF;
    END IF;
    v_sum := v_sum + v_digit;
    v_double := NOT v_double;
  END LOOP;

  RETURN (10 - (v_sum % 10)) % 10;
END;
$$;

-- Function 2: generate_attestation_reference
CREATE OR REPLACE FUNCTION public.generate_attestation_reference(
  p_sequence bigint,
  p_prefix text DEFAULT 'APV'
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN upper(coalesce(nullif(trim(p_prefix), ''), 'APV'))
    || '-'
    || to_char(current_date, 'YYYYMMDD')
    || '-'
    || lpad(p_sequence::text, 7, '0');
END;
$$;

-- Function 3: generate_attestation_control_number
CREATE OR REPLACE FUNCTION public.generate_attestation_control_number(p_sequence bigint)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_base text;
BEGIN
  v_base := lpad(abs(coalesce(p_sequence, 0))::text, 10, '0');
  RETURN v_base || public.attestation_luhn_check_digit(v_base)::text;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_foncier_attestation_atomic(
  p_lot_id uuid,
  p_attestation_type text DEFAULT 'standard',
  p_original boolean DEFAULT true,
  p_mode_acquisition text DEFAULT NULL,
  p_historique_possession text DEFAULT NULL,
  p_domicile text DEFAULT NULL,
  p_limites_nord text DEFAULT NULL,
  p_limites_sud text DEFAULT NULL,
  p_limites_est text DEFAULT NULL,
  p_limites_ouest text DEFAULT NULL,
  p_gps_lat numeric DEFAULT NULL,
  p_gps_lng numeric DEFAULT NULL,
  p_gps_precision numeric DEFAULT NULL,
  p_gps_points jsonb DEFAULT '[]'::jsonb,
  p_registre_volume text DEFAULT NULL,
  p_registre_page integer DEFAULT NULL,
  p_registre_ligne integer DEFAULT NULL,
  p_numero_enregistrement text DEFAULT NULL,
  p_temoins jsonb DEFAULT '[]'::jsonb,
  p_validation_agent_nom text DEFAULT NULL,
  p_validation_chef_nom text DEFAULT NULL,
  p_signature_nonce text DEFAULT NULL,
  p_signature_issued_at timestamptz DEFAULT NULL,
  p_cedant_nom text DEFAULT NULL,
  p_cedant_prenom text DEFAULT NULL,
  p_cedant_cni_numero text DEFAULT NULL,
  p_cedant_telephone text DEFAULT NULL,
  p_cedant_domicile text DEFAULT NULL,
  p_previous_attestation_id uuid DEFAULT NULL,
  p_last_modified_device_id text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  lot_id uuid,
  reference text,
  control_number text,
  version integer,
  numero_enregistrement text,
  qr_payload text,
  hash_sha256 text,
  statut text,
  date_etablissement date,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_access_level text;
  v_effective_access text;
  v_now timestamptz := now();
  v_user_id uuid := auth.uid();
  v_lot public.foncier_lots%ROWTYPE;
  v_previous public.foncier_attestations%ROWTYPE;
  v_sequence bigint;
  v_reference text;
  v_control_number text;
  v_version integer;
  v_attestation_id uuid := gen_random_uuid();
  v_status text := 'soumis';
  v_payload_core jsonb;
  v_payload_signed jsonb;
  v_payload_text text;
  v_hash text;
  v_numero_enregistrement text;
  v_temoins jsonb := COALESCE(p_temoins, '[]'::jsonb);
  v_gps_points jsonb := COALESCE(p_gps_points, '[]'::jsonb);
  v_signature_nonce text := COALESCE(NULLIF(trim(p_signature_nonce), ''), gen_random_uuid()::text);
  v_signature_issued_at timestamptz := COALESCE(p_signature_issued_at, v_now);
  v_attestation_type text := lower(coalesce(nullif(trim(p_attestation_type), ''), 'standard'));
  v_is_cession boolean;
BEGIN
  SELECT up.role, to_jsonb(up)->>'access_level'
  INTO v_role, v_access_level
  FROM public.user_profiles up
  WHERE up.id = auth.uid();

  v_effective_access := coalesce(nullif(trim(v_access_level), ''), nullif(trim(v_role), ''), 'employe');

  IF v_effective_access NOT IN ('admin', 'gestionnaire', 'gerant', 'secretaire') THEN
    RAISE EXCEPTION 'Permission refusée : création d''attestation réservée aux profils autorisés';
  END IF;

  SELECT *
  INTO v_lot
  FROM public.foncier_lots
  WHERE public.foncier_lots.id = p_lot_id
    AND public.foncier_lots.deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lot foncier introuvable ou archivé';
  END IF;

  IF jsonb_typeof(v_temoins) IS DISTINCT FROM 'array' THEN
    v_temoins := '[]'::jsonb;
  END IF;

  IF jsonb_typeof(v_gps_points) IS DISTINCT FROM 'array' THEN
    v_gps_points := '[]'::jsonb;
  END IF;

  v_is_cession := v_attestation_type = 'cession';

  IF p_previous_attestation_id IS NOT NULL THEN
    SELECT *
    INTO v_previous
    FROM public.foncier_attestations
    WHERE public.foncier_attestations.id = p_previous_attestation_id
      AND public.foncier_attestations.lot_id = p_lot_id
      AND public.foncier_attestations.deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Attestation précédente introuvable pour réémission';
    END IF;
  END IF;

  SELECT COALESCE(MAX(fa.version), 0) + 1
  INTO v_version
  FROM public.foncier_attestations fa
  WHERE fa.lot_id = p_lot_id;

  v_sequence := nextval('public.attestation_seq');
  v_reference := public.generate_attestation_reference(v_sequence);
  v_control_number := public.generate_attestation_control_number(v_sequence);
  v_numero_enregistrement := COALESCE(NULLIF(trim(p_numero_enregistrement), ''), v_reference || '-V' || v_version::text);

  v_payload_core := jsonb_strip_nulls(
    jsonb_build_object(
      'attestation_id', v_attestation_id,
      'reference', v_reference,
      'attestation_type', v_attestation_type,
      'version', v_version,
      'lot_id', v_lot.id,
      'lot_reference', v_lot.reference,
      'date_etablissement', to_char(v_now::date, 'YYYY-MM-DD'),
      'numero_enregistrement', v_numero_enregistrement,
      'registre', jsonb_build_object(
        'volume', nullif(trim(coalesce(p_registre_volume, '')), ''),
        'page', p_registre_page,
        'ligne', p_registre_ligne
      ),
      'control_number', v_control_number,
      'signature_nonce', v_signature_nonce,
      'signature_issued_at', to_char(v_signature_issued_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'statut', v_status,
      'original', coalesce(p_original, true),
      'village', jsonb_build_object(
        'region', nullif(trim(coalesce(v_lot.region, '')), ''),
        'departement', nullif(trim(coalesce(v_lot.departement, '')), ''),
        'commune', nullif(trim(coalesce(v_lot.commune, '')), ''),
        'village', nullif(trim(coalesce(v_lot.village, '')), ''),
        'quartier', nullif(trim(coalesce(v_lot.quartier, '')), ''),
        'lotissement', nullif(trim(coalesce(v_lot.nom_lotissement, '')), ''),
        'numero_lot', nullif(trim(coalesce(v_lot.numero_lot, '')), ''),
        'numero_ilot', nullif(trim(coalesce(v_lot.numero_ilot, '')), '')
      ),
      'parcelle', jsonb_build_object(
        'superficie_m2', coalesce(v_lot.superficie, 0),
        'limites', jsonb_build_object(
          'nord', nullif(trim(coalesce(p_limites_nord, '')), ''),
          'sud', nullif(trim(coalesce(p_limites_sud, '')), ''),
          'est', nullif(trim(coalesce(p_limites_est, '')), ''),
          'ouest', nullif(trim(coalesce(p_limites_ouest, '')), '')
        ),
        'coordonnees_gps', CASE
          WHEN p_gps_lat IS NOT NULL AND p_gps_lng IS NOT NULL THEN jsonb_build_object(
            'lat', p_gps_lat,
            'lng', p_gps_lng,
            'precision', p_gps_precision
          )
          ELSE NULL
        END,
        'gps_points', v_gps_points
      ),
      'acquisition', jsonb_build_object(
        'mode', nullif(trim(coalesce(p_mode_acquisition, '')), ''),
        'historique', nullif(trim(coalesce(p_historique_possession, '')), '')
      ),
      'titulaire', jsonb_build_object(
        'nom', nullif(trim(coalesce(v_lot.proprietaire_nom, '')), ''),
        'prenom', nullif(trim(coalesce(v_lot.proprietaire_prenom, '')), ''),
        'naissance_date', nullif(trim(coalesce(v_lot.proprietaire_naissance_date, '')), ''),
        'naissance_lieu', nullif(trim(coalesce(v_lot.proprietaire_naissance_lieu, '')), ''),
        'domicile', nullif(trim(coalesce(p_domicile, '')), ''),
        'profession', nullif(trim(coalesce(v_lot.proprietaire_profession, '')), ''),
        'cni_numero', nullif(trim(coalesce(v_lot.proprietaire_cni_numero, '')), ''),
        'cni_date', nullif(trim(coalesce(v_lot.proprietaire_cni_date, '')), ''),
        'cni_lieu', nullif(trim(coalesce(v_lot.proprietaire_cni_lieu, '')), ''),
        'telephone', nullif(trim(coalesce(v_lot.proprietaire_telephone, '')), '')
      ),
      'temoins', v_temoins,
      'autorites', jsonb_build_object(
        'chef_village', nullif(trim(coalesce(v_lot.chef_village, '')), ''),
        'lieu_signature', nullif(trim(coalesce(v_lot.village, '')), '')
      ),
      'validation', jsonb_build_object(
        'agent_nom', nullif(trim(coalesce(p_validation_agent_nom, '')), ''),
        'chef_nom', nullif(trim(coalesce(p_validation_chef_nom, '')), '')
      )
    )
  );

  IF v_is_cession THEN
    v_payload_core := v_payload_core || jsonb_build_object(
      'cession',
      jsonb_strip_nulls(
        jsonb_build_object(
          'date_cession', nullif(trim(coalesce(v_lot.date_cession, '')), ''),
          'prix_cession', CASE
            WHEN coalesce(v_lot.prix_cession, 0) > 0 THEN v_lot.prix_cession
            ELSE NULL
          END,
          'cedant', jsonb_build_object(
            'nom', nullif(trim(coalesce(p_cedant_nom, '')), ''),
            'prenom', nullif(trim(coalesce(p_cedant_prenom, '')), ''),
            'cni_numero', nullif(trim(coalesce(p_cedant_cni_numero, '')), ''),
            'telephone', nullif(trim(coalesce(p_cedant_telephone, '')), ''),
            'domicile', nullif(trim(coalesce(p_cedant_domicile, '')), '')
          )
        )
      )
    );
  END IF;

  v_hash := encode(digest(v_payload_core::text, 'sha256'), 'hex');
  v_payload_signed := v_payload_core || jsonb_build_object('hash_sha256', v_hash);
  v_payload_text := v_payload_signed::text;

  IF p_previous_attestation_id IS NOT NULL THEN
    UPDATE public.foncier_attestations
    SET
      deleted_at = v_now,
      statut = 'archive',
      updated_at = v_now,
      client_updated_at = v_now,
      last_modified_device_id = coalesce(p_last_modified_device_id, 'server-atomic-attestation')
    WHERE public.foncier_attestations.id = p_previous_attestation_id;
  END IF;

  INSERT INTO public.foncier_attestations (
    id,
    lot_id,
    reference,
    reference_sequence,
    version,
    type,
    statut,
    date_etablissement,
    date_expiration,
    mode_acquisition,
    historique_possession,
    domicile,
    cedant_nom,
    cedant_prenom,
    cedant_cni_numero,
    cedant_telephone,
    cedant_domicile,
    limites_nord,
    limites_sud,
    limites_est,
    limites_ouest,
    gps_lat,
    gps_lng,
    gps_precision,
    gps_points,
    registre_volume,
    registre_page,
    registre_ligne,
    numero_enregistrement,
    qr_payload,
    hash_sha256,
    control_number,
    signature_nonce,
    signature_issued_at,
    validation_agent_nom,
    validation_agent_id,
    validation_agent_date,
    validation_chef_nom,
    created_by,
    created_at,
    updated_at,
    client_updated_at,
    last_modified_device_id
  )
  VALUES (
    v_attestation_id,
    p_lot_id,
    v_reference,
    v_sequence,
    v_version,
    v_attestation_type,
    v_status,
    v_now::date,
    v_now + interval '6 months',
    nullif(trim(coalesce(p_mode_acquisition, '')), ''),
    nullif(trim(coalesce(p_historique_possession, '')), ''),
    nullif(trim(coalesce(p_domicile, '')), ''),
    CASE WHEN v_is_cession THEN nullif(trim(coalesce(p_cedant_nom, '')), '') ELSE NULL END,
    CASE WHEN v_is_cession THEN nullif(trim(coalesce(p_cedant_prenom, '')), '') ELSE NULL END,
    CASE WHEN v_is_cession THEN nullif(trim(coalesce(p_cedant_cni_numero, '')), '') ELSE NULL END,
    CASE WHEN v_is_cession THEN nullif(trim(coalesce(p_cedant_telephone, '')), '') ELSE NULL END,
    CASE WHEN v_is_cession THEN nullif(trim(coalesce(p_cedant_domicile, '')), '') ELSE NULL END,
    nullif(trim(coalesce(p_limites_nord, '')), ''),
    nullif(trim(coalesce(p_limites_sud, '')), ''),
    nullif(trim(coalesce(p_limites_est, '')), ''),
    nullif(trim(coalesce(p_limites_ouest, '')), ''),
    p_gps_lat,
    p_gps_lng,
    p_gps_precision,
    v_gps_points,
    nullif(trim(coalesce(p_registre_volume, '')), ''),
    p_registre_page,
    p_registre_ligne,
    v_numero_enregistrement,
    v_payload_text,
    v_hash,
    v_control_number,
    v_signature_nonce,
    v_signature_issued_at,
    nullif(trim(coalesce(p_validation_agent_nom, '')), ''),
    v_user_id,
    v_now,
    nullif(trim(coalesce(p_validation_chef_nom, '')), ''),
    v_user_id,
    v_now,
    v_now,
    v_now,
    coalesce(p_last_modified_device_id, 'server-atomic-attestation')
  );

  INSERT INTO public.foncier_attestation_temoins (
    attestation_id,
    nom,
    prenom,
    profession,
    telephone,
    cni
  )
  SELECT
    v_attestation_id,
    coalesce(nullif(trim(coalesce(value->>'nom', '')), ''), ''),
    coalesce(nullif(trim(coalesce(value->>'prenom', '')), ''), ''),
    nullif(trim(coalesce(value->>'profession', '')), ''),
    nullif(trim(coalesce(value->>'telephone', '')), ''),
    nullif(trim(coalesce(value->>'cni', '')), '')
  FROM jsonb_array_elements(v_temoins) AS witness(value)
  WHERE nullif(trim(coalesce(value->>'nom', '')), '') IS NOT NULL
     OR nullif(trim(coalesce(value->>'prenom', '')), '') IS NOT NULL;

  RETURN QUERY
  SELECT
    fa.id,
    fa.lot_id,
    fa.reference,
    fa.control_number,
    fa.version,
    fa.numero_enregistrement,
    fa.qr_payload,
    fa.hash_sha256,
    fa.statut,
    fa.date_etablissement,
    fa.created_at
  FROM public.foncier_attestations fa
  WHERE fa.id = v_attestation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_foncier_attestation_atomic(
  uuid,
  text,
  boolean,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  numeric,
  numeric,
  numeric,
  jsonb,
  text,
  integer,
  integer,
  text,
  jsonb,
  text,
  text,
  text,
  timestamptz,
  text,
  text,
  text,
  text,
  text,
  uuid,
  text
) TO authenticated;

COMMIT;

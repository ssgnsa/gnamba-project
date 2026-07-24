CREATE OR REPLACE FUNCTION create_foncier_village_with_access(
    p_nom TEXT,
    p_region TEXT DEFAULT NULL,
    p_commune TEXT DEFAULT NULL,
    p_departement TEXT DEFAULT NULL,
    p_created_by UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    nom TEXT,
    region TEXT,
    commune TEXT,
    departement TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_id UUID;
    v_nom TEXT;
    v_region TEXT;
    v_commune TEXT;
    v_departement TEXT;
    v_created_at TIMESTAMP;
    v_updated_at TIMESTAMP;
BEGIN
    INSERT INTO foncier_villages (nom, region, commune, departement, created_by, created_at, updated_at)
    VALUES (p_nom, p_region, p_commune, p_departement, p_created_by, NOW(), NOW())
    RETURNING foncier_villages.id, foncier_villages.nom, foncier_villages.region, foncier_villages.commune, foncier_villages.departement, foncier_villages.created_at, foncier_villages.updated_at
    INTO v_id, v_nom, v_region, v_commune, v_departement, v_created_at, v_updated_at;

    id := v_id;
    nom := v_nom;
    region := v_region;
    commune := v_commune;
    departement := v_departement;
    created_at := v_created_at;
    updated_at := v_updated_at;

    RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION update_foncier_village(
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
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_id UUID;
    v_nom TEXT;
    v_region TEXT;
    v_commune TEXT;
    v_departement TEXT;
    v_created_at TIMESTAMP;
    v_updated_at TIMESTAMP;
BEGIN
    UPDATE foncier_villages
    SET nom = COALESCE(p_nom, foncier_villages.nom),
        region = COALESCE(p_region, foncier_villages.region),
        commune = COALESCE(p_commune, foncier_villages.commune),
        departement = COALESCE(p_departement, foncier_villages.departement),
        updated_at = NOW()
    WHERE foncier_villages.id = p_village_id
    RETURNING foncier_villages.id, foncier_villages.nom, foncier_villages.region, foncier_villages.commune, foncier_villages.departement, foncier_villages.created_at, foncier_villages.updated_at
    INTO v_id, v_nom, v_region, v_commune, v_departement, v_created_at, v_updated_at;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    id := v_id;
    nom := v_nom;
    region := v_region;
    commune := v_commune;
    departement := v_departement;
    created_at := v_created_at;
    updated_at := v_updated_at;

    RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION delete_foncier_village(p_village_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM foncier_villages WHERE id = p_village_id) THEN
        RETURN FALSE;
    END IF;

    UPDATE foncier_villages
    SET deleted_at = NOW(), updated_at = NOW()
    WHERE id = p_village_id;

    RETURN TRUE;
END;
$$;

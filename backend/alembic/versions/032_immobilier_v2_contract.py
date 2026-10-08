"""Enforce the Immobilier V2 property contract in PostgreSQL.

Revision ID: 032_immobilier_v2_contract
Revises: 031_contract_v2_products_finance
"""

from alembic import op
import sqlalchemy as sa


revision = "032_immobilier_v2_contract"
down_revision = "031_contract_v2_products_finance"
branch_labels = None
depends_on = None


def _database_owner() -> tuple[str, str]:
    bind = op.get_bind()
    database, owner = bind.execute(sa.text(
        "SELECT current_database(), current_user"
    )).one()
    return database, owner


def _assert_target_and_empty() -> None:
    bind = op.get_bind()
    database, owner = _database_owner()
    if database not in {"egs_test", "egs_local"}:
        raise RuntimeError(
            "IMMOBILIER V2 GUARD: seules egs_test et egs_local sont autorisées"
        )
    if database == "egs_test":
        owner_exists = bind.execute(sa.text(
            "SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'egs_test_user')"
        )).scalar_one()
        if not owner_exists:
            raise RuntimeError("IMMOBILIER V2: rôle propriétaire egs_test_user absent")
    else:
        is_superuser = bind.execute(sa.text(
            "SELECT rolsuper FROM pg_roles WHERE rolname = :owner"
        ), {"owner": owner}).scalar_one()
        if owner != "postgres" or not is_superuser:
            raise RuntimeError(
                "IMMOBILIER V2: egs_local doit être migrée par le DBA postgres"
            )


def _owner_role() -> str:
    bind = op.get_bind()
    database, current_owner = _database_owner()
    if database == "egs_test":
        return "egs_test_user"
    return current_owner


def upgrade() -> None:
    _assert_target_and_empty()
    owner = _owner_role()
    quoted_owner = op.get_bind().dialect.identifier_preparer.quote(owner)

    # Production's legacy properties table has free-text addresses and may not
    # yet contain structured locality or V2 identity columns. Existing rows are
    # explicitly staged as HOLD. No commune/city is inferred and no IMM title
    # or reference is issued until locality evidence is reviewed.
    op.execute("ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS reference VARCHAR(50)")
    op.execute("ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS titre VARCHAR(255)")
    op.execute("ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS commune VARCHAR(100)")
    op.execute("ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS ville VARCHAR(100)")
    op.execute("ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS quartier VARCHAR(100)")
    op.execute("ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS publier_vitrine BOOLEAN NOT NULL DEFAULT FALSE")
    op.execute("ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS titre_fige_le TIMESTAMPTZ")
    op.execute("ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS localite_statut VARCHAR(16) NOT NULL DEFAULT 'HOLD'")
    op.execute("ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS localite_preuve_reference TEXT")
    op.execute("ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS localite_anstat_code VARCHAR(32)")
    op.execute("ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS localite_verifiee_le TIMESTAMPTZ")
    op.execute("ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS localite_verifiee_par TEXT")
    op.execute("ALTER TABLE public.properties ALTER COLUMN reference DROP NOT NULL")
    op.execute("ALTER TABLE public.properties ALTER COLUMN titre DROP NOT NULL")
    op.execute("UPDATE public.properties SET localite_statut='HOLD', reference=NULL, titre=NULL, publier_vitrine=FALSE")

    # 1. Structures needed by the contract; 2. reference-table structure.
    op.execute("""
        CREATE TABLE public.immobilier_types_bien (
            code VARCHAR(32) PRIMARY KEY,
            libelle_fr VARCHAR(80) NOT NULL UNIQUE
        )
    """)
    op.execute(f"ALTER TABLE public.immobilier_types_bien OWNER TO {quoted_owner}")

    # 3. IMM counter.
    op.execute("""
        CREATE TABLE public.immobilier_reference_counters (
            reference_year INTEGER PRIMARY KEY,
            last_value INTEGER NOT NULL DEFAULT 0
                CHECK (last_value BETWEEN 0 AND 9999)
        )
    """)
    op.execute(f"ALTER TABLE public.immobilier_reference_counters OWNER TO {quoted_owner}")

    # 4. Titre freeze date.
    # 5. Status transition table.
    op.execute("""
        CREATE TABLE public.immobilier_statut_transitions (
            from_status VARCHAR(20) NOT NULL,
            to_status VARCHAR(20) NOT NULL,
            PRIMARY KEY (from_status, to_status),
            CHECK (from_status <> to_status)
        )
    """)
    op.execute(f"ALTER TABLE public.immobilier_statut_transitions OWNER TO {quoted_owner}")
    # 6. Audit table. Existing properties is empty; no backfill.
    op.execute("""
        CREATE TABLE public.properties_audit (
            id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            property_id TEXT NOT NULL,
            reference VARCHAR(50),
            action VARCHAR(32) NOT NULL,
            actor_id TEXT NOT NULL,
            actor_role TEXT NOT NULL,
            request_id UUID NOT NULL,
            occurred_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
            reason TEXT,
            old_state JSONB,
            new_state JSONB
        )
    """)
    # Keep the audit table outside the application table-owner role.
    op.execute("ALTER TABLE public.properties_audit OWNER TO postgres")
    op.create_index(
        "idx_properties_audit_property_time", "properties_audit",
        ["property_id", "occurred_at"], schema="public",
    )
    op.create_index(
        "idx_properties_audit_request", "properties_audit",
        ["request_id"], schema="public",
    )

    # 7. Seed only the canonical reference values and the supplied transition matrix.
    op.execute("""
        INSERT INTO public.immobilier_types_bien(code,libelle_fr) VALUES
          ('studio','Studio'),('chambre','Chambre'),('chambre-salon','Chambre-salon'),
          ('appartement','Appartement'),('terrain','Terrain'),('magasin','Magasin'),
          ('bureau','Bureau'),('villa','Villa'),('maison','Maison'),('duplex','Duplex'),
          ('triplex','Triplex'),('loft','Loft'),('local_commercial','Local commercial'),
          ('entrepot','Entrepôt'),('garage','Garage'),('parking','Parking'),('autre','Autre')
    """)
    op.execute("""
        INSERT INTO public.immobilier_statut_transitions (from_status, to_status)
        VALUES
          ('creation', 'disponible'), ('creation', 'en_travaux'),
          ('disponible', 'en_vente'), ('disponible', 'louee'),
          ('disponible', 'en_travaux'), ('disponible', 'retiree'),
          ('en_vente', 'vendue'), ('en_vente', 'disponible'),
          ('en_vente', 'retiree'),
          ('en_travaux', 'disponible'), ('en_travaux', 'retiree'),
          ('louee', 'disponible'), ('louee', 'retiree'),
          ('vendue', 'archivee'), ('retiree', 'disponible'),
          ('archivee', 'retiree'),
          ('loue', 'disponible'), ('loue', 'retiree')
    """)

    # 8. Constraints. PostgreSQL does not accept NOT VALID for UNIQUE.
    op.execute("ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS ck_property_statut")
    op.execute("ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS ck_property_type")
    op.execute("""
        ALTER TABLE public.properties
        ADD CONSTRAINT ck_property_statut_v2 CHECK
          (statut IN ('disponible','en_vente','loue','louee','vendue','en_travaux','retiree','archivee'))
    """)
    op.execute("""
        ALTER TABLE public.properties
        ADD CONSTRAINT ck_property_localite_statut_v2
        CHECK (localite_statut IN ('HOLD','VERIFIEE'))
    """)
    op.execute("""
        ALTER TABLE public.properties
        ADD CONSTRAINT ck_property_localite_contract_v2 CHECK (
          (localite_statut='HOLD' AND reference IS NULL AND titre IS NULL AND publier_vitrine=FALSE)
          OR
          (localite_statut='VERIFIEE' AND reference IS NOT NULL AND titre IS NOT NULL
           AND localite_preuve_reference IS NOT NULL AND localite_anstat_code IS NOT NULL
           AND (commune IS NOT NULL OR ville IS NOT NULL))
        )
    """)
    op.create_foreign_key(
        "fk_properties_type_bien_v2", "properties", "immobilier_types_bien",
        ["type_bien"], ["code"], source_schema="public", referent_schema="public",
        ondelete="RESTRICT",
    )
    op.create_unique_constraint(
        "uq_properties_titre_v2", "properties", ["titre"], schema="public"
    )
    op.create_unique_constraint(
        "uq_properties_reference_v2", "properties", ["reference"], schema="public"
    )

    # 9. Functions/triggers. All identifiers are schema-qualified and the
    # SECURITY DEFINER functions use a locked search_path.
    op.execute("""
        CREATE OR REPLACE FUNCTION public.eg_immobilier_next_reference(p_year INTEGER)
        RETURNS VARCHAR(50)
        LANGUAGE plpgsql SECURITY DEFINER
        SET search_path = pg_catalog, pg_temp
        AS $function$
        DECLARE v_seq INTEGER;
        BEGIN
            INSERT INTO public.immobilier_reference_counters(reference_year, last_value)
            VALUES (p_year, 0)
            ON CONFLICT (reference_year) DO NOTHING;
            UPDATE public.immobilier_reference_counters
               SET last_value = last_value + 1
             WHERE reference_year = p_year AND last_value < 9999
             RETURNING last_value INTO v_seq;
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Référence IMM épuisée pour %', p_year
                    USING ERRCODE = '22003';
            END IF;
            RETURN pg_catalog.format('IMM-%s-%s', p_year,
                                     pg_catalog.lpad(v_seq::text, 4, '0'));
        END;
        $function$
    """)
    op.execute(f"ALTER FUNCTION public.eg_immobilier_next_reference(INTEGER) OWNER TO {quoted_owner}")
    op.execute("REVOKE ALL ON FUNCTION public.eg_immobilier_next_reference(INTEGER) FROM PUBLIC")

    op.execute("""
        CREATE OR REPLACE FUNCTION public.eg_immobilier_type_label(p_type TEXT)
        RETURNS TEXT LANGUAGE sql STABLE STRICT
        SET search_path = pg_catalog, pg_temp
        AS $function$
          SELECT libelle_fr FROM public.immobilier_types_bien WHERE code = p_type
        $function$
    """)
    op.execute("""
        CREATE OR REPLACE FUNCTION public.eg_immobilier_derive_title(
            p_type TEXT, p_commune TEXT, p_ville TEXT, p_reference TEXT
        ) RETURNS TEXT LANGUAGE plpgsql STABLE
          SET search_path = pg_catalog, pg_temp
        AS $function$
        DECLARE v_type TEXT; v_locality TEXT;
        BEGIN
            v_type := public.eg_immobilier_type_label(p_type);
            v_locality := COALESCE(
              NULLIF(pg_catalog.regexp_replace(pg_catalog.btrim(COALESCE(p_commune,'')), '[[:space:]]+', ' ', 'g'), ''),
              NULLIF(pg_catalog.regexp_replace(pg_catalog.btrim(COALESCE(p_ville,'')), '[[:space:]]+', ' ', 'g'), '')
            );
            IF v_type IS NULL THEN RAISE EXCEPTION 'Type de bien non canonique: %', p_type; END IF;
            IF v_locality IS NULL THEN RAISE EXCEPTION 'Commune ou ville obligatoire pour le titre'; END IF;
            IF p_reference IS NULL OR p_reference = '' THEN RAISE EXCEPTION 'Référence IMM obligatoire'; END IF;
            RETURN v_type || ' – ' || v_locality || ' – ' || p_reference;
        END;
        $function$
    """)

    op.execute("""
        CREATE OR REPLACE FUNCTION public.eg_immobilier_audit_insert(
            p_property_id TEXT, p_reference TEXT, p_action TEXT, p_reason TEXT,
            p_old JSONB, p_new JSONB
        ) RETURNS VOID
        LANGUAGE plpgsql SECURITY DEFINER
        SET search_path = pg_catalog, pg_temp
        AS $function$
        DECLARE v_actor TEXT; v_role TEXT; v_request UUID;
        BEGIN
            v_actor := NULLIF(pg_catalog.current_setting('app.immo_actor_id', true), '');
            v_role := NULLIF(pg_catalog.current_setting('app.immo_actor_role', true), '');
            v_request := NULLIF(pg_catalog.current_setting('app.immo_request_id', true), '')::uuid;
            IF (v_actor IS NULL OR v_role IS NULL OR v_request IS NULL)
               AND p_action NOT IN ('transition_refused','delete_refused') THEN
                RAISE EXCEPTION 'Contexte d’audit Immobilier absent';
            END IF;
            v_actor := COALESCE(v_actor, SESSION_USER::text);
            v_role := COALESCE(v_role, 'database');
            v_request := COALESCE(v_request, pg_catalog.gen_random_uuid());
            INSERT INTO public.properties_audit(
              property_id, reference, action, actor_id, actor_role, request_id,
              reason, old_state, new_state
            ) VALUES (
              p_property_id, p_reference, p_action, v_actor, v_role, v_request,
              p_reason, p_old, p_new
            );
        END;
        $function$
    """)
    op.execute("ALTER FUNCTION public.eg_immobilier_audit_insert(TEXT,TEXT,TEXT,TEXT,JSONB,JSONB) OWNER TO postgres")
    op.execute("REVOKE ALL ON FUNCTION public.eg_immobilier_audit_insert(TEXT,TEXT,TEXT,TEXT,JSONB,JSONB) FROM PUBLIC")
    op.execute(f"GRANT EXECUTE ON FUNCTION public.eg_immobilier_audit_insert(TEXT,TEXT,TEXT,TEXT,JSONB,JSONB) TO {quoted_owner}")

    op.execute("""
        CREATE OR REPLACE FUNCTION public.eg_immobilier_property_guard()
        RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
        SET search_path = pg_catalog, pg_temp
        AS $function$
        DECLARE v_reference TEXT; v_title TEXT; v_action TEXT;
        BEGIN
          IF TG_OP = 'INSERT' THEN
            IF NEW.statut NOT IN ('disponible','en_travaux') THEN
              PERFORM public.eg_immobilier_audit_insert(
                NEW.id::TEXT, NULL, 'transition_refused', 'Création: état initial interdit',
                NULL, pg_catalog.jsonb_build_object('attempted_status',NEW.statut));
              RETURN NULL;
            END IF;
            IF NEW.publier_vitrine IS TRUE THEN
              RAISE EXCEPTION 'Un bien doit être créé non publié puis publié par la route métier';
            END IF;
            NEW.commune := NULLIF(pg_catalog.regexp_replace(pg_catalog.btrim(COALESCE(NEW.commune,'')), '[[:space:]]+', ' ', 'g'), '');
            NEW.ville := NULLIF(pg_catalog.regexp_replace(pg_catalog.btrim(COALESCE(NEW.ville,'')), '[[:space:]]+', ' ', 'g'), '');
            NEW.localite_statut := 'HOLD';
            NEW.localite_preuve_reference := NULL;
            NEW.localite_anstat_code := NULL;
            NEW.localite_verifiee_le := NULL;
            NEW.localite_verifiee_par := NULL;
            NEW.reference := NULL;
            NEW.titre := NULL;
            NEW.titre_fige_le := NULL;
            RETURN NEW;
          END IF;

          IF TG_OP = 'DELETE' THEN
            PERFORM public.eg_immobilier_audit_insert(
              OLD.id::TEXT, OLD.reference, 'delete_refused',
              'Suppression physique interdite; utiliser le cycle de statut',
              pg_catalog.to_jsonb(OLD), NULL);
            RETURN NULL;
          END IF;

          IF TG_OP = 'UPDATE' THEN
            NEW.commune := NULLIF(pg_catalog.regexp_replace(pg_catalog.btrim(COALESCE(NEW.commune,'')), '[[:space:]]+', ' ', 'g'), '');
            NEW.ville := NULLIF(pg_catalog.regexp_replace(pg_catalog.btrim(COALESCE(NEW.ville,'')), '[[:space:]]+', ' ', 'g'), '');

            IF OLD.localite_statut = 'VERIFIEE' AND
               (NEW.commune IS DISTINCT FROM OLD.commune OR NEW.ville IS DISTINCT FROM OLD.ville OR
                NEW.localite_preuve_reference IS DISTINCT FROM OLD.localite_preuve_reference OR
                NEW.localite_anstat_code IS DISTINCT FROM OLD.localite_anstat_code) THEN
              RAISE EXCEPTION 'Une localité vérifiée doit être revérifiée avec sa preuve administrative';
            END IF;
            IF NEW.publier_vitrine IS TRUE AND NEW.localite_statut <> 'VERIFIEE' THEN
              RAISE EXCEPTION 'Un bien en HOLD localisé ne peut pas être publié';
            END IF;

            IF NEW.statut IS DISTINCT FROM OLD.statut AND NOT EXISTS (
              SELECT 1 FROM public.immobilier_statut_transitions t
               WHERE t.from_status = OLD.statut AND t.to_status = NEW.statut
            ) THEN
              PERFORM public.eg_immobilier_audit_insert(
                OLD.id::TEXT, OLD.reference, 'transition_refused',
                'Transition interdite par la matrice Immobilier V2',
                pg_catalog.to_jsonb(OLD),
                pg_catalog.jsonb_build_object('attempted_status',NEW.statut));
              RETURN NULL;
            END IF;

            IF OLD.titre_fige_le IS NOT NULL AND
               (NEW.type_bien IS DISTINCT FROM OLD.type_bien OR
                NEW.commune IS DISTINCT FROM OLD.commune OR
                NEW.ville IS DISTINCT FROM OLD.ville) THEN
              RAISE EXCEPTION 'Titre gelé: dépublier le bien avant de modifier type ou localité';
            END IF;

            IF NEW.statut IN ('loue','louee','vendue','retiree','archivee') THEN
              NEW.publier_vitrine := FALSE;
            END IF;
            IF OLD.localite_statut = 'HOLD' AND NEW.localite_statut = 'VERIFIEE' THEN
              IF NULLIF(pg_catalog.btrim(COALESCE(NEW.localite_preuve_reference,'')), '') IS NULL OR
                 NULLIF(pg_catalog.btrim(COALESCE(NEW.localite_anstat_code,'')), '') IS NULL OR
                 (NEW.commune IS NULL AND NEW.ville IS NULL) THEN
                RAISE EXCEPTION 'Preuve administrative, code ANStat et commune/ville obligatoires';
              END IF;
              v_reference := public.eg_immobilier_next_reference(EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
              NEW.reference := v_reference;
              NEW.titre := public.eg_immobilier_derive_title(NEW.type_bien,NEW.commune,NEW.ville,v_reference);
              NEW.localite_verifiee_le := pg_catalog.clock_timestamp();
              NEW.localite_verifiee_par := NULLIF(pg_catalog.current_setting('app.immo_actor_id', true), '');
              v_action := 'locality_verified';
            ELSIF OLD.localite_statut = 'VERIFIEE' AND NEW.localite_statut <> 'VERIFIEE' THEN
              RAISE EXCEPTION 'Une localité vérifiée ne peut pas être rétrogradée en HOLD';
            ELSIF NEW.localite_statut = 'HOLD' THEN
              NEW.reference := NULL;
              NEW.titre := NULL;
              NEW.localite_preuve_reference := NULL;
              NEW.localite_anstat_code := NULL;
              NEW.localite_verifiee_le := NULL;
              NEW.localite_verifiee_par := NULL;
              NEW.publier_vitrine := FALSE;
            END IF;
            IF NEW.publier_vitrine AND
               (NEW.localite_statut <> 'VERIFIEE' OR NEW.reference IS NULL OR NEW.titre IS NULL) THEN
              RAISE EXCEPTION 'Un bien en HOLD localisé ne peut pas être publié';
            END IF;
            IF NEW.reference IS DISTINCT FROM OLD.reference AND OLD.reference IS NOT NULL THEN
              RAISE EXCEPTION 'La référence IMM est immuable';
            END IF;
            IF NEW.publier_vitrine AND NOT OLD.publier_vitrine THEN
              NEW.titre_fige_le := pg_catalog.clock_timestamp();
            ELSIF NOT NEW.publier_vitrine AND OLD.publier_vitrine THEN
              NEW.titre_fige_le := NULL;
            END IF;

            IF NEW.localite_statut = 'VERIFIEE' AND
               (NEW.type_bien IS DISTINCT FROM OLD.type_bien OR
               NEW.commune IS DISTINCT FROM OLD.commune OR
               NEW.ville IS DISTINCT FROM OLD.ville) THEN
              NEW.titre := public.eg_immobilier_derive_title(
                NEW.type_bien,NEW.commune,NEW.ville,NEW.reference);
            ELSIF NEW.localite_statut = 'VERIFIEE' THEN
              -- Never trust a caller-supplied title, even through direct SQL.
              NEW.titre := public.eg_immobilier_derive_title(
                OLD.type_bien,OLD.commune,OLD.ville,OLD.reference);
            ELSE
              NEW.reference := NULL;
              NEW.titre := NULL;
            END IF;

            IF v_action = 'locality_verified' THEN
              v_action := 'locality_verified';
            ELSIF NEW.statut IS DISTINCT FROM OLD.statut THEN
              v_action := 'transition';
            ELSIF NEW.publier_vitrine IS DISTINCT FROM OLD.publier_vitrine THEN
              v_action := CASE WHEN NEW.publier_vitrine THEN 'published' ELSE 'unpublished' END;
            ELSE
              v_action := 'updated';
            END IF;
            NEW.updated_at := pg_catalog.clock_timestamp();
            RETURN NEW;
          END IF;
          RETURN NEW;
        END;
        $function$
    """)
    op.execute(f"ALTER FUNCTION public.eg_immobilier_property_guard() OWNER TO {quoted_owner}")

    op.execute("""
        CREATE OR REPLACE FUNCTION public.eg_immobilier_property_audit()
        RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
        SET search_path = pg_catalog, pg_temp
        AS $function$
        DECLARE v_action TEXT;
        BEGIN
          IF TG_OP = 'INSERT' THEN
            PERFORM public.eg_immobilier_audit_insert(
              NEW.id::TEXT, NEW.reference, 'created', NULL, NULL, pg_catalog.to_jsonb(NEW));
            RETURN NEW;
          END IF;
          IF OLD.localite_statut IS DISTINCT FROM NEW.localite_statut THEN
            v_action := 'locality_verified';
          ELSIF OLD.statut IS DISTINCT FROM NEW.statut THEN
            v_action := 'transition';
          ELSIF OLD.publier_vitrine IS DISTINCT FROM NEW.publier_vitrine THEN
            v_action := CASE WHEN NEW.publier_vitrine THEN 'published' ELSE 'unpublished' END;
          ELSE
            v_action := 'updated';
          END IF;
          PERFORM public.eg_immobilier_audit_insert(
            NEW.id::TEXT, NEW.reference, v_action, NULL, pg_catalog.to_jsonb(OLD), pg_catalog.to_jsonb(NEW));
          RETURN NEW;
        END;
        $function$
    """)
    op.execute(f"ALTER FUNCTION public.eg_immobilier_property_audit() OWNER TO {quoted_owner}")

    op.execute("""
        CREATE OR REPLACE FUNCTION public.eg_immobilier_record_refusal(
          p_property_id TEXT, p_attempted_status TEXT, p_reason TEXT
        ) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER
        SET search_path = pg_catalog, pg_temp
        AS $function$
        DECLARE v_property public.properties%ROWTYPE;
        BEGIN
          SELECT * INTO v_property FROM public.properties WHERE id::TEXT=p_property_id;
          IF NOT FOUND THEN RAISE EXCEPTION 'Bien introuvable'; END IF;
          PERFORM public.eg_immobilier_audit_insert(
            v_property.id::TEXT, v_property.reference, 'transition_refused', p_reason,
            pg_catalog.to_jsonb(v_property),
            pg_catalog.jsonb_build_object('attempted_status',p_attempted_status));
        END;
        $function$
    """)
    op.execute("ALTER FUNCTION public.eg_immobilier_record_refusal(TEXT,TEXT,TEXT) OWNER TO postgres")
    op.execute("REVOKE ALL ON FUNCTION public.eg_immobilier_record_refusal(TEXT,TEXT,TEXT) FROM PUBLIC")
    op.execute(f"GRANT EXECUTE ON FUNCTION public.eg_immobilier_record_refusal(TEXT,TEXT,TEXT) TO {quoted_owner}")

    op.execute("""
        CREATE OR REPLACE FUNCTION public.eg_immobilier_audit_no_mutation()
        RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
        SET search_path = pg_catalog, pg_temp
        AS $function$
        BEGIN
          RAISE EXCEPTION 'Journal Immobilier append-only: UPDATE/DELETE/TRUNCATE refusé';
        END;
        $function$
    """)
    op.execute("ALTER FUNCTION public.eg_immobilier_audit_no_mutation() OWNER TO postgres")
    op.execute("REVOKE ALL ON FUNCTION public.eg_immobilier_audit_no_mutation() FROM PUBLIC")

    op.execute("DROP TRIGGER IF EXISTS trg_immobilier_property_guard ON public.properties")
    op.execute("""
        CREATE TRIGGER trg_immobilier_property_guard
        BEFORE INSERT OR UPDATE OR DELETE ON public.properties
        FOR EACH ROW EXECUTE FUNCTION public.eg_immobilier_property_guard()
    """)
    op.execute("""
        CREATE TRIGGER trg_immobilier_property_audit
        AFTER INSERT OR UPDATE ON public.properties
        FOR EACH ROW EXECUTE FUNCTION public.eg_immobilier_property_audit()
    """)
    op.execute("""
        CREATE TRIGGER trg_properties_audit_immutable
        BEFORE UPDATE OR DELETE ON public.properties_audit
        FOR EACH ROW EXECUTE FUNCTION public.eg_immobilier_audit_no_mutation()
    """)
    op.execute("""
        CREATE TRIGGER trg_properties_audit_no_truncate
        BEFORE TRUNCATE ON public.properties_audit
        FOR EACH STATEMENT EXECUTE FUNCTION public.eg_immobilier_audit_no_mutation()
    """)

    # Make the audit write-only from the business trigger path. Existing app
    # ACLs are removed where meaningful; a PostgreSQL superuser can bypass ACLs,
    # so the DML trigger is also tested against the effective app table-owner role.
    op.execute(f"REVOKE ALL ON public.properties_audit FROM PUBLIC, {quoted_owner}")
    op.execute(f"GRANT SELECT ON public.properties_audit TO {quoted_owner}")
    op.execute(f"REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.properties_audit FROM {quoted_owner}")

    # 10. Validate the exact seed and constraints before Alembic commits.
    op.execute("""
        DO $block$
        BEGIN
          IF (SELECT count(*) FROM public.immobilier_statut_transitions) <> 18 THEN
            RAISE EXCEPTION 'Matrice Immobilier V2 incomplète';
          END IF;
          IF (SELECT count(*) FROM public.immobilier_types_bien) <> 17 THEN
            RAISE EXCEPTION 'Référentiel type_bien incomplet';
          END IF;
          IF EXISTS (
            SELECT 1 FROM public.properties
            WHERE localite_statut='VERIFIEE' AND (reference IS NULL OR titre IS NULL)
          ) THEN
            RAISE EXCEPTION 'Bien localisé vérifié sans référence/titre IMM';
          END IF;
          IF EXISTS (SELECT titre FROM public.properties WHERE titre IS NOT NULL GROUP BY titre HAVING count(*) > 1) THEN
            RAISE EXCEPTION 'Doublon de titre après migration';
          END IF;
        END;
        $block$
    """)


def downgrade() -> None:
    bind = op.get_bind()
    database = bind.execute(sa.text("SELECT current_database()")).scalar_one()
    if database != "egs_test":
        raise RuntimeError(
            "IMMOBILIER V2 GUARD: base interdite — seule egs_test est autorisée"
        )
    if bind.execute(sa.text("SELECT count(*) FROM public.properties")).scalar_one():
        raise RuntimeError(
            "Downgrade Immobilier V2 refusé tant que properties contient des lignes; "
            "supprimez uniquement les données de test identifiées dans egs_test"
        )

    op.execute("DROP TRIGGER IF EXISTS trg_properties_audit_no_truncate ON public.properties_audit")
    op.execute("DROP TRIGGER IF EXISTS trg_properties_audit_immutable ON public.properties_audit")
    op.execute("DROP TRIGGER IF EXISTS trg_immobilier_property_audit ON public.properties")
    op.execute("DROP TRIGGER IF EXISTS trg_immobilier_property_guard ON public.properties")
    op.drop_index("idx_properties_audit_request", table_name="properties_audit", schema="public")
    op.drop_index("idx_properties_audit_property_time", table_name="properties_audit", schema="public")
    op.execute("DROP TABLE public.properties_audit")
    op.execute("DROP TABLE public.immobilier_statut_transitions")
    op.execute("DROP TABLE public.immobilier_reference_counters")
    op.execute("DROP FUNCTION public.eg_immobilier_property_audit()")
    op.execute("DROP FUNCTION public.eg_immobilier_property_guard()")
    op.execute("DROP FUNCTION public.eg_immobilier_audit_no_mutation()")
    op.execute("DROP FUNCTION public.eg_immobilier_record_refusal(TEXT,TEXT,TEXT)")
    op.execute("DROP FUNCTION public.eg_immobilier_audit_insert(TEXT,TEXT,TEXT,TEXT,JSONB,JSONB)")
    op.execute("DROP FUNCTION public.eg_immobilier_derive_title(TEXT,TEXT,TEXT,TEXT)")
    op.execute("DROP FUNCTION public.eg_immobilier_type_label(TEXT)")
    op.execute("DROP FUNCTION public.eg_immobilier_next_reference(INTEGER)")
    op.drop_constraint("uq_properties_titre_v2", "properties", type_="unique", schema="public")
    op.drop_constraint("uq_properties_reference_v2", "properties", type_="unique", schema="public")
    op.drop_constraint("fk_properties_type_bien_v2", "properties", type_="foreignkey", schema="public")
    op.drop_constraint("ck_property_statut_v2", "properties", type_="check", schema="public")
    op.drop_constraint("ck_property_localite_statut_v2", "properties", type_="check", schema="public")
    op.drop_constraint("ck_property_localite_contract_v2", "properties", type_="check", schema="public")
    op.execute("""
        ALTER TABLE public.properties
        ADD CONSTRAINT ck_property_statut CHECK
          (statut IN ('disponible','louee','vendue','en_travaux','retiree','archivee'))
    """)
    op.execute("""
        ALTER TABLE public.properties
        ADD CONSTRAINT ck_property_type CHECK
          (type_bien IN ('appartement','maison','villa','studio','duplex','triplex',
                         'loft','bureau','local_commercial','entrepot','terrain',
                         'garage','parking','autre'))
    """)
    op.execute("DROP TABLE public.immobilier_types_bien")
    op.drop_column("properties", "titre_fige_le", schema="public")

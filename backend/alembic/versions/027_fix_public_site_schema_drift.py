"""Repair public-site schema drift on vitrine_lots and related tables.

Revision ID: 027_fix_public_site_schema_drift
Revises: 026_add_lot_barcode_and_cedant
Create Date: 2026-09-22 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "027_fix_public_site_schema_drift"
down_revision = "026_add_lot_barcode_and_cedant"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return

    # Ensure the public site table matches the current SQLAlchemy model.
    add_columns = {
        "lot_id": "UUID",
        "property_id": "UUID",
        "titre": "VARCHAR(255)",
        "description": "TEXT",
        "prix": "NUMERIC(12,2)",
        "surface": "NUMERIC(10,2)",
        "localisation": "TEXT",
        "photos": "JSON",
        "publier": "BOOLEAN",
        "ordre": "INTEGER",
        "tags": "TEXT[]",
        "reference": "VARCHAR(255)",
        "village": "VARCHAR(255)",
        "quartier": "VARCHAR(255)",
        "commune": "VARCHAR(255)",
        "departement": "VARCHAR(255)",
        "region": "VARCHAR(255)",
        "superficie": "NUMERIC(10,2)",
        "prix_vente": "NUMERIC(12,2)",
        "statut": "VARCHAR(50)",
        "documents": "JSON",
        "caracteristiques": "JSON",
        "image_url": "TEXT",
        "image_alt": "TEXT",
        "contact_phone": "VARCHAR(50)",
        "contact_email": "VARCHAR(255)",
        "publier_sur_vitrine": "BOOLEAN",
        "ordre_affichage": "INTEGER",
        "notes": "TEXT",
        "created_by": "UUID",
        "updated_by": "UUID",
    }

    for column_name, column_type in add_columns.items():
        bind.execute(
            sa.text(
                f"""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_name = 'vitrine_lots' AND column_name = '{column_name}'
                    ) THEN
                        ALTER TABLE vitrine_lots ADD COLUMN {column_name} {column_type};
                    END IF;
                END $$;
                """
            )
        )

    # Restore compatibility indexes and normalize legacy text UUIDs before adding constraints.
    bind.execute(sa.text("CREATE INDEX IF NOT EXISTS idx_vitrine_lot_reference ON vitrine_lots (reference);"))
    bind.execute(sa.text("CREATE INDEX IF NOT EXISTS idx_vitrine_lot_statut ON vitrine_lots (statut);"))
    bind.execute(sa.text("CREATE INDEX IF NOT EXISTS idx_vitrine_lot_publie ON vitrine_lots (publier_sur_vitrine);"))

    bind.execute(
        sa.text(
            """
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'vitrine_lots' AND column_name = 'lot_id'
                      AND data_type <> 'uuid'
                ) THEN
                    ALTER TABLE vitrine_lots
                    ALTER COLUMN lot_id TYPE UUID USING CASE
                        WHEN lot_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
                        THEN lot_id::uuid
                        ELSE NULL
                    END;
                END IF;
            END $$;
            """
        )
    )

    bind.execute(
        sa.text(
            """
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'vitrine_lots' AND column_name = 'property_id'
                      AND data_type <> 'uuid'
                ) THEN
                    ALTER TABLE vitrine_lots
                    ALTER COLUMN property_id TYPE UUID USING CASE
                        WHEN property_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
                        THEN property_id::uuid
                        ELSE NULL
                    END;
                END IF;
            END $$;
            """
        )
    )

    bind.execute(
        sa.text(
            """
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.tables WHERE table_name = 'foncier_lots'
                )
                AND NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'fk_vitrine_lot_lot'
                ) THEN
                    ALTER TABLE vitrine_lots
                    ADD CONSTRAINT fk_vitrine_lot_lot
                    FOREIGN KEY (lot_id) REFERENCES foncier_lots(id) ON DELETE CASCADE;
                END IF;
            END $$;
            """
        )
    )

    bind.execute(
        sa.text(
            """
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.tables WHERE table_name = 'properties'
                )
                AND NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'fk_vitrine_lot_property'
                ) THEN
                    ALTER TABLE vitrine_lots
                    ADD CONSTRAINT fk_vitrine_lot_property
                    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;
                END IF;
            END $$;
            """
        )
    )

    # Some deployments also drifted on the attestation table by not creating the expected
    # metadata columns used by the current Foncier workflow.
    bind.execute(
        sa.text(
            """
            ALTER TABLE foncier_attestations
            ADD COLUMN IF NOT EXISTS row_version INTEGER NOT NULL DEFAULT 1;
            """
        )
    )
    bind.execute(
        sa.text(
            """
            ALTER TABLE foncier_attestation_temoins
            ADD COLUMN IF NOT EXISTS entity_id UUID;
            """
        )
    )
    bind.execute(
        sa.text(
            """
            CREATE INDEX IF NOT EXISTS idx_temoin_entity_id
            ON foncier_attestation_temoins (entity_id);
            """
        )
    )


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return

    bind.execute(sa.text("DROP INDEX IF EXISTS idx_vitrine_lot_reference;"))
    bind.execute(sa.text("DROP INDEX IF EXISTS idx_vitrine_lot_statut;"))
    bind.execute(sa.text("DROP INDEX IF EXISTS idx_vitrine_lot_publie;"))
    bind.execute(sa.text("DROP INDEX IF EXISTS idx_temoin_entity_id;"))

    bind.execute(sa.text("ALTER TABLE vitrine_lots DROP CONSTRAINT IF EXISTS fk_vitrine_lot_lot;"))
    bind.execute(sa.text("ALTER TABLE vitrine_lots DROP CONSTRAINT IF EXISTS fk_vitrine_lot_property;"))

    for column_name in (
        "lot_id", "property_id", "titre", "description", "prix", "surface",
        "localisation", "photos", "publier", "ordre", "tags", "reference",
        "village", "quartier", "commune", "departement", "region", "superficie",
        "prix_vente", "statut", "documents", "caracteristiques", "image_url",
        "image_alt", "contact_phone", "contact_email", "publier_sur_vitrine",
        "ordre_affichage", "notes", "created_by", "updated_by",
    ):
        bind.execute(sa.text(f"ALTER TABLE vitrine_lots DROP COLUMN IF EXISTS {column_name};"))

    bind.execute(sa.text("ALTER TABLE foncier_attestation_temoins DROP COLUMN IF EXISTS entity_id;"))
    bind.execute(sa.text("ALTER TABLE foncier_attestations DROP COLUMN IF EXISTS row_version;"))

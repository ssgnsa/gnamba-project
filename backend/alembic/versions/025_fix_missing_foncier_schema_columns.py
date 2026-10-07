"""Fix missing Foncier schema columns introduced by partial migration drift.

Revision ID: 025_fix_missing_foncier_schema_columns
Revises: 024_add_media_taxonomy_and_content_hash
Create Date: 2026-09-14 00:00:00.000000

This migration repairs columns that are expected by the current SQLAlchemy models
but were never created on some live Postgres databases due to partial migration drift.
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "025_fix_missing_foncier_schema_columns"
down_revision = "024_add_media_taxonomy_and_content_hash"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return

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

    bind.execute(
        sa.text(
            """
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM information_schema.tables
                    WHERE table_name = 'entities'
                )
                AND NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'fk_attestation_temoins_entity'
                ) THEN
                    ALTER TABLE foncier_attestation_temoins
                    ADD CONSTRAINT fk_attestation_temoins_entity
                    FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE SET NULL;
                END IF;
            END $$;
            """
        )
    )


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return

    bind.execute(
        sa.text(
            """
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'fk_attestation_temoins_entity'
                ) THEN
                    ALTER TABLE foncier_attestation_temoins
                    DROP CONSTRAINT fk_attestation_temoins_entity;
                END IF;
            END $$;
            """
        )
    )

    bind.execute(
        sa.text(
            """
            DROP INDEX IF EXISTS idx_temoin_entity_id;
            """
        )
    )

    bind.execute(
        sa.text(
            """
            ALTER TABLE foncier_attestation_temoins
            DROP COLUMN IF EXISTS entity_id;
            """
        )
    )

    bind.execute(
        sa.text(
            """
            ALTER TABLE foncier_attestations
            DROP COLUMN IF EXISTS row_version;
            """
        )
    )

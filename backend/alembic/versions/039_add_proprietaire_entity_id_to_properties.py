"""Add proprietor entity link to properties.

Revision ID: 039_add_proprietaire_entity_id_to_properties
Revises: 038_fix_foncier_schema_drift
Create Date: 2026-11-02 00:00:00.000000

The live database was created from the legacy 007 schema which used
proprietaire_client_id (FK parties.id). The current SQLAlchemy ORM contract and
the properties API expect proprietaire_entity_id (FK entities.id) to link a
property to its unified business identity (Entity/Client). This revision adds
the missing column defensively so existing EGS databases can run the property
create/update endpoints end to end.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "039_add_proprietaire_entity_id_to_properties"
down_revision = "038_fix_foncier_schema_drift"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE properties
            ADD COLUMN IF NOT EXISTS proprietaire_entity_id UUID
        """
    )

    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'fk_properties_proprietaire_entity_id_entities'
            ) THEN
                ALTER TABLE properties
                    ADD CONSTRAINT fk_properties_proprietaire_entity_id_entities
                    FOREIGN KEY (proprietaire_entity_id) REFERENCES entities(id) ON DELETE SET NULL;
            END IF;
        END $$;
        """
    )

    op.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_properties_proprietaire_entity_id
            ON properties (proprietaire_entity_id)
        """
    )


def downgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'fk_properties_proprietaire_entity_id_entities'
            ) THEN
                ALTER TABLE properties
                    DROP CONSTRAINT fk_properties_proprietaire_entity_id_entities;
            END IF;
        END $$;
        """
    )

    op.execute(
        """
        ALTER TABLE properties
            DROP COLUMN IF EXISTS proprietaire_entity_id
        """
    )

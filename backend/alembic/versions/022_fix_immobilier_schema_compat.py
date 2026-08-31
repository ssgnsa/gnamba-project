"""Repair the live immobilier schema to match the current ORM contract.

Revision ID: 022_fix_immobilier_schema_compat
Revises: 012_public_site_tables
Create Date: 2026-08-28 00:00:00.000000

This migration is intentionally defensive: the live database was created from a
simplified legacy schema and is missing fields expected by the current
properties/lease_contracts/rent_payments SQLAlchemy models.
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "022_fix_immobilier_schema_compat"
down_revision = "b350fd2b6f19"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'properties'
                  AND column_name = 'charges_mensuelles'
            ) THEN
                ALTER TABLE properties
                    ADD COLUMN charges_mensuelles NUMERIC(10, 2) DEFAULT 0;
            END IF;

            IF NOT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'properties'
                  AND column_name = 'created_by'
            ) THEN
                ALTER TABLE properties
                    ADD COLUMN created_by UUID;
            END IF;

            IF NOT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'properties'
                  AND column_name = 'updated_by'
            ) THEN
                ALTER TABLE properties
                    ADD COLUMN updated_by UUID;
            END IF;
        END $$;
        """
    )

    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'lease_contracts'
                  AND column_name = 'property_id'
            ) THEN
                ALTER TABLE lease_contracts
                    ADD COLUMN property_id UUID,
                    ADD COLUMN locataire_id TEXT,
                    ADD COLUMN locataire_entity_id UUID,
                    ADD COLUMN date_debut TIMESTAMP WITH TIME ZONE,
                    ADD COLUMN date_fin TIMESTAMP WITH TIME ZONE,
                    ADD COLUMN loyer_mensuel NUMERIC(10, 2),
                    ADD COLUMN charges_mensuelles NUMERIC(10, 2) DEFAULT 0,
                    ADD COLUMN depot_garantie NUMERIC(10, 2) DEFAULT 0,
                    ADD COLUMN statut TEXT DEFAULT 'actif',
                    ADD COLUMN notes TEXT,
                    ADD COLUMN reference TEXT,
                    ADD COLUMN commission_rate NUMERIC(5, 2) DEFAULT 12.0,
                    ADD COLUMN jour_echeance INTEGER DEFAULT 10;
            END IF;
        END $$;
        """
    )

    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'rent_payments'
                  AND column_name = 'locataire_entity_id'
            ) THEN
                ALTER TABLE rent_payments
                    ADD COLUMN locataire_entity_id UUID,
                    ADD COLUMN date_echeance TIMESTAMP WITH TIME ZONE,
                    ADD COLUMN last_document_type TEXT,
                    ADD COLUMN last_document_at TIMESTAMP WITH TIME ZONE,
                    ADD COLUMN last_document_by UUID;
            END IF;
        END $$;
        """
    )

    op.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_immobilier_property_charges
            ON properties (charges_mensuelles);
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_immobilier_contract_property
            ON lease_contracts (property_id);
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_immobilier_contract_locataire_entity
            ON lease_contracts (locataire_entity_id);
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_immobilier_payment_locataire_entity
            ON rent_payments (locataire_entity_id);
        """
    )


def downgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'properties'
                  AND column_name = 'charges_mensuelles'
            ) THEN
                ALTER TABLE properties DROP COLUMN charges_mensuelles;
            END IF;

            IF EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'properties'
                  AND column_name = 'created_by'
            ) THEN
                ALTER TABLE properties DROP COLUMN created_by;
            END IF;

            IF EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'properties'
                  AND column_name = 'updated_by'
            ) THEN
                ALTER TABLE properties DROP COLUMN updated_by;
            END IF;
        END $$;
        """
    )

    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'lease_contracts'
                  AND column_name = 'property_id'
            ) THEN
                ALTER TABLE lease_contracts
                    DROP COLUMN IF EXISTS property_id,
                    DROP COLUMN IF EXISTS locataire_id,
                    DROP COLUMN IF EXISTS locataire_entity_id,
                    DROP COLUMN IF EXISTS date_debut,
                    DROP COLUMN IF EXISTS date_fin,
                    DROP COLUMN IF EXISTS loyer_mensuel,
                    DROP COLUMN IF EXISTS charges_mensuelles,
                    DROP COLUMN IF EXISTS depot_garantie,
                    DROP COLUMN IF EXISTS statut,
                    DROP COLUMN IF EXISTS notes,
                    DROP COLUMN IF EXISTS reference,
                    DROP COLUMN IF EXISTS commission_rate,
                    DROP COLUMN IF EXISTS jour_echeance;
            END IF;
        END $$;
        """
    )

    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'rent_payments'
                  AND column_name = 'locataire_entity_id'
            ) THEN
                ALTER TABLE rent_payments
                    DROP COLUMN IF EXISTS locataire_entity_id,
                    DROP COLUMN IF EXISTS date_echeance,
                    DROP COLUMN IF EXISTS last_document_type,
                    DROP COLUMN IF EXISTS last_document_at,
                    DROP COLUMN IF EXISTS last_document_by;
            END IF;
        END $$;
        """
    )

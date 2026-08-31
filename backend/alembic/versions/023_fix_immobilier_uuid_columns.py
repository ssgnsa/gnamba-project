"""Align immobilier UUID columns with the SQLAlchemy ORM contract.

Revision ID: 023_fix_immobilier_uuid_columns
Revises: 022_fix_immobilier_schema_compat
Create Date: 2026-08-28 18:00:00.000000
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "023_fix_immobilier_uuid_columns"
down_revision = "022_fix_immobilier_schema_compat"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE properties
            ALTER COLUMN id TYPE UUID USING id::uuid;
        """
    )

    op.execute(
        """
        ALTER TABLE lease_contracts
            ALTER COLUMN id TYPE UUID USING id::uuid;
        """
    )

    op.execute(
        """
        ALTER TABLE rent_payments
            ALTER COLUMN id TYPE UUID USING id::uuid,
            ALTER COLUMN property_id TYPE UUID USING property_id::uuid,
            ALTER COLUMN contract_id TYPE UUID USING contract_id::uuid;
        """
    )


def downgrade() -> None:
    op.execute(
        """
        ALTER TABLE rent_payments
            ALTER COLUMN contract_id TYPE TEXT USING contract_id::text,
            ALTER COLUMN property_id TYPE TEXT USING property_id::text,
            ALTER COLUMN id TYPE TEXT USING id::text;
        """
    )

    op.execute(
        """
        ALTER TABLE lease_contracts
            ALTER COLUMN id TYPE TEXT USING id::text;
        """
    )

    op.execute(
        """
        ALTER TABLE properties
            ALTER COLUMN id TYPE TEXT USING id::text;
        """
    )

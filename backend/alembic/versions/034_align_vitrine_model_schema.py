"""Align the public vitrine-lot schema with its active SQLAlchemy model.

Revision ID: 034_align_vitrine_model_schema
Revises: 033_media_repository_schema_contract
"""

from alembic import op


revision = "034_align_vitrine_model_schema"
down_revision = "033_media_repository_schema_contract"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE public.vitrine_lots
            ALTER COLUMN titre DROP NOT NULL,
            ALTER COLUMN photos DROP NOT NULL,
            ALTER COLUMN publier DROP NOT NULL,
            ALTER COLUMN ordre DROP NOT NULL,
            ALTER COLUMN tags DROP NOT NULL,
            ALTER COLUMN reference TYPE TEXT USING reference::TEXT,
            ALTER COLUMN village TYPE TEXT USING village::TEXT,
            ALTER COLUMN quartier TYPE TEXT USING quartier::TEXT,
            ALTER COLUMN commune TYPE TEXT USING commune::TEXT,
            ALTER COLUMN departement TYPE TEXT USING departement::TEXT,
            ALTER COLUMN region TYPE TEXT USING region::TEXT,
            ALTER COLUMN documents TYPE TEXT USING documents::TEXT,
            ALTER COLUMN contact_phone TYPE TEXT USING contact_phone::TEXT,
            ALTER COLUMN contact_email TYPE TEXT USING contact_email::TEXT,
            ALTER COLUMN created_by TYPE TEXT USING created_by::TEXT,
            ALTER COLUMN updated_by TYPE TEXT USING updated_by::TEXT
        """
    )


def downgrade() -> None:
    raise RuntimeError(
        "The vitrine schema alignment is forward-only; no type or nullability "
        "rollback is attempted automatically."
    )

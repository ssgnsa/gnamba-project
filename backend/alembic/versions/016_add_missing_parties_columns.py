"""Add missing columns to parties table

Revision ID: 016_add_missing_parties_columns
Revises: 015_add_missing_foncier_columns
Create Date: 2025-01-01
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '016_add_missing_parties_columns'
down_revision = '015_add_missing_foncier_columns'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Revision 005 already defines these columns. Keep this revision in the
    # chain as a no-op so a fresh database does not add the same columns twice.
    pass


def downgrade() -> None:
    # The columns belong to revision 005 and must not be removed here.
    pass

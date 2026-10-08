"""Add missing columns to app_settings table to match migration 014 schema.

Revision ID: 021_add_missing_app_settings_columns
Revises: 020_fix_settings_audit
Create Date: 2025-08-06 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '021_add_app_settings_cols'
down_revision = '020_fix_settings_audit'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Revision 014 already defines these columns and indexes. Retain this
    # revision as a no-op instead of duplicating its schema objects.
    pass


def downgrade() -> None:
    # The columns and indexes belong to revision 014 and must remain intact.
    pass

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
    # Add missing columns to app_settings table
    op.add_column('app_settings', sa.Column('value_type', sa.String(20), nullable=False, server_default='json'))
    op.add_column('app_settings', sa.Column('category', sa.String(50), nullable=False, server_default='general'))
    op.add_column('app_settings', sa.Column('description', sa.Text(), nullable=True))
    op.add_column('app_settings', sa.Column('is_public', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('app_settings', sa.Column('is_editable', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('app_settings', sa.Column('validation_schema', postgresql.JSON(), nullable=True))
    op.add_column('app_settings', sa.Column('default_value', postgresql.JSON(), nullable=True))
    
    # Create indexes
    op.create_index('idx_app_settings_category', 'app_settings', ['category'])
    op.create_index('idx_app_settings_public', 'app_settings', ['is_public'])


def downgrade() -> None:
    op.drop_index('idx_app_settings_public', table_name='app_settings')
    op.drop_index('idx_app_settings_category', table_name='app_settings')
    
    op.drop_column('app_settings', 'default_value')
    op.drop_column('app_settings', 'validation_schema')
    op.drop_column('app_settings', 'is_editable')
    op.drop_column('app_settings', 'is_public')
    op.drop_column('app_settings', 'description')
    op.drop_column('app_settings', 'category')
    op.drop_column('app_settings', 'value_type')
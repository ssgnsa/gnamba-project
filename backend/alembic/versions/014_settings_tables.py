"""Create settings tables (app_settings, user_profiles).

Revision ID: 014_settings_tables
Revises: 013_visits_stats_tables
Create Date: 2025-07-30 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '014_settings_tables'
down_revision = '013_visits_stats_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # APP_SETTINGS
    op.create_table(
        'app_settings',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('key', sa.String(100), nullable=False),
        sa.Column('value', postgresql.JSON(), nullable=False),
        sa.Column('value_type', sa.String(20), nullable=False, server_default='json'),
        sa.Column('category', sa.String(50), nullable=False, server_default='general'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_editable', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('validation_schema', postgresql.JSON(), nullable=True),
        sa.Column('default_value', postgresql.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('key')
    )
    op.create_index('idx_app_settings_category', 'app_settings', ['category'])
    op.create_index('idx_app_settings_public', 'app_settings', ['is_public'])

    # USER_PROFILES
    op.create_table(
        'user_profiles',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('avatar_media_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('theme', sa.String(20), nullable=False, server_default='light'),
        sa.Column('language', sa.String(10), nullable=False, server_default='fr'),
        sa.Column('timezone', sa.String(50), nullable=False, server_default='Africa/Abidjan'),
        sa.Column('date_format', sa.String(20), nullable=False, server_default='DD/MM/YYYY'),
        sa.Column('notifications_email', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('notifications_push', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('notifications_sms', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('dashboard_layout', postgresql.JSON(), nullable=False, server_default='{}'),
        sa.Column('sidebar_collapsed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('preferences', postgresql.JSON(), nullable=False, server_default='{}'),
        sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_login_ip', postgresql.INET(), nullable=True),
        sa.Column('login_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['avatar_media_id'], ['media_files.id'], ondelete='SET NULL')
    )
    op.create_index('idx_user_profile_user', 'user_profiles', ['user_id'])


def downgrade() -> None:
    op.drop_index('idx_user_profile_user', table_name='user_profiles')
    op.drop_table('user_profiles')
    
    op.drop_index('idx_app_settings_public', table_name='app_settings')
    op.drop_index('idx_app_settings_category', table_name='app_settings')
    op.drop_table('app_settings')
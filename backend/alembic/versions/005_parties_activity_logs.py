"""Create parties and activity_logs tables.

Revision ID: 005_parties_activity_logs
Revises: 004_auth_sessions_audit
Create Date: 2025-07-30 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '005_parties_activity_logs'
down_revision = '004_auth_sessions_audit'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # PARTIES TABLE
    op.create_table(
        'parties',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('type', sa.String(20), nullable=False, server_default='particulier'),
        sa.Column('nom', sa.String(255), nullable=True),
        sa.Column('prenom', sa.String(255), nullable=True),
        sa.Column('nom_entreprise', sa.String(255), nullable=True),
        sa.Column('cni_numero', sa.String(50), nullable=True),
        sa.Column('cni_date', sa.Date(), nullable=True),
        sa.Column('cni_lieu', sa.String(255), nullable=True),
        sa.Column('telephone', sa.String(50), nullable=True),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('adresse', sa.Text(), nullable=True),
        sa.Column('profession', sa.String(255), nullable=True),
        sa.Column('employeur', sa.String(255), nullable=True),
        sa.Column('naissance_date', sa.Date(), nullable=True),
        sa.Column('naissance_lieu', sa.String(255), nullable=True),
        sa.Column('nationalite', sa.String(100), nullable=True),
        sa.Column('actif', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=False), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_party_type', 'parties', ['type'])
    op.create_index('idx_party_client_cni', 'parties', ['cni_numero'])
    op.create_index('idx_party_actif', 'parties', ['actif'])

    # ACTIVITY_LOGS TABLE (replaces/extends audit_logs from 002)
    op.create_table(
        'activity_logs',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('entity_type', sa.String(50), nullable=False),
        sa.Column('entity_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('entity_reference', sa.String(100), nullable=True),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('action_category', sa.String(20), nullable=False, server_default='data'),
        sa.Column('old_values', postgresql.JSON(), nullable=True),
        sa.Column('new_values', postgresql.JSON(), nullable=True),
        sa.Column('changed_fields', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('user_role', sa.String(50), nullable=True),
        sa.Column('user_name', sa.String(255), nullable=True),
        sa.Column('ip_address', postgresql.INET(), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('request_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('device_id', sa.String(100), nullable=True),
        sa.Column('log_metadata', postgresql.JSON(), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_activity_entity', 'activity_logs', ['entity_type', 'entity_id'])
    op.create_index('idx_activity_user', 'activity_logs', ['user_id'])
    op.create_index('idx_activity_action', 'activity_logs', ['action'])
    op.create_index('idx_activity_created', 'activity_logs', ['created_at'])
    op.create_index('idx_activity_request', 'activity_logs', ['request_id'])


def downgrade() -> None:
    op.drop_index('idx_activity_request', table_name='activity_logs')
    op.drop_index('idx_activity_created', table_name='activity_logs')
    op.drop_index('idx_activity_action', table_name='activity_logs')
    op.drop_index('idx_activity_user', table_name='activity_logs')
    op.drop_index('idx_activity_entity', table_name='activity_logs')
    op.drop_table('activity_logs')
    
    op.drop_index('idx_party_actif', table_name='parties')
    op.drop_index('idx_party_client_cni', table_name='parties')
    op.drop_index('idx_party_type', table_name='parties')
    op.drop_table('parties')
"""Create entities table (unified parties, employees, suppliers, partners, leads, visitors).

Revision ID: 017_create_entities_table
Revises: 016_add_missing_parties_columns
Create Date: 2026-08-03 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '017_create_entities_table'
down_revision = '016_add_missing_parties_columns'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ENTITIES - Table unifiée pour toutes les entités
    op.create_table(
        'entities',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('type', sa.String(30), nullable=False),
        sa.Column('subtype', sa.String(50), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='active'),
        sa.Column('display_name', sa.String(255), nullable=True),

        # Identité
        sa.Column('first_name', sa.String(255), nullable=True),
        sa.Column('last_name', sa.String(255), nullable=True),
        sa.Column('company_name', sa.String(255), nullable=True),

        # Documents d'identité
        sa.Column('id_document_type', sa.String(50), nullable=True),
        sa.Column('id_document_number', sa.String(100), nullable=True),
        sa.Column('id_document_date', sa.Date(), nullable=True),
        sa.Column('id_document_place', sa.String(255), nullable=True),

        # Contact
        sa.Column('phone', sa.String(50), nullable=True),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),

        # Professionnel
        sa.Column('profession', sa.String(255), nullable=True),
        sa.Column('employer', sa.String(255), nullable=True),

        # Personnel
        sa.Column('birth_date', sa.Date(), nullable=True),
        sa.Column('birth_place', sa.String(255), nullable=True),
        sa.Column('nationality', sa.String(100), nullable=True),

        # Métadonnées extensibles
        sa.Column('metadata', postgresql.JSON(), nullable=False, server_default='{}'),

        # Audit & Sync
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_by', postgresql.UUID(as_uuid=False), nullable=True),

        sa.PrimaryKeyConstraint('id')
    )

    # Index pour performances
    op.create_index('idx_entity_type', 'entities', ['type'])
    op.create_index('idx_entity_subtype', 'entities', ['subtype'])
    op.create_index('idx_entity_status', 'entities', ['status'])
    op.create_index('idx_entity_type_status', 'entities', ['type', 'status'])
    op.create_index('idx_entity_name_search', 'entities', ['last_name', 'first_name', 'company_name'])
    op.create_index('idx_entity_phone', 'entities', ['phone'])
    op.create_index('idx_entity_email', 'entities', ['email'])
    op.create_index('idx_entity_contact_search', 'entities', ['phone', 'email'])
    op.create_index('idx_entity_doc_search', 'entities', ['id_document_type', 'id_document_number'])
    op.create_index('idx_entity_deleted', 'entities', ['deleted_at'])

    # Contraintes de validation
    op.create_check_constraint(
        'ck_entity_type',
        'entities',
        "type IN ('client', 'employee', 'supplier', 'partner', 'lead', 'visitor', 'user')"
    )
    op.create_check_constraint(
        'ck_entity_status',
        'entities',
        "status IN ('active', 'inactive', 'archived', 'pending', 'onboarding')"
    )

    # Contrainte d'unicité sur document d'identité (optionnelle, commentée pour l'instant)
    # op.create_unique_constraint('uq_entity_id_doc', 'entities', ['id_document_type', 'id_document_number'])


def downgrade() -> None:
    op.drop_constraint('ck_entity_status', 'entities', type_='check')
    op.drop_constraint('ck_entity_type', 'entities', type_='check')

    op.drop_index('idx_entity_deleted', table_name='entities')
    op.drop_index('idx_entity_doc_search', table_name='entities')
    op.drop_index('idx_entity_contact_search', table_name='entities')
    op.drop_index('idx_entity_email', table_name='entities')
    op.drop_index('idx_entity_phone', table_name='entities')
    op.drop_index('idx_entity_name_search', table_name='entities')
    op.drop_index('idx_entity_type_status', table_name='entities')
    op.drop_index('idx_entity_status', table_name='entities')
    op.drop_index('idx_entity_subtype', table_name='entities')
    op.drop_index('idx_entity_type', table_name='entities')

    op.drop_table('entities')
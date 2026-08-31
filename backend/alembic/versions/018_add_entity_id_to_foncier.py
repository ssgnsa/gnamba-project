"""Add entity_id columns to foncier tables (lots, attestations).

Revision ID: 018_add_entity_id_to_foncier
Revises: 017_create_entities_table
Create Date: 2026-08-03 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '018_add_entity_id_to_foncier'
down_revision = '017_create_entities_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # FONCIER_LOTS: ajouter proprietaire_entity_id
    op.add_column('foncier_lots',
        sa.Column('proprietaire_entity_id', postgresql.UUID(as_uuid=False), nullable=True)
    )
    op.create_index('idx_lot_proprietaire_entity', 'foncier_lots', ['proprietaire_entity_id'])
    op.create_foreign_key(
        'fk_lot_proprietaire_entity', 'foncier_lots', 'entities',
        ['proprietaire_entity_id'], ['id'], ondelete='SET NULL'
    )

#     # Migrer les données existantes: proprietaire_entity_id = proprietaire_client_id
#     op.execute("""
#         UPDATE foncier_lots
#         SET proprietaire_entity_id = proprietaire_client_id
#         WHERE proprietaire_client_id IS NOT NULL
#     """)

    # FONCIER_ATTESTATIONS: ajouter proprietaire_entity_id
    op.add_column('foncier_attestations',
        sa.Column('proprietaire_entity_id', postgresql.UUID(as_uuid=False), nullable=True)
    )
    op.create_index('idx_attestation_proprietaire_entity', 'foncier_attestations', ['proprietaire_entity_id'])
    op.create_foreign_key(
        'fk_attestation_proprietaire_entity', 'foncier_attestations', 'entities',
        ['proprietaire_entity_id'], ['id'], ondelete='SET NULL'
    )

#     # Migrer les données existantes
#     op.execute("""
#         UPDATE foncier_attestations
#         SET proprietaire_entity_id = proprietaire_client_id
#         WHERE proprietaire_client_id IS NOT NULL
#     """)


def downgrade() -> None:
    # FONCIER_ATTESTATIONS
    op.drop_constraint('fk_attestation_proprietaire_entity', 'foncier_attestations', type_='foreignkey')
    op.drop_index('idx_attestation_proprietaire_entity', table_name='foncier_attestations')
    op.drop_column('foncier_attestations', 'proprietaire_entity_id')

    # FONCIER_LOTS
    op.drop_constraint('fk_lot_proprietaire_entity', 'foncier_lots', type_='foreignkey')
    op.drop_index('idx_lot_proprietaire_entity', table_name='foncier_lots')
    op.drop_column('foncier_lots', 'proprietaire_entity_id')
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
    # Add missing columns to parties table
    op.add_column('parties', sa.Column('type', sa.Text(), nullable=True, server_default='particulier'))
    op.add_column('parties', sa.Column('nom_entreprise', sa.Text(), nullable=True))
    op.add_column('parties', sa.Column('cni_numero', sa.Text(), nullable=True))
    op.add_column('parties', sa.Column('cni_date', sa.Text(), nullable=True))
    op.add_column('parties', sa.Column('cni_lieu', sa.Text(), nullable=True))
    op.add_column('parties', sa.Column('profession', sa.Text(), nullable=True))
    op.add_column('parties', sa.Column('employeur', sa.Text(), nullable=True))
    op.add_column('parties', sa.Column('naissance_date', sa.Text(), nullable=True))
    op.add_column('parties', sa.Column('naissance_lieu', sa.Text(), nullable=True))
    op.add_column('parties', sa.Column('nationalite', sa.Text(), nullable=True))
    op.add_column('parties', sa.Column('actif', sa.Boolean(), nullable=True, server_default='true'))
    op.add_column('parties', sa.Column('created_by', sa.Text(), nullable=True))
    op.add_column('parties', sa.Column('updated_by', sa.Text(), nullable=True))


def downgrade() -> None:
    # Remove the added columns
    op.drop_column('parties', 'type')
    op.drop_column('parties', 'nom_entreprise')
    op.drop_column('parties', 'cni_numero')
    op.drop_column('parties', 'cni_date')
    op.drop_column('parties', 'cni_lieu')
    op.drop_column('parties', 'profession')
    op.drop_column('parties', 'employeur')
    op.drop_column('parties', 'naissance_date')
    op.drop_column('parties', 'naissance_lieu')
    op.drop_column('parties', 'nationalite')
    op.drop_column('parties', 'actif')
    op.drop_column('parties', 'created_by')
    op.drop_column('parties', 'updated_by')
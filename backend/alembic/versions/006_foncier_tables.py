"""Create foncier tables (villages, lotissements, ilots, lots, attestations, temoins, user_village_access).

Revision ID: 006_foncier_tables
Revises: 005_parties_activity_logs
Create Date: 2025-07-30 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '006_foncier_tables'
down_revision = '005_parties_activity_logs'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # FONCIER_VILLAGES
    op.create_table(
        'foncier_villages',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('nom', sa.String(255), nullable=False),
        sa.Column('code', sa.String(10), nullable=False),
        sa.Column('region', sa.String(255), nullable=True),
        sa.Column('departement', sa.String(255), nullable=True),
        sa.Column('commune', sa.String(255), nullable=True),
        sa.Column('chef_nom', sa.String(255), nullable=True),
        sa.Column('chef_telephone', sa.String(50), nullable=True),
        sa.Column('chef_email', sa.String(255), nullable=True),
        sa.Column('arrete_prefectoral', sa.Text(), nullable=True),
        sa.Column('arrete_date', sa.Date(), nullable=True),
        sa.Column('lieu_signature', sa.String(255), nullable=True),
        sa.Column('nom_signataire', sa.String(255), nullable=True),
        sa.Column('logo_media_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('primary_color', sa.String(7), nullable=False, server_default='#1e3a5f'),
        sa.Column('secondary_color', sa.String(7), nullable=False, server_default='#d4a843'),
        sa.Column('layout_preference', sa.String(50), nullable=False, server_default='standard'),
        sa.Column('config_jsonb', postgresql.JSON(), nullable=False, server_default='{}'),
        sa.Column('actif', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('statut', sa.String(), nullable=True),
        sa.Column('superficie_totale', sa.Float(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('nom'),
        sa.UniqueConstraint('code')
    )

    # FONCIER_LOTISSEMENTS
    op.create_table(
        'foncier_lotissements',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('village_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('nom', sa.String(255), nullable=False),
        sa.Column('code', sa.String(20), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('superficie_totale', sa.Numeric(12, 2), nullable=True),
        sa.Column('nombre_lots_prevus', sa.Integer(), nullable=True),
        sa.Column('arrete_lotissement', sa.Text(), nullable=True),
        sa.Column('arrete_date', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=False), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['village_id'], ['foncier_villages.id'], ondelete='CASCADE')
    )
    op.create_index('idx_lotissement_village', 'foncier_lotissements', ['village_id'])
    op.create_unique_constraint('uq_lotissement_village_nom', 'foncier_lotissements', ['village_id', 'nom'])

    # FONCIER_ILOTS
    op.create_table(
        'foncier_ilots',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('lotissement_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('numero', sa.String(50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('superficie_totale', sa.Numeric(10, 2), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=False), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['lotissement_id'], ['foncier_lotissements.id'], ondelete='CASCADE')
    )
    op.create_index('idx_ilot_lotissement', 'foncier_ilots', ['lotissement_id'])
    op.create_unique_constraint('uq_ilot_lotissement_numero', 'foncier_ilots', ['lotissement_id', 'numero'])

    # FONCIER_LOTS
    op.create_table(
        'foncier_lots',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('ilot_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('numero_lot', sa.String(50), nullable=False),
        sa.Column('reference', sa.String(100), nullable=False),
        sa.Column('superficie', sa.Numeric(10, 2), nullable=False),
        sa.Column('prix', sa.Numeric(12, 2), nullable=True),
        sa.Column('statut', sa.String(20), nullable=False, server_default='actif'),
        sa.Column('proprietaire_client_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('proprietaire_nom', sa.String(255), nullable=True),
        sa.Column('proprietaire_prenom', sa.String(255), nullable=True),
        sa.Column('proprietaire_naissance_date', sa.Date(), nullable=True),
        sa.Column('proprietaire_naissance_lieu', sa.String(255), nullable=True),
        sa.Column('proprietaire_cni_numero', sa.String(50), nullable=True),
        sa.Column('proprietaire_cni_date', sa.Date(), nullable=True),
        sa.Column('proprietaire_cni_lieu', sa.String(255), nullable=True),
        sa.Column('proprietaire_profession', sa.String(255), nullable=True),
        sa.Column('proprietaire_telephone', sa.String(50), nullable=True),
        sa.Column('proprietaire_email', sa.String(255), nullable=True),
        sa.Column('gps_lat', sa.Numeric(9, 6), nullable=True),
        sa.Column('gps_lng', sa.Numeric(9, 6), nullable=True),
        sa.Column('gps_precision', sa.Numeric(5, 2), nullable=True),
        sa.Column('gps_bornage', postgresql.JSON(), nullable=False, server_default='{}'),
        sa.Column('chef_village', sa.String(255), nullable=True),
        sa.Column('arrete_prefectoral', sa.Text(), nullable=True),
        sa.Column('arrete_date', sa.Date(), nullable=True),
        sa.Column('publier_sur_vitrine', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('date_cession', sa.Date(), nullable=True),
        sa.Column('prix_cession', sa.Numeric(12, 2), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('row_version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_by', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('deleted_reason', sa.Text(), nullable=True),
        sa.Column('client_updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_modified_device_id', sa.String(100), nullable=True),
        sa.Column('retention_until', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=False), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('reference'),
        sa.ForeignKeyConstraint(['ilot_id'], ['foncier_ilots.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['proprietaire_client_id'], ['parties.id'], ondelete='SET NULL')
    )
    op.create_index('idx_lot_ilot', 'foncier_lots', ['ilot_id'])
    op.create_index('idx_lot_reference', 'foncier_lots', ['reference'])
    op.create_index('idx_lot_statut', 'foncier_lots', ['statut'])
    op.create_index('idx_lot_proprietaire_client', 'foncier_lots', ['proprietaire_client_id'])
    op.create_index('idx_lot_deleted', 'foncier_lots', ['deleted_at'])
    op.create_index('idx_lot_vitrine', 'foncier_lots', ['publier_sur_vitrine'])
    op.create_check_constraint('ck_lot_statut', 'foncier_lots', "statut IN ('actif', 'vendu', 'litige', 'reserve', 'annule', 'archive')")

    # FONCIER_ATTESTATIONS
    op.create_table(
        'foncier_attestations',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('lot_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('numero_ordre', sa.Integer(), nullable=False),
        sa.Column('reference', sa.String(100), nullable=False),
        sa.Column('statut', sa.String(20), nullable=False, server_default='brouillon'),
        sa.Column('proprietaire_client_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('proprietaire_nom', sa.String(255), nullable=True),
        sa.Column('proprietaire_prenom', sa.String(255), nullable=True),
        sa.Column('proprietaire_naissance_date', sa.Date(), nullable=True),
        sa.Column('proprietaire_naissance_lieu', sa.String(255), nullable=True),
        sa.Column('proprietaire_cni_numero', sa.String(50), nullable=True),
        sa.Column('proprietaire_cni_date', sa.Date(), nullable=True),
        sa.Column('proprietaire_cni_lieu', sa.String(255), nullable=True),
        sa.Column('proprietaire_profession', sa.String(255), nullable=True),
        sa.Column('proprietaire_telephone', sa.String(50), nullable=True),
        sa.Column('proprietaire_email', sa.String(255), nullable=True),
        sa.Column('chef_village_nom', sa.String(255), nullable=True),
        sa.Column('chef_village_telephone', sa.String(50), nullable=True),
        sa.Column('chef_village_email', sa.String(255), nullable=True),
        sa.Column('numero_arrete', sa.String(), nullable=True),
        sa.Column('date_arrete', sa.Date(), nullable=True),
        sa.Column('contenu_textuel', sa.Text(), nullable=True),
        sa.Column('printed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('print_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_by', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('client_updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_modified_device_id', sa.String(100), nullable=True),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_by', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('deleted_reason', sa.Text(), nullable=True),
        sa.Column('retention_until', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=False), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('reference'),
        sa.ForeignKeyConstraint(['lot_id'], ['foncier_lots.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['proprietaire_client_id'], ['parties.id'], ondelete='SET NULL')
    )
    op.create_index('idx_attestation_lot', 'foncier_attestations', ['lot_id'])
    op.create_index('idx_attestation_reference', 'foncier_attestations', ['reference'])
    op.create_index('idx_attestation_statut', 'foncier_attestations', ['statut'])
    op.create_index('idx_attestation_proprietaire_client', 'foncier_attestations', ['proprietaire_client_id'])
    op.create_index('idx_attestation_deleted', 'foncier_attestations', ['deleted_at'])
    op.create_check_constraint('ck_attestation_statut', 'foncier_attestations', "statut IN ('brouillon', 'soumis', 'valide', 'archive', 'revoque', 'expire', 'annule')")

    # FONCIER_ATTESTATION_TEMOINS
    op.create_table(
        'foncier_attestation_temoins',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('attestation_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('temoin_nom', sa.String(255), nullable=False),
        sa.Column('temoin_prenom', sa.String(255), nullable=False),
        sa.Column('temoin_cni_numero', sa.String(50), nullable=False),
        sa.Column('temoin_cni_date', sa.Date(), nullable=True),
        sa.Column('temoin_cni_lieu', sa.String(255), nullable=True),
        sa.Column('temoin_profession', sa.String(255), nullable=True),
        sa.Column('temoin_telephone', sa.String(50), nullable=True),
        sa.Column('temoin_email', sa.String(255), nullable=True),
        sa.Column('signature_data', sa.Text(), nullable=True),
        sa.Column('signed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['attestation_id'], ['foncier_attestations.id'], ondelete='CASCADE')
    )
    op.create_index('idx_temoin_attestation', 'foncier_attestation_temoins', ['attestation_id'])

    # USER_VILLAGE_ACCESS
    op.create_table(
        'user_village_access',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('village_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('access_level', sa.String(20), nullable=False, server_default='lecteur'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['village_id'], ['foncier_villages.id'], ondelete='CASCADE')
    )
    op.create_index('idx_user_village_user', 'user_village_access', ['user_id'])
    op.create_index('idx_user_village_village', 'user_village_access', ['village_id'])
    op.create_unique_constraint('uq_user_village', 'user_village_access', ['user_id', 'village_id'])
    op.create_check_constraint('ck_access_level', 'user_village_access', "access_level IN ('lecteur', 'agent', 'validateur', 'gestionnaire')")


def downgrade() -> None:
    op.drop_constraint('uq_user_village', 'user_village_access', type_='unique')
    op.drop_constraint('ck_access_level', 'user_village_access', type_='check')
    op.drop_index('idx_user_village_village', table_name='user_village_access')
    op.drop_index('idx_user_village_user', table_name='user_village_access')
    op.drop_table('user_village_access')
    
    op.drop_index('idx_temoin_attestation', table_name='foncier_attestation_temoins')
    op.drop_table('foncier_attestation_temoins')
    
    op.drop_constraint('ck_attestation_statut', 'foncier_attestations', type_='check')
    op.drop_index('idx_attestation_deleted', table_name='foncier_attestations')
    op.drop_index('idx_attestation_proprietaire_client', table_name='foncier_attestations')
    op.drop_index('idx_attestation_statut', table_name='foncier_attestations')
    op.drop_index('idx_attestation_reference', table_name='foncier_attestations')
    op.drop_index('idx_attestation_lot', table_name='foncier_attestations')
    op.drop_table('foncier_attestations')
    
    op.drop_constraint('ck_lot_statut', 'foncier_lots', type_='check')
    op.drop_index('idx_lot_vitrine', table_name='foncier_lots')
    op.drop_index('idx_lot_deleted', table_name='foncier_lots')
    op.drop_index('idx_lot_proprietaire_client', table_name='foncier_lots')
    op.drop_index('idx_lot_statut', table_name='foncier_lots')
    op.drop_index('idx_lot_reference', table_name='foncier_lots')
    op.drop_index('idx_lot_ilot', table_name='foncier_lots')
    op.drop_table('foncier_lots')
    
    op.drop_constraint('uq_ilot_lotissement_numero', 'foncier_ilots', type_='unique')
    op.drop_index('idx_ilot_lotissement', table_name='foncier_ilots')
    op.drop_table('foncier_ilots')
    
    op.drop_constraint('uq_lotissement_village_nom', 'foncier_lotissements', type_='unique')
    op.drop_index('idx_lotissement_village', table_name='foncier_lotissements')
    op.drop_table('foncier_lotissements')
    
    op.drop_table('foncier_villages')
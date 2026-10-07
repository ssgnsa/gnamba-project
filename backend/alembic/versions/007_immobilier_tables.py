"""Create immobilier tables (properties, lease_contracts, rent_payments, immobilier_items).

Revision ID: 007_immobilier_tables
Revises: 006_foncier_tables
Create Date: 2025-07-30 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '007_immobilier_tables'
down_revision = '006_foncier_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # PROPERTIES
    op.create_table(
        'properties',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('reference', sa.String(50), nullable=False),
        sa.Column('titre', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('type_bien', sa.String(50), nullable=False),
        sa.Column('statut', sa.String(20), nullable=False, server_default='disponible'),
        sa.Column('adresse', sa.Text(), nullable=False),
        sa.Column('ville', sa.String(100), nullable=True),
        sa.Column('commune', sa.String(100), nullable=True),
        sa.Column('quartier', sa.String(100), nullable=True),
        sa.Column('surface', sa.Numeric(10, 2), nullable=True),
        sa.Column('surface_habitable', sa.Numeric(10, 2), nullable=True),
        sa.Column('nombre_pieces', sa.Integer(), nullable=True),
        sa.Column('nombre_chambres', sa.Integer(), nullable=True),
        sa.Column('nombre_salles_bain', sa.Integer(), nullable=True),
        sa.Column('etage', sa.Integer(), nullable=True),
        sa.Column('nombre_etages', sa.Integer(), nullable=True),
        sa.Column('annee_construction', sa.Integer(), nullable=True),
        sa.Column('meuble', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('parking', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('ascenseur', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('climatisation', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('securite', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('jardin', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('piscine', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('terrasse', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('balcon', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('cave', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('garage', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('charge_mensuelle', sa.Numeric(10, 2), nullable=True),
        sa.Column('taxe_fonciere', sa.Numeric(10, 2), nullable=True),
        sa.Column('dpe_lettre', sa.String(1), nullable=True),
        sa.Column('dpe_date', sa.Date(), nullable=True),
        sa.Column('ges_lettre', sa.String(1), nullable=True),
        sa.Column('ges_date', sa.Date(), nullable=True),
        sa.Column('prix_achat', sa.Numeric(12, 2), nullable=True),
        sa.Column('date_achat', sa.Date(), nullable=True),
        sa.Column('frais_notaire', sa.Numeric(10, 2), nullable=True),
        sa.Column('proprietaire_client_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('lot_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('commercialise', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('publier_vitrine', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('photos', postgresql.JSON(), nullable=False, server_default='[]'),
        sa.Column('documents', postgresql.JSON(), nullable=False, server_default='[]'),
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
        sa.ForeignKeyConstraint(['lot_id'], ['foncier_lots.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['proprietaire_client_id'], ['parties.id'], ondelete='SET NULL')
    )
    op.create_index('idx_property_reference', 'properties', ['reference'])
    op.create_index('idx_property_statut', 'properties', ['statut'])
    op.create_index('idx_property_type', 'properties', ['type_bien'])
    op.create_index('idx_property_proprietaire', 'properties', ['proprietaire_client_id'])
    op.create_index('idx_property_lot', 'properties', ['lot_id'])
    op.create_index('idx_property_vitrine', 'properties', ['publier_vitrine'])
    op.create_index('idx_property_ville', 'properties', ['ville'])
    op.create_check_constraint('ck_property_statut', 'properties', "statut IN ('disponible', 'louee', 'vendue', 'en_travaux', 'retiree', 'archivee')")
    op.create_check_constraint('ck_property_type', 'properties', "type_bien IN ('appartement', 'maison', 'villa', 'studio', 'duplex', 'triplex', 'loft', 'bureau', 'local_commercial', 'entrepot', 'terrain', 'garage', 'parking', 'autre')")

    # LEASE_CONTRACTS
    op.create_table(
        'lease_contracts',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('reference', sa.String(50), nullable=False),
        sa.Column('property_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('locataire_client_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('locataire_nom', sa.String(255), nullable=True),
        sa.Column('locataire_prenom', sa.String(255), nullable=True),
        sa.Column('locataire_cni_numero', sa.String(50), nullable=True),
        sa.Column('locataire_telephone', sa.String(50), nullable=True),
        sa.Column('locataire_email', sa.String(255), nullable=True),
        sa.Column('locataire_adresse', sa.Text(), nullable=True),
        sa.Column('caution_montant', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('caution_payee', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('loyer_mensuel', sa.Numeric(10, 2), nullable=False),
        sa.Column('charges_mensuelles', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('jour_paiement', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('mode_paiement', sa.String(50), nullable=True),
        sa.Column('date_debut', sa.Date(), nullable=False),
        sa.Column('date_fin', sa.Date(), nullable=False),
        sa.Column('date_signature', sa.Date(), nullable=True),
        sa.Column('renouvelable', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('preavis_mois', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('indexation_annuelle', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('indice_reference', sa.String(50), nullable=True),
        sa.Column('statut', sa.String(20), nullable=False, server_default='actif'),
        sa.Column('date_resiliation', sa.Date(), nullable=True),
        sa.Column('motif_resiliation', sa.Text(), nullable=True),
        sa.Column('etat_lieux_entree', postgresql.JSON(), nullable=False, server_default='{}'),
        sa.Column('etat_lieux_sortie', postgresql.JSON(), nullable=False, server_default='{}'),
        sa.Column('documents', postgresql.JSON(), nullable=False, server_default='[]'),
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
        sa.ForeignKeyConstraint(['property_id'], ['properties.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['locataire_client_id'], ['parties.id'], ondelete='SET NULL')
    )
    op.create_index('idx_contract_reference', 'lease_contracts', ['reference'])
    op.create_index('idx_contract_property', 'lease_contracts', ['property_id'])
    op.create_index('idx_contract_locataire', 'lease_contracts', ['locataire_client_id'])
    op.create_index('idx_contract_statut', 'lease_contracts', ['statut'])
    op.create_index('idx_contract_dates', 'lease_contracts', ['date_debut', 'date_fin'])
    op.create_check_constraint('ck_contract_statut', 'lease_contracts', "statut IN ('brouillon', 'actif', 'expire', 'resilie', 'archive')")

    # RENT_PAYMENTS
    op.create_table(
        'rent_payments',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('reference', sa.String(50), nullable=False),
        sa.Column('contract_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('period_debut', sa.Date(), nullable=False),
        sa.Column('period_fin', sa.Date(), nullable=False),
        sa.Column('loyer_du', sa.Numeric(10, 2), nullable=False),
        sa.Column('charges_dues', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('total_du', sa.Numeric(10, 2), nullable=False),
        sa.Column('montant_paye', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('montant_remise', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('statut', sa.String(20), nullable=False, server_default='impaye'),
        sa.Column('date_paiement', sa.DateTime(timezone=True), nullable=True),
        sa.Column('mode_paiement', sa.String(50), nullable=True),
        sa.Column('reference_paiement', sa.String(100), nullable=True),
        sa.Column('recu_media_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('reference'),
        sa.ForeignKeyConstraint(['contract_id'], ['lease_contracts.id'], ondelete='CASCADE')
    )
    op.create_index('idx_payment_contract', 'rent_payments', ['contract_id'])
    op.create_index('idx_payment_reference', 'rent_payments', ['reference'])
    op.create_index('idx_payment_statut', 'rent_payments', ['statut'])
    op.create_index('idx_payment_period', 'rent_payments', ['period_debut', 'period_fin'])
    op.create_check_constraint('ck_payment_statut', 'rent_payments', "statut IN ('impaye', 'partiel', 'paye', 'en_retard', 'annule', 'rembourse')")

    # IMMOBILIER_ITEMS
    op.create_table(
        'immobilier_items',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('reference', sa.String(50), nullable=False),
        sa.Column('titre', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('type_item', sa.String(50), nullable=False),
        sa.Column('statut', sa.String(20), nullable=False, server_default='disponible'),
        sa.Column('prix', sa.Numeric(12, 2), nullable=True),
        sa.Column('surface', sa.Numeric(10, 2), nullable=True),
        sa.Column('adresse', sa.Text(), nullable=True),
        sa.Column('ville', sa.String(100), nullable=True),
        sa.Column('photos', postgresql.JSON(), nullable=False, server_default='[]'),
        sa.Column('documents', postgresql.JSON(), nullable=False, server_default='[]'),
        sa.Column('lot_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('property_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('publier_vitrine', sa.Boolean(), nullable=False, server_default='false'),
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
        sa.ForeignKeyConstraint(['lot_id'], ['foncier_lots.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['property_id'], ['properties.id'], ondelete='SET NULL')
    )
    op.create_index('idx_immobilier_item_reference', 'immobilier_items', ['reference'])
    op.create_index('idx_immobilier_item_type', 'immobilier_items', ['type_item'])
    op.create_index('idx_immobilier_item_statut', 'immobilier_items', ['statut'])
    op.create_index('idx_immobilier_item_vitrine', 'immobilier_items', ['publier_vitrine'])
    op.create_index('idx_immobilier_item_lot', 'immobilier_items', ['lot_id'])
    op.create_index('idx_immobilier_item_property', 'immobilier_items', ['property_id'])


def downgrade() -> None:
    op.drop_index('idx_immobilier_item_property', table_name='immobilier_items')
    op.drop_index('idx_immobilier_item_lot', table_name='immobilier_items')
    op.drop_index('idx_immobilier_item_vitrine', table_name='immobilier_items')
    op.drop_index('idx_immobilier_item_statut', table_name='immobilier_items')
    op.drop_index('idx_immobilier_item_type', table_name='immobilier_items')
    op.drop_index('idx_immobilier_item_reference', table_name='immobilier_items')
    op.drop_table('immobilier_items')
    
    op.drop_constraint('ck_payment_statut', 'rent_payments', type_='check')
    op.drop_index('idx_payment_period', table_name='rent_payments')
    op.drop_index('idx_payment_statut', table_name='rent_payments')
    op.drop_index('idx_payment_reference', table_name='rent_payments')
    op.drop_index('idx_payment_contract', table_name='rent_payments')
    op.drop_table('rent_payments')
    
    op.drop_constraint('ck_contract_statut', 'lease_contracts', type_='check')
    op.drop_index('idx_contract_dates', table_name='lease_contracts')
    op.drop_index('idx_contract_statut', table_name='lease_contracts')
    op.drop_index('idx_contract_locataire', table_name='lease_contracts')
    op.drop_index('idx_contract_property', table_name='lease_contracts')
    op.drop_index('idx_contract_reference', table_name='lease_contracts')
    op.drop_table('lease_contracts')
    
    op.drop_constraint('ck_property_type', 'properties', type_='check')
    op.drop_constraint('ck_property_statut', 'properties', type_='check')
    op.drop_index('idx_property_ville', table_name='properties')
    op.drop_index('idx_property_vitrine', table_name='properties')
    op.drop_index('idx_property_lot', table_name='properties')
    op.drop_index('idx_property_proprietaire', table_name='properties')
    op.drop_index('idx_property_type', table_name='properties')
    op.drop_index('idx_property_statut', table_name='properties')
    op.drop_index('idx_property_reference', table_name='properties')
    op.drop_table('properties')
"""Create finances tables (finances, products, suppliers).

Revision ID: 010_finances_tables
Revises: 009_hr_employees_tables
Create Date: 2025-07-30 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '010_finances_tables'
down_revision = '009_hr_employees_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # FINANCES
    op.create_table(
        'finances',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('reference', sa.String(50), nullable=False),
        sa.Column('type', sa.String(20), nullable=False),
        sa.Column('categorie', sa.String(100), nullable=True),
        sa.Column('sous_categorie', sa.String(100), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('montant', sa.Numeric(12, 2), nullable=False),
        sa.Column('devise', sa.String(3), nullable=False, server_default='XOF'),
        sa.Column('taux_change', sa.Numeric(10, 4), nullable=False, server_default='1'),
        sa.Column('montant_xof', sa.Numeric(12, 2), nullable=False),
        sa.Column('date_operation', sa.Date(), nullable=False),
        sa.Column('date_valeur', sa.Date(), nullable=True),
        sa.Column('statut', sa.String(20), nullable=False, server_default='valide'),
        sa.Column('mode_paiement', sa.String(50), nullable=True),
        sa.Column('reference_externe', sa.String(100), nullable=True),
        sa.Column('tiers_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('tiers_type', sa.String(50), nullable=True),
        sa.Column('tiers_nom', sa.String(255), nullable=True),
        sa.Column('projet_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('lot_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('property_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('contract_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('employee_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('facture_media_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('recu_media_id', postgresql.UUID(as_uuid=False), nullable=True),
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
        sa.ForeignKeyConstraint(['contract_id'], ['lease_contracts.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['lot_id'], ['foncier_lots.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['projet_id'], ['projects.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['property_id'], ['properties.id'], ondelete='SET NULL')
    )
    op.create_index('idx_finance_reference', 'finances', ['reference'])
    op.create_index('idx_finance_type', 'finances', ['type'])
    op.create_index('idx_finance_categorie', 'finances', ['categorie'])
    op.create_index('idx_finance_statut', 'finances', ['statut'])
    op.create_index('idx_finance_date', 'finances', ['date_operation'])
    op.create_index('idx_finance_tiers', 'finances', ['tiers_id', 'tiers_type'])
    op.create_index('idx_finance_projet', 'finances', ['projet_id'])
    op.create_index('idx_finance_lot', 'finances', ['lot_id'])
    op.create_index('idx_finance_property', 'finances', ['property_id'])
    op.create_index('idx_finance_contract', 'finances', ['contract_id'])
    op.create_index('idx_finance_employee', 'finances', ['employee_id'])
    op.create_check_constraint('ck_finance_type', 'finances', "type IN ('recette', 'depense', 'virement', 'ajustement')")
    op.create_check_constraint('ck_finance_statut', 'finances', "statut IN ('brouillon', 'valide', 'annule', 'rembourse', 'conteste')")

    # PRODUCTS
    op.create_table(
        'products',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('reference', sa.String(50), nullable=False),
        sa.Column('nom', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('categorie', sa.String(100), nullable=True),
        sa.Column('unite', sa.String(50), nullable=False, server_default='unite'),
        sa.Column('prix_unitaire', sa.Numeric(12, 2), nullable=True),
        sa.Column('prix_revient', sa.Numeric(12, 2), nullable=True),
        sa.Column('tva_taux', sa.Numeric(5, 2), nullable=False, server_default='18.00'),
        sa.Column('stock_actuel', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('stock_min', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('stock_max', sa.Numeric(10, 2), nullable=True),
        sa.Column('code_barres', sa.String(100), nullable=True),
        sa.Column('sku', sa.String(100), nullable=True),
        sa.Column('fournisseur_principal_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('actif', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('publier_catalogue', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('photos', postgresql.JSON(), nullable=False, server_default='[]'),
        sa.Column('documents', postgresql.JSON(), nullable=False, server_default='[]'),
        sa.Column('metadata_json', postgresql.JSON(), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('reference'),
        sa.UniqueConstraint('sku'),
        sa.ForeignKeyConstraint(['fournisseur_principal_id'], ['suppliers.id'], ondelete='SET NULL')
    )
    op.create_index('idx_product_reference', 'products', ['reference'])
    op.create_index('idx_product_sku', 'products', ['sku'])
    op.create_index('idx_product_categorie', 'products', ['categorie'])
    op.create_index('idx_product_actif', 'products', ['actif'])
    op.create_index('idx_product_fournisseur', 'products', ['fournisseur_principal_id'])
    op.create_index('idx_product_catalogue', 'products', ['publier_catalogue'])

    # SUPPLIERS
    op.create_table(
        'suppliers',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('reference', sa.String(50), nullable=False),
        sa.Column('nom', sa.String(255), nullable=False),
        sa.Column('nom_commercial', sa.String(255), nullable=True),
        sa.Column('type_fournisseur', sa.String(50), nullable=True),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('telephone', sa.String(50), nullable=True),
        sa.Column('adresse', sa.Text(), nullable=True),
        sa.Column('ville', sa.String(100), nullable=True),
        sa.Column('pays', sa.String(100), nullable=True),
        sa.Column('contact_nom', sa.String(255), nullable=True),
        sa.Column('contact_telephone', sa.String(50), nullable=True),
        sa.Column('contact_email', sa.String(255), nullable=True),
        sa.Column('numero_contribuable', sa.String(50), nullable=True),
        sa.Column('numero_rc', sa.String(50), nullable=True),
        sa.Column('iban', sa.String(100), nullable=True),
        sa.Column('banque', sa.String(100), nullable=True),
        sa.Column('delai_livraison_jours', sa.Integer(), nullable=True),
        sa.Column('conditions_paiement', sa.String(100), nullable=True),
        sa.Column('note_qualite', sa.Integer(), nullable=True),
        sa.Column('actif', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('certifications', postgresql.ARRAY(sa.String()), nullable=False, server_default='{}'),
        sa.Column('documents', postgresql.JSON(), nullable=False, server_default='[]'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('reference')
    )
    op.create_index('idx_supplier_reference', 'suppliers', ['reference'])
    op.create_index('idx_supplier_nom', 'suppliers', ['nom'])
    op.create_index('idx_supplier_type', 'suppliers', ['type_fournisseur'])
    op.create_index('idx_supplier_actif', 'suppliers', ['actif'])
    op.create_index('idx_supplier_ville', 'suppliers', ['ville'])


def downgrade() -> None:
    op.drop_index('idx_supplier_ville', table_name='suppliers')
    op.drop_index('idx_supplier_actif', table_name='suppliers')
    op.drop_index('idx_supplier_type', table_name='suppliers')
    op.drop_index('idx_supplier_nom', table_name='suppliers')
    op.drop_index('idx_supplier_reference', table_name='suppliers')
    op.drop_table('suppliers')
    
    op.drop_index('idx_product_catalogue', table_name='products')
    op.drop_index('idx_product_fournisseur', table_name='products')
    op.drop_index('idx_product_actif', table_name='products')
    op.drop_index('idx_product_categorie', table_name='products')
    op.drop_index('idx_product_sku', table_name='products')
    op.drop_index('idx_product_reference', table_name='products')
    op.drop_table('products')
    
    op.drop_constraint('ck_finance_statut', 'finances', type_='check')
    op.drop_constraint('ck_finance_type', 'finances', type_='check')
    op.drop_index('idx_finance_employee', table_name='finances')
    op.drop_index('idx_finance_contract', table_name='finances')
    op.drop_index('idx_finance_property', table_name='finances')
    op.drop_index('idx_finance_lot', table_name='finances')
    op.drop_index('idx_finance_projet', table_name='finances')
    op.drop_index('idx_finance_tiers', table_name='finances')
    op.drop_index('idx_finance_date', table_name='finances')
    op.drop_index('idx_finance_statut', table_name='finances')
    op.drop_index('idx_finance_categorie', table_name='finances')
    op.drop_index('idx_finance_type', table_name='finances')
    op.drop_index('idx_finance_reference', table_name='finances')
    op.drop_table('finances')
"""Create public website tables (page_layouts, site_content, site_realisations, vitrine_lots, contact_messages).

Revision ID: 012_public_site_tables
Revises: 011_documents_media_tables
Create Date: 2025-07-30 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '012_public_site_tables'
down_revision = '011_documents_media_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # PAGE_LAYOUTS
    op.create_table(
        'page_layouts',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('page_key', sa.String(100), nullable=False),
        sa.Column('page_name', sa.String(255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('layout_json', postgresql.JSON(), nullable=False, server_default='[]'),
        sa.Column('seo_title', sa.String(255), nullable=True),
        sa.Column('seo_description', sa.Text(), nullable=True),
        sa.Column('seo_keywords', postgresql.ARRAY(sa.String()), nullable=False, server_default='{}'),
        sa.Column('og_image_media_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=False), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('page_key'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['updated_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['og_image_media_id'], ['media_files.id'], ondelete='SET NULL')
    )
    op.create_index('idx_page_layout_active', 'page_layouts', ['is_active'])

    # SITE_CONTENT
    op.create_table(
        'site_content',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('section', sa.String(100), nullable=False),
        sa.Column('key', sa.String(100), nullable=False),
        sa.Column('value', sa.Text(), nullable=True),
        sa.Column('value_type', sa.String(20), nullable=False, server_default='text'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_translatable', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('translations', postgresql.JSON(), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('section', 'key', name='uq_site_content_section_key')
    )
    op.create_index('idx_site_content_section', 'site_content', ['section'])

    # SITE_REALISATIONS
    op.create_table(
        'site_realisations',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('reference', sa.String(50), nullable=False),
        sa.Column('titre', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('description_courte', sa.Text(), nullable=True),
        sa.Column('type_realisation', sa.String(50), nullable=False),
        sa.Column('statut', sa.String(20), nullable=False, server_default='en_cours'),
        sa.Column('localisation', sa.Text(), nullable=True),
        sa.Column('ville', sa.String(100), nullable=True),
        sa.Column('surface', sa.Numeric(10, 2), nullable=True),
        sa.Column('budget_previsionnel', sa.Numeric(12, 2), nullable=True),
        sa.Column('budget_reel', sa.Numeric(12, 2), nullable=True),
        sa.Column('date_debut', sa.Date(), nullable=True),
        sa.Column('date_fin_prevue', sa.Date(), nullable=True),
        sa.Column('date_fin_reelle', sa.Date(), nullable=True),
        sa.Column('chef_projet_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('equipe', postgresql.JSON(), nullable=False, server_default='[]'),
        sa.Column('photos', postgresql.JSON(), nullable=False, server_default='[]'),
        sa.Column('documents', postgresql.JSON(), nullable=False, server_default='[]'),
        sa.Column('publier_vitrine', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('ordre_affichage', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('tags', postgresql.ARRAY(sa.String()), nullable=False, server_default='{}'),
        sa.Column('metadata_json', postgresql.JSON(), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('reference'),
        sa.ForeignKeyConstraint(['chef_projet_id'], ['users.id'], ondelete='SET NULL')
    )
    op.create_index('idx_realisation_reference', 'site_realisations', ['reference'])
    op.create_index('idx_realisation_type', 'site_realisations', ['type_realisation'])
    op.create_index('idx_realisation_statut', 'site_realisations', ['statut'])
    op.create_index('idx_realisation_ville', 'site_realisations', ['ville'])
    op.create_index('idx_realisation_vitrine', 'site_realisations', ['publier_vitrine'])
    op.create_index('idx_realisation_chef', 'site_realisations', ['chef_projet_id'])
    op.create_check_constraint('ck_realisation_statut', 'site_realisations', "statut IN ('planifie', 'en_cours', 'termine', 'suspendu', 'annule', 'archive')")
    op.create_check_constraint('ck_realisation_type', 'site_realisations', "type_realisation IN ('construction', 'renovation', 'extension', 'terrassement', 'voirie', 'assainissement', 'electrique', 'plomberie', 'peinture', 'autre')")

    # VITRINE_LOTS
    op.create_table(
        'vitrine_lots',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('lot_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('property_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('titre', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('prix', sa.Numeric(12, 2), nullable=True),
        sa.Column('surface', sa.Numeric(10, 2), nullable=True),
        sa.Column('localisation', sa.Text(), nullable=True),
        sa.Column('photos', postgresql.JSON(), nullable=False, server_default='[]'),
        sa.Column('publier', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('ordre', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('tags', postgresql.ARRAY(sa.String()), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['lot_id'], ['foncier_lots.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['property_id'], ['properties.id'], ondelete='CASCADE')
    )
    op.create_index('idx_vitrine_lot', 'vitrine_lots', ['lot_id'])
    op.create_index('idx_vitrine_property', 'vitrine_lots', ['property_id'])
    op.create_index('idx_vitrine_publier', 'vitrine_lots', ['publier'])

    # CONTACT_MESSAGES
    op.create_table(
        'contact_messages',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('nom', sa.String(255), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('telephone', sa.String(50), nullable=True),
        sa.Column('sujet', sa.String(255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('type_demande', sa.String(50), nullable=True),
        sa.Column('statut', sa.String(20), nullable=False, server_default='nouveau'),
        sa.Column('assigne_a', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('reponse', sa.Text(), nullable=True),
        sa.Column('date_reponse', sa.DateTime(timezone=True), nullable=True),
        sa.Column('ip_address', postgresql.INET(), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('metadata_json', postgresql.JSON(), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['assigne_a'], ['users.id'], ondelete='SET NULL')
    )
    op.create_index('idx_contact_statut', 'contact_messages', ['statut'])
    op.create_index('idx_contact_type', 'contact_messages', ['type_demande'])
    op.create_index('idx_contact_assigne', 'contact_messages', ['assigne_a'])
    op.create_index('idx_contact_created', 'contact_messages', ['created_at'])
    op.create_check_constraint('ck_contact_statut', 'contact_messages', "statut IN ('nouveau', 'en_cours', 'traite', 'ferme', 'spam')")


def downgrade() -> None:
    op.drop_constraint('ck_contact_statut', 'contact_messages', type_='check')
    op.drop_index('idx_contact_created', table_name='contact_messages')
    op.drop_index('idx_contact_assigne', table_name='contact_messages')
    op.drop_index('idx_contact_type', table_name='contact_messages')
    op.drop_index('idx_contact_statut', table_name='contact_messages')
    op.drop_table('contact_messages')
    
    op.drop_index('idx_vitrine_publier', table_name='vitrine_lots')
    op.drop_index('idx_vitrine_property', table_name='vitrine_lots')
    op.drop_index('idx_vitrine_lot', table_name='vitrine_lots')
    op.drop_table('vitrine_lots')
    
    op.drop_constraint('ck_realisation_type', 'site_realisations', type_='check')
    op.drop_constraint('ck_realisation_statut', 'site_realisations', type_='check')
    op.drop_index('idx_realisation_chef', table_name='site_realisations')
    op.drop_index('idx_realisation_vitrine', table_name='site_realisations')
    op.drop_index('idx_realisation_ville', table_name='site_realisations')
    op.drop_index('idx_realisation_statut', table_name='site_realisations')
    op.drop_index('idx_realisation_type', table_name='site_realisations')
    op.drop_index('idx_realisation_reference', table_name='site_realisations')
    op.drop_table('site_realisations')
    
    op.drop_index('idx_site_content_section', table_name='site_content')
    op.drop_table('site_content')
    
    op.drop_index('idx_page_layout_active', table_name='page_layouts')
    op.drop_table('page_layouts')
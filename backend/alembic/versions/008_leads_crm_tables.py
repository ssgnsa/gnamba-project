"""Create leads/CRM tables (leads, lead_campaigns, lead_captures, lead_interactions, party_lead_details, party_roles).

Revision ID: 008_leads_crm_tables
Revises: 007_immobilier_tables
Create Date: 2025-07-30 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '008_leads_crm_tables'
down_revision = '007_immobilier_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # LEADS
    op.create_table(
        'leads',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('reference', sa.String(50), nullable=False),
        sa.Column('source', sa.String(50), nullable=False),
        sa.Column('campaign_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('nom', sa.String(255), nullable=True),
        sa.Column('prenom', sa.String(255), nullable=True),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('telephone', sa.String(50), nullable=True),
        sa.Column('adresse', sa.Text(), nullable=True),
        sa.Column('ville', sa.String(100), nullable=True),
        sa.Column('budget_min', sa.Numeric(12, 2), nullable=True),
        sa.Column('budget_max', sa.Numeric(12, 2), nullable=True),
        sa.Column('type_bien_recherche', sa.String(50), nullable=True),
        sa.Column('surface_min', sa.Numeric(10, 2), nullable=True),
        sa.Column('surface_max', sa.Numeric(10, 2), nullable=True),
        sa.Column('statut', sa.String(20), nullable=False, server_default='nouveau'),
        sa.Column('score', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('qualifie', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('date_qualification', sa.DateTime(timezone=True), nullable=True),
        sa.Column('assigne_a', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('metadata_json', postgresql.JSON(), nullable=False, server_default='{}'),
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
        sa.ForeignKeyConstraint(['assigne_a'], ['users.id'], ondelete='SET NULL')
    )
    op.create_index('idx_lead_reference', 'leads', ['reference'])
    op.create_index('idx_lead_statut', 'leads', ['statut'])
    op.create_index('idx_lead_source', 'leads', ['source'])
    op.create_index('idx_lead_assigne', 'leads', ['assigne_a'])
    op.create_index('idx_lead_campaign', 'leads', ['campaign_id'])
    op.create_index('idx_lead_qualifie', 'leads', ['qualifie'])
    op.create_check_constraint('ck_lead_statut', 'leads', "statut IN ('nouveau', 'contacte', 'qualifie', 'proposition', 'negociation', 'converti', 'perdu', 'archive')")
    op.create_check_constraint('ck_lead_source', 'leads', "source IN ('site_web', 'facebook', 'instagram', 'linkedin', 'google', 'referral', 'salon', 'publicite', 'email', 'telephone', 'visite_physique', 'autre')")

    # LEAD_CAMPAIGNS
    op.create_table(
        'lead_campaigns',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('nom', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('type_campagne', sa.String(50), nullable=False),
        sa.Column('statut', sa.String(20), nullable=False, server_default='brouillon'),
        sa.Column('date_debut', sa.Date(), nullable=True),
        sa.Column('date_fin', sa.Date(), nullable=True),
        sa.Column('budget', sa.Numeric(12, 2), nullable=True),
        sa.Column('cout_reel', sa.Numeric(12, 2), nullable=True),
        sa.Column('cible', sa.Text(), nullable=True),
        sa.Column('canaux', postgresql.ARRAY(sa.String()), nullable=False, server_default='{}'),
        sa.Column('kpi_cibles', postgresql.JSON(), nullable=False, server_default='{}'),
        sa.Column('kpi_reels', postgresql.JSON(), nullable=False, server_default='{}'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_campaign_statut', 'lead_campaigns', ['statut'])
    op.create_index('idx_campaign_type', 'lead_campaigns', ['type_campagne'])
    op.create_check_constraint('ck_campaign_statut', 'lead_campaigns', "statut IN ('brouillon', 'active', 'pausee', 'terminee', 'annulee')")
    op.create_check_constraint('ck_campaign_type', 'lead_campaigns', "type_campagne IN ('digital', 'print', 'evenement', 'referral', 'email', 'sms', 'mixte')")

    # LEAD_CAPTURES
    op.create_table(
        'lead_captures',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('campaign_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('form_name', sa.String(100), nullable=True),
        sa.Column('page_url', sa.String(500), nullable=True),
        sa.Column('utm_source', sa.String(100), nullable=True),
        sa.Column('utm_medium', sa.String(100), nullable=True),
        sa.Column('utm_campaign', sa.String(100), nullable=True),
        sa.Column('utm_content', sa.String(100), nullable=True),
        sa.Column('utm_term', sa.String(100), nullable=True),
        sa.Column('referrer', sa.String(500), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('ip_address', postgresql.INET(), nullable=True),
        sa.Column('country', sa.String(100), nullable=True),
        sa.Column('city', sa.String(100), nullable=True),
        sa.Column('data_json', postgresql.JSON(), nullable=False, server_default='{}'),
        sa.Column('lead_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['campaign_id'], ['lead_campaigns.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['lead_id'], ['leads.id'], ondelete='SET NULL')
    )
    op.create_index('idx_capture_campaign', 'lead_captures', ['campaign_id'])
    op.create_index('idx_capture_lead', 'lead_captures', ['lead_id'])
    op.create_index('idx_capture_created', 'lead_captures', ['created_at'])

    # LEAD_INTERACTIONS
    op.create_table(
        'lead_interactions',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('lead_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('direction', sa.String(20), nullable=False),
        sa.Column('sujet', sa.String(255), nullable=True),
        sa.Column('contenu', sa.Text(), nullable=True),
        sa.Column('resultat', sa.String(50), nullable=True),
        sa.Column('prochaine_action', sa.Text(), nullable=True),
        sa.Column('prochaine_action_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('metadata_json', postgresql.JSON(), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['lead_id'], ['leads.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL')
    )
    op.create_index('idx_interaction_lead', 'lead_interactions', ['lead_id'])
    op.create_index('idx_interaction_user', 'lead_interactions', ['user_id'])
    op.create_index('idx_interaction_type', 'lead_interactions', ['type'])
    op.create_index('idx_interaction_created', 'lead_interactions', ['created_at'])
    op.create_check_constraint('ck_interaction_type', 'lead_interactions', "type IN ('appel', 'email', 'sms', 'whatsapp', 'visite', 'reunion', 'note', 'tache', 'document', 'autre')")
    op.create_check_constraint('ck_interaction_direction', 'lead_interactions', "direction IN ('entrant', 'sortant')")

    # PARTY_LEAD_DETAILS
    op.create_table(
        'party_lead_details',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('party_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('lead_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('role', sa.String(50), nullable=False, server_default='contact'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['party_id'], ['parties.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['lead_id'], ['leads.id'], ondelete='CASCADE')
    )
    op.create_index('idx_party_lead_party', 'party_lead_details', ['party_id'])
    op.create_index('idx_party_lead_lead', 'party_lead_details', ['lead_id'])
    op.create_unique_constraint('uq_party_lead', 'party_lead_details', ['party_id', 'lead_id'])

    # PARTY_ROLES
    op.create_table(
        'party_roles',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('party_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('role_type', sa.String(50), nullable=False),
        sa.Column('context_type', sa.String(50), nullable=True),
        sa.Column('context_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('date_debut', sa.Date(), nullable=True),
        sa.Column('date_fin', sa.Date(), nullable=True),
        sa.Column('actif', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['party_id'], ['parties.id'], ondelete='CASCADE')
    )
    op.create_index('idx_party_role_party', 'party_roles', ['party_id'])
    op.create_index('idx_party_role_type', 'party_roles', ['role_type'])
    op.create_index('idx_party_role_context', 'party_roles', ['context_type', 'context_id'])
    op.create_check_constraint('ck_party_role_type', 'party_roles', "role_type IN ('client', 'proprietaire', 'locataire', 'prospect', 'fournisseur', 'partenaire', 'employe', 'agent', 'chef_village', 'notaire', 'geometre', 'avocat', 'expert', 'autre')")


def downgrade() -> None:
    op.drop_constraint('ck_party_role_type', 'party_roles', type_='check')
    op.drop_index('idx_party_role_context', table_name='party_roles')
    op.drop_index('idx_party_role_type', table_name='party_roles')
    op.drop_index('idx_party_role_party', table_name='party_roles')
    op.drop_table('party_roles')
    
    op.drop_constraint('uq_party_lead', 'party_lead_details', type_='unique')
    op.drop_index('idx_party_lead_lead', table_name='party_lead_details')
    op.drop_index('idx_party_lead_party', table_name='party_lead_details')
    op.drop_table('party_lead_details')
    
    op.drop_constraint('ck_interaction_direction', 'lead_interactions', type_='check')
    op.drop_constraint('ck_interaction_type', 'lead_interactions', type_='check')
    op.drop_index('idx_interaction_created', table_name='lead_interactions')
    op.drop_index('idx_interaction_type', table_name='lead_interactions')
    op.drop_index('idx_interaction_user', table_name='lead_interactions')
    op.drop_index('idx_interaction_lead', table_name='lead_interactions')
    op.drop_table('lead_interactions')
    
    op.drop_index('idx_capture_created', table_name='lead_captures')
    op.drop_index('idx_capture_lead', table_name='lead_captures')
    op.drop_index('idx_capture_campaign', table_name='lead_captures')
    op.drop_table('lead_captures')
    
    op.drop_constraint('ck_campaign_type', 'lead_campaigns', type_='check')
    op.drop_constraint('ck_campaign_statut', 'lead_campaigns', type_='check')
    op.drop_index('idx_campaign_type', table_name='lead_campaigns')
    op.drop_index('idx_campaign_statut', table_name='lead_campaigns')
    op.drop_table('lead_campaigns')
    
    op.drop_constraint('ck_lead_source', 'leads', type_='check')
    op.drop_constraint('ck_lead_statut', 'leads', type_='check')
    op.drop_index('idx_lead_qualifie', table_name='leads')
    op.drop_index('idx_lead_campaign', table_name='leads')
    op.drop_index('idx_lead_assigne', table_name='leads')
    op.drop_index('idx_lead_source', table_name='leads')
    op.drop_index('idx_lead_statut', table_name='leads')
    op.drop_index('idx_lead_reference', table_name='leads')
    op.drop_table('leads')
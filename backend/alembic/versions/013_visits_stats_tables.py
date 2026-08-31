"""Create visits/stats tables (visiteurs, visites_du_jour, visites_en_cours, activites_journal, stats_journalieres).

Revision ID: 013_visits_stats_tables
Revises: 012_public_site_tables
Create Date: 2025-07-30 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '013_visits_stats_tables'
down_revision = '012_public_site_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # VISITEURS
    op.create_table(
        'visiteurs',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('nom', sa.String(255), nullable=False),
        sa.Column('prenom', sa.String(255), nullable=False),
        sa.Column('telephone', sa.String(50), nullable=True),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('type_visiteur', sa.String(50), nullable=False, server_default='particulier'),
        sa.Column('entreprise', sa.String(255), nullable=True),
        sa.Column('fonction', sa.String(100), nullable=True),
        sa.Column('cni_numero', sa.String(50), nullable=True),
        sa.Column('vehicule_immatriculation', sa.String(20), nullable=True),
        sa.Column('adresse', sa.Text(), nullable=True),
        sa.Column('photo_media_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('actif', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_visiteur_nom', 'visiteurs', ['nom', 'prenom'])
    op.create_index('idx_visiteur_telephone', 'visiteurs', ['telephone'])
    op.create_index('idx_visiteur_email', 'visiteurs', ['email'])
    op.create_index('idx_visiteur_type', 'visiteurs', ['type_visiteur'])
    op.create_index('idx_visiteur_cni', 'visiteurs', ['cni_numero'])
    op.create_index('idx_visiteur_actif', 'visiteurs', ['actif'])

    # VISITES_DU_JOUR
    op.create_table(
        'visites_du_jour',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('visiteur_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('agent_accueil_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('objet_visite', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('statut', sa.String(20), nullable=False, server_default='planifiee'),
        sa.Column('heure_arrivee_prevue', sa.Time(), nullable=True),
        sa.Column('heure_arrivee_reelle', sa.Time(), nullable=True),
        sa.Column('heure_depart_prevue', sa.Time(), nullable=True),
        sa.Column('heure_depart_reelle', sa.Time(), nullable=True),
        sa.Column('duree_minutes', sa.Integer(), nullable=True),
        sa.Column('lieu_rdv', sa.String(255), nullable=True),
        sa.Column('personne_rencontree', sa.String(255), nullable=True),
        sa.Column('resultat', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['agent_accueil_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['visiteur_id'], ['visiteurs.id'], ondelete='CASCADE')
    )
    op.create_index('idx_visite_date', 'visites_du_jour', ['date'])
    op.create_index('idx_visite_visiteur', 'visites_du_jour', ['visiteur_id'])
    op.create_index('idx_visite_agent', 'visites_du_jour', ['agent_accueil_id'])
    op.create_index('idx_visite_statut', 'visites_du_jour', ['statut'])
    op.create_check_constraint('ck_visite_statut', 'visites_du_jour', "statut IN ('planifiee', 'en_cours', 'terminee', 'annulee', 'reportee')")

    # VISITES_EN_COURS
    op.create_table(
        'visites_en_cours',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('visite_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('visiteur_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('agent_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('objet', sa.String(255), nullable=False),
        sa.Column('heure_debut', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('lieu', sa.String(255), nullable=True),
        sa.Column('statut', sa.String(20), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['visiteur_id'], ['visiteurs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['agent_id'], ['users.id'], ondelete='SET NULL')
    )
    op.create_index('idx_visite_cours_visiteur', 'visites_en_cours', ['visiteur_id'])
    op.create_index('idx_visite_cours_agent', 'visites_en_cours', ['agent_id'])
    op.create_index('idx_visite_cours_statut', 'visites_en_cours', ['statut'])

    # ACTIVITES_JOURNAL
    op.create_table(
        'activites_journal',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('agent_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('type_activite', sa.String(50), nullable=False),
        sa.Column('titre', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('statut', sa.String(20), nullable=False, server_default='planifiee'),
        sa.Column('heure_debut_prevue', sa.Time(), nullable=True),
        sa.Column('heure_fin_prevue', sa.Time(), nullable=True),
        sa.Column('heure_debut_reelle', sa.DateTime(timezone=True), nullable=True),
        sa.Column('heure_fin_reelle', sa.DateTime(timezone=True), nullable=True),
        sa.Column('duree_minutes', sa.Integer(), nullable=True),
        sa.Column('priorite', sa.String(20), nullable=False, server_default='normale'),
        sa.Column('lieu', sa.String(255), nullable=True),
        sa.Column('participants', postgresql.ARRAY(postgresql.UUID(as_uuid=False)), nullable=False, server_default='{}'),
        sa.Column('resultat', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['agent_id'], ['users.id'], ondelete='SET NULL')
    )
    op.create_index('idx_activite_date', 'activites_journal', ['date'])
    op.create_index('idx_activite_agent', 'activites_journal', ['agent_id'])
    op.create_index('idx_activite_type', 'activites_journal', ['type_activite'])
    op.create_index('idx_activite_statut', 'activites_journal', ['statut'])
    op.create_check_constraint('ck_activite_statut', 'activites_journal', "statut IN ('planifiee', 'en_cours', 'terminee', 'annulee', 'reportee')")
    op.create_check_constraint('ck_activite_priorite', 'activites_journal', "priorite IN ('basse', 'normale', 'haute', 'urgente')")

    # STATS_JOURNALIERES
    op.create_table(
        'stats_journalieres',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('total_visites', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('visites_terminees', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('visites_annulees', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('visites_en_cours', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('nouveaux_visiteurs', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_activites', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('activites_terminees', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('agent_actif_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('duree_moyenne_visite', sa.Numeric(6, 2), nullable=True),
        sa.Column('duree_moyenne_activite', sa.Numeric(6, 2), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('date')
    )
    op.create_index('idx_stats_date', 'stats_journalieres', ['date'])


def downgrade() -> None:
    op.drop_index('idx_stats_date', table_name='stats_journalieres')
    op.drop_table('stats_journalieres')
    
    op.drop_constraint('ck_activite_priorite', 'activites_journal', type_='check')
    op.drop_constraint('ck_activite_statut', 'activites_journal', type_='check')
    op.drop_index('idx_activite_statut', table_name='activites_journal')
    op.drop_index('idx_activite_type', table_name='activites_journal')
    op.drop_index('idx_activite_agent', table_name='activites_journal')
    op.drop_index('idx_activite_date', table_name='activites_journal')
    op.drop_table('activites_journal')
    
    op.drop_index('idx_visite_cours_statut', table_name='visites_en_cours')
    op.drop_index('idx_visite_cours_agent', table_name='visites_en_cours')
    op.drop_index('idx_visite_cours_visiteur', table_name='visites_en_cours')
    op.drop_table('visites_en_cours')
    
    op.drop_constraint('ck_visite_statut', 'visites_du_jour', type_='check')
    op.drop_index('idx_visite_statut', table_name='visites_du_jour')
    op.drop_index('idx_visite_agent', table_name='visites_du_jour')
    op.drop_index('idx_visite_visiteur', table_name='visites_du_jour')
    op.drop_index('idx_visite_date', table_name='visites_du_jour')
    op.drop_table('visites_du_jour')
    
    op.drop_index('idx_visiteur_actif', table_name='visiteurs')
    op.drop_index('idx_visiteur_cni', table_name='visiteurs')
    op.drop_index('idx_visiteur_type', table_name='visiteurs')
    op.drop_index('idx_visiteur_email', table_name='visiteurs')
    op.drop_index('idx_visiteur_telephone', table_name='visiteurs')
    op.drop_index('idx_visiteur_nom', table_name='visiteurs')
    op.drop_table('visiteurs')
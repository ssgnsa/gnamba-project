"""Create HR/employees tables (employees, tasks, employes_presence, messages_direction).

Revision ID: 009_hr_employees_tables
Revises: 008_leads_crm_tables
Create Date: 2025-07-30 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '009_hr_employees_tables'
down_revision = '008_leads_crm_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # EMPLOYEES
    op.create_table(
        'employees',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('matricule', sa.String(50), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('nom', sa.String(255), nullable=False),
        sa.Column('prenom', sa.String(255), nullable=False),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('telephone', sa.String(50), nullable=True),
        sa.Column('adresse', sa.Text(), nullable=True),
        sa.Column('date_naissance', sa.Date(), nullable=True),
        sa.Column('lieu_naissance', sa.String(255), nullable=True),
        sa.Column('cni_numero', sa.String(50), nullable=True),
        sa.Column('sexe', sa.String(1), nullable=True),
        sa.Column('situation_matrimoniale', sa.String(50), nullable=True),
        sa.Column('nombre_enfants', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('contact_urgence_nom', sa.String(255), nullable=True),
        sa.Column('contact_urgence_telephone', sa.String(50), nullable=True),
        sa.Column('contact_urgence_relation', sa.String(50), nullable=True),
        sa.Column('date_embauche', sa.Date(), nullable=False),
        sa.Column('date_fin_essai', sa.Date(), nullable=True),
        sa.Column('date_fin_contrat', sa.Date(), nullable=True),
        sa.Column('type_contrat', sa.String(50), nullable=False, server_default='CDI'),
        sa.Column('poste', sa.String(100), nullable=False),
        sa.Column('departement', sa.String(100), nullable=True),
        sa.Column('superieur_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('salaire_base', sa.Numeric(12, 2), nullable=True),
        sa.Column('prime_transport', sa.Numeric(10, 2), nullable=True),
        sa.Column('prime_logement', sa.Numeric(10, 2), nullable=True),
        sa.Column('prime_autre', sa.Numeric(10, 2), nullable=True),
        sa.Column('mode_paiement', sa.String(50), nullable=True),
        sa.Column('iban', sa.String(100), nullable=True),
        sa.Column('banque', sa.String(100), nullable=True),
        sa.Column('numero_cnps', sa.String(50), nullable=True),
        sa.Column('numero_contribuable', sa.String(50), nullable=True),
        sa.Column('statut', sa.String(20), nullable=False, server_default='actif'),
        sa.Column('photo_media_id', postgresql.UUID(as_uuid=False), nullable=True),
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
        sa.UniqueConstraint('matricule'),
        sa.ForeignKeyConstraint(['superieur_id'], ['employees.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL')
    )
    op.create_index('idx_employee_matricule', 'employees', ['matricule'])
    op.create_index('idx_employee_user', 'employees', ['user_id'])
    op.create_index('idx_employee_superieur', 'employees', ['superieur_id'])
    op.create_index('idx_employee_departement', 'employees', ['departement'])
    op.create_index('idx_employee_statut', 'employees', ['statut'])
    op.create_check_constraint('ck_employee_statut', 'employees', "statut IN ('actif', 'conge', 'suspendu', 'demissionne', 'licencie', 'retraite', 'decede', 'archive')")
    op.create_check_constraint('ck_employee_type_contrat', 'employees', "type_contrat IN ('CDI', 'CDD', 'stage', 'apprentissage', 'freelance', 'autre')")

    # TASKS
    op.create_table(
        'tasks',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('reference', sa.String(50), nullable=False),
        sa.Column('titre', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('type_tache', sa.String(50), nullable=False),
        sa.Column('priorite', sa.String(20), nullable=False, server_default='normale'),
        sa.Column('statut', sa.String(20), nullable=False, server_default='a_faire'),
        sa.Column('assigne_a', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('assigne_par', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('projet_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('date_debut_prevue', sa.Date(), nullable=True),
        sa.Column('date_fin_prevue', sa.Date(), nullable=True),
        sa.Column('date_debut_reelle', sa.DateTime(timezone=True), nullable=True),
        sa.Column('date_fin_reelle', sa.DateTime(timezone=True), nullable=True),
        sa.Column('duree_estimee_heures', sa.Numeric(6, 2), nullable=True),
        sa.Column('duree_reelle_heures', sa.Numeric(6, 2), nullable=True),
        sa.Column('progression', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('depend_de', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('tags', postgresql.ARRAY(sa.String()), nullable=False, server_default='{}'),
        sa.Column('metadata_json', postgresql.JSON(), nullable=False, server_default='{}'),
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
        sa.ForeignKeyConstraint(['assigne_a'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['assigne_par'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['depend_de'], ['tasks.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['projet_id'], ['projects.id'], ondelete='SET NULL')
    )
    op.create_index('idx_task_reference', 'tasks', ['reference'])
    op.create_index('idx_task_assigne', 'tasks', ['assigne_a'])
    op.create_index('idx_task_projet', 'tasks', ['projet_id'])
    op.create_index('idx_task_statut', 'tasks', ['statut'])
    op.create_index('idx_task_priorite', 'tasks', ['priorite'])
    op.create_index('idx_task_depend', 'tasks', ['depend_de'])
    op.create_check_constraint('ck_task_statut', 'tasks', "statut IN ('a_faire', 'en_cours', 'en_attente', 'terminee', 'annulee', 'archivee')")
    op.create_check_constraint('ck_task_priorite', 'tasks', "priorite IN ('basse', 'normale', 'haute', 'urgente', 'critique')")

    # EMPLOYEES_PRESENCE
    op.create_table(
        'employes_presence',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('employee_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('heure_arrivee', sa.Time(), nullable=True),
        sa.Column('heure_depart', sa.Time(), nullable=True),
        sa.Column('pause_debut', sa.Time(), nullable=True),
        sa.Column('pause_fin', sa.Time(), nullable=True),
        sa.Column('statut', sa.String(20), nullable=False, server_default='present'),
        sa.Column('justificatif', sa.Text(), nullable=True),
        sa.Column('justificatif_media_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('valide_par', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('valide_le', sa.DateTime(timezone=True), nullable=True),
        sa.Column('metadata_json', postgresql.JSON(), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['valide_par'], ['users.id'], ondelete='SET NULL')
    )
    op.create_index('idx_presence_employee', 'employes_presence', ['employee_id'])
    op.create_index('idx_presence_date', 'employes_presence', ['date'])
    op.create_index('idx_presence_statut', 'employes_presence', ['statut'])
    op.create_unique_constraint('uq_employee_date', 'employes_presence', ['employee_id', 'date'])
    op.create_check_constraint('ck_presence_statut', 'employes_presence', "statut IN ('present', 'absent', 'retard', 'conge', 'maladie', 'mission', 'formation', 'autorisation')")

    # MESSAGES_DIRECTION
    op.create_table(
        'messages_direction',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('expediteur_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('destinataire_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('sujet', sa.String(255), nullable=False),
        sa.Column('contenu', sa.Text(), nullable=False),
        sa.Column('type_message', sa.String(50), nullable=False, server_default='interne'),
        sa.Column('priorite', sa.String(20), nullable=False, server_default='normale'),
        sa.Column('lu', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('date_lecture', sa.DateTime(timezone=True), nullable=True),
        sa.Column('reponse_a', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('pieces_jointes', postgresql.JSON(), nullable=False, server_default='[]'),
        sa.Column('metadata_json', postgresql.JSON(), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['expediteur_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['destinataire_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reponse_a'], ['messages_direction.id'], ondelete='SET NULL')
    )
    op.create_index('idx_message_expediteur', 'messages_direction', ['expediteur_id'])
    op.create_index('idx_message_destinataire', 'messages_direction', ['destinataire_id'])
    op.create_index('idx_message_lu', 'messages_direction', ['lu'])
    op.create_index('idx_message_reponse', 'messages_direction', ['reponse_a'])
    op.create_check_constraint('ck_message_type', 'messages_direction', "type_message IN ('interne', 'annonce', 'directive', 'rapport', 'demande', 'reponse', 'autre')")
    op.create_check_constraint('ck_message_priorite', 'messages_direction', "priorite IN ('basse', 'normale', 'haute', 'urgente')")


def downgrade() -> None:
    op.drop_constraint('ck_message_priorite', 'messages_direction', type_='check')
    op.drop_constraint('ck_message_type', 'messages_direction', type_='check')
    op.drop_index('idx_message_reponse', table_name='messages_direction')
    op.drop_index('idx_message_lu', table_name='messages_direction')
    op.drop_index('idx_message_destinataire', table_name='messages_direction')
    op.drop_index('idx_message_expediteur', table_name='messages_direction')
    op.drop_table('messages_direction')
    
    op.drop_constraint('uq_employee_date', 'employes_presence', type_='unique')
    op.drop_constraint('ck_presence_statut', 'employes_presence', type_='check')
    op.drop_index('idx_presence_statut', table_name='employes_presence')
    op.drop_index('idx_presence_date', table_name='employes_presence')
    op.drop_index('idx_presence_employee', table_name='employes_presence')
    op.drop_table('employes_presence')
    
    op.drop_constraint('ck_task_priorite', 'tasks', type_='check')
    op.drop_constraint('ck_task_statut', 'tasks', type_='check')
    op.drop_index('idx_task_depend', table_name='tasks')
    op.drop_index('idx_task_priorite', table_name='tasks')
    op.drop_index('idx_task_statut', table_name='tasks')
    op.drop_index('idx_task_projet', table_name='tasks')
    op.drop_index('idx_task_assigne', table_name='tasks')
    op.drop_index('idx_task_reference', table_name='tasks')
    op.drop_table('tasks')
    
    op.drop_constraint('ck_employee_type_contrat', 'employees', type_='check')
    op.drop_constraint('ck_employee_statut', 'employees', type_='check')
    op.drop_index('idx_employee_statut', table_name='employees')
    op.drop_index('idx_employee_departement', table_name='employees')
    op.drop_index('idx_employee_superieur', table_name='employees')
    op.drop_index('idx_employee_user', table_name='employees')
    op.drop_index('idx_employee_matricule', table_name='employees')
    op.drop_table('employees')
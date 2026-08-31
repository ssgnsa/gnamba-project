"""Create documents/media tables (documents, media_files, media_versions, media_usage, media_audit_logs).

Revision ID: 011_documents_media_tables
Revises: 010_finances_tables
Create Date: 2025-07-30 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '011_documents_media_tables'
down_revision = '010_finances_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # DOCUMENTS
    op.create_table(
        'documents',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('reference', sa.String(50), nullable=False),
        sa.Column('titre', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('type_document', sa.String(50), nullable=False),
        sa.Column('categorie', sa.String(100), nullable=True),
        sa.Column('entity_type', sa.String(50), nullable=True),
        sa.Column('entity_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('statut', sa.String(20), nullable=False, server_default='brouillon'),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('date_document', sa.Date(), nullable=True),
        sa.Column('date_expiration', sa.Date(), nullable=True),
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
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['updated_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['deleted_by'], ['users.id'], ondelete='SET NULL')
    )
    op.create_index('idx_document_reference', 'documents', ['reference'])
    op.create_index('idx_document_entity', 'documents', ['entity_type', 'entity_id'])
    op.create_index('idx_document_type', 'documents', ['type_document'])
    op.create_index('idx_document_statut', 'documents', ['statut'])
    op.create_index('idx_document_categorie', 'documents', ['categorie'])
    op.create_index('idx_document_deleted', 'documents', ['deleted_at'])
    op.create_check_constraint('ck_document_statut', 'documents', "statut IN ('brouillon', 'valide', 'expire', 'archive', 'annule', 'supprime')")

    # MEDIA_FILES
    op.create_table(
        'media_files',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('original_name', sa.String(255), nullable=False),
        sa.Column('file_name', sa.String(255), nullable=False),
        sa.Column('file_path', sa.String(500), nullable=False),
        sa.Column('mime_type', sa.String(100), nullable=False),
        sa.Column('extension', sa.String(20), nullable=True),
        sa.Column('file_size', sa.BigInteger(), nullable=False),
        sa.Column('width', sa.Integer(), nullable=True),
        sa.Column('height', sa.Integer(), nullable=True),
        sa.Column('duration', sa.Float(), nullable=True),
        sa.Column('hash_sha256', sa.String(64), nullable=True),
        sa.Column('entity_type', sa.String(50), nullable=True),
        sa.Column('entity_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('storage_type', sa.String(20), nullable=False, server_default='local'),
        sa.Column('storage_path', sa.String(500), nullable=True),
        sa.Column('cdn_url', sa.String(500), nullable=True),
        sa.Column('alt_text', sa.String(255), nullable=True),
        sa.Column('caption', sa.Text(), nullable=True),
        sa.Column('tags', postgresql.ARRAY(sa.String()), nullable=False, server_default='{}'),
        sa.Column('metadata_json', postgresql.JSON(), nullable=False, server_default='{}'),
        sa.Column('is_brand_asset', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('brand_asset_type', sa.String(50), nullable=True),
        sa.Column('watermarked', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('watermark_media_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('thumbnail_path', sa.String(500), nullable=True),
        sa.Column('thumbnail_width', sa.Integer(), nullable=True),
        sa.Column('thumbnail_height', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_by', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('deleted_reason', sa.Text(), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=False), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['updated_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['deleted_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['watermark_media_id'], ['media_files.id'], ondelete='SET NULL')
    )
    op.create_index('idx_media_entity', 'media_files', ['entity_type', 'entity_id'])
    op.create_index('idx_media_type', 'media_files', ['mime_type'])
    op.create_index('idx_media_brand', 'media_files', ['is_brand_asset'])
    op.create_index('idx_media_brand_type', 'media_files', ['brand_asset_type'])
    op.create_index('idx_media_hash', 'media_files', ['hash_sha256'])
    op.create_index('idx_media_deleted', 'media_files', ['deleted_at'])
    op.create_index('idx_media_storage', 'media_files', ['storage_type'])
    op.create_check_constraint('ck_media_storage', 'media_files', "storage_type IN ('local', 's3', 'supabase', 'cloudinary')")

    # MEDIA_VERSIONS
    op.create_table(
        'media_versions',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('media_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('version_number', sa.Integer(), nullable=False),
        sa.Column('file_name', sa.String(255), nullable=False),
        sa.Column('file_path', sa.String(500), nullable=False),
        sa.Column('file_size', sa.BigInteger(), nullable=False),
        sa.Column('hash_sha256', sa.String(64), nullable=True),
        sa.Column('change_description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=False), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['media_id'], ['media_files.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL')
    )
    op.create_index('idx_media_version_media', 'media_versions', ['media_id'])
    op.create_unique_constraint('uq_media_version', 'media_versions', ['media_id', 'version_number'])

    # MEDIA_USAGE
    op.create_table(
        'media_usage',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('media_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('entity_type', sa.String(50), nullable=False),
        sa.Column('entity_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('usage_context', sa.String(50), nullable=True),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['media_id'], ['media_files.id'], ondelete='CASCADE')
    )
    op.create_index('idx_media_usage_media', 'media_usage', ['media_id'])
    op.create_index('idx_media_usage_entity', 'media_usage', ['entity_type', 'entity_id'])
    op.create_unique_constraint('uq_media_usage', 'media_usage', ['media_id', 'entity_type', 'entity_id'])

    # MEDIA_AUDIT_LOGS
    op.create_table(
        'media_audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('media_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('old_values', postgresql.JSON(), nullable=True),
        sa.Column('new_values', postgresql.JSON(), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('ip_address', postgresql.INET(), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('metadata_json', postgresql.JSON(), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['media_id'], ['media_files.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL')
    )
    op.create_index('idx_media_audit_media', 'media_audit_logs', ['media_id'])
    op.create_index('idx_media_audit_user', 'media_audit_logs', ['user_id'])
    op.create_index('idx_media_audit_action', 'media_audit_logs', ['action'])
    op.create_index('idx_media_audit_created', 'media_audit_logs', ['created_at'])


def downgrade() -> None:
    op.drop_index('idx_media_audit_created', table_name='media_audit_logs')
    op.drop_index('idx_media_audit_action', table_name='media_audit_logs')
    op.drop_index('idx_media_audit_user', table_name='media_audit_logs')
    op.drop_index('idx_media_audit_media', table_name='media_audit_logs')
    op.drop_table('media_audit_logs')
    
    op.drop_constraint('uq_media_usage', 'media_usage', type_='unique')
    op.drop_index('idx_media_usage_entity', table_name='media_usage')
    op.drop_index('idx_media_usage_media', table_name='media_usage')
    op.drop_table('media_usage')
    
    op.drop_constraint('uq_media_version', 'media_versions', type_='unique')
    op.drop_index('idx_media_version_media', table_name='media_versions')
    op.drop_table('media_versions')
    
    op.drop_constraint('ck_media_storage', 'media_files', type_='check')
    op.drop_index('idx_media_storage', table_name='media_files')
    op.drop_index('idx_media_deleted', table_name='media_files')
    op.drop_index('idx_media_hash', table_name='media_files')
    op.drop_index('idx_media_brand_type', table_name='media_files')
    op.drop_index('idx_media_brand', table_name='media_files')
    op.drop_index('idx_media_type', table_name='media_files')
    op.drop_index('idx_media_entity', table_name='media_files')
    op.drop_table('media_files')
    
    op.drop_constraint('ck_document_statut', 'documents', type_='check')
    op.drop_index('idx_document_deleted', table_name='documents')
    op.drop_index('idx_document_categorie', table_name='documents')
    op.drop_index('idx_document_statut', table_name='documents')
    op.drop_index('idx_document_type', table_name='documents')
    op.drop_index('idx_document_entity', table_name='documents')
    op.drop_index('idx_document_reference', table_name='documents')
    op.drop_table('documents')
"""Add missing Foncier columns to match frontend/backend rich schema.

Revision ID: 015_add_missing_foncier_columns
Revises: 014_settings_tables
Create Date: 2025-07-30 00:00:00.000000

This migration adds missing columns to foncier tables to match
the rich TypeScript/SQLAlchemy schemas used by frontend and backend.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '015_add_missing_foncier_columns'
down_revision = '014_settings_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add missing columns to foncier tables."""
    
    # ============================================================
    # FONCIER_VILLAGES - add missing columns
    # ============================================================
    op.add_column('foncier_villages', sa.Column('updated_by', postgresql.UUID(as_uuid=False), nullable=True))

    # ============================================================
    # FONCIER_LOTISSEMENTS - add missing columns
    # ============================================================
    op.add_column('foncier_lotissements', sa.Column('updated_by', postgresql.UUID(as_uuid=False), nullable=True))
    
    # ============================================================
    # FONCIER_ILOTS - add missing columns
    # ============================================================
    op.add_column('foncier_ilots', sa.Column('updated_by', postgresql.UUID(as_uuid=False), nullable=True))
    
    # ============================================================
    # FONCIER_LOTS - add missing columns
    # Based on FoncierLotType (frontend) and FoncierLot model (backend)
    # ============================================================
    op.add_column('foncier_lots', sa.Column('version', sa.Integer(), nullable=False, server_default='1'))
    op.add_column('foncier_lots', sa.Column('type', sa.String(20), nullable=False, server_default='standard'))
    op.add_column('foncier_lots', sa.Column('date_etablissement', sa.Date(), nullable=True))
    op.add_column('foncier_lots', sa.Column('mode_acquisition', sa.Text(), nullable=True))
    op.add_column('foncier_lots', sa.Column('historique_possession', sa.Text(), nullable=True))
    op.add_column('foncier_lots', sa.Column('domicile', sa.Text(), nullable=True))
    op.add_column('foncier_lots', sa.Column('cedant_nom', sa.String(255), nullable=True))
    op.add_column('foncier_lots', sa.Column('cedant_prenom', sa.String(255), nullable=True))
    op.add_column('foncier_lots', sa.Column('cedant_cni_numero', sa.String(50), nullable=True))
    op.add_column('foncier_lots', sa.Column('cedant_telephone', sa.String(50), nullable=True))
    op.add_column('foncier_lots', sa.Column('cedant_domicile', sa.Text(), nullable=True))
    op.add_column('foncier_lots', sa.Column('limites_nord', sa.Text(), nullable=True))
    op.add_column('foncier_lots', sa.Column('limites_sud', sa.Text(), nullable=True))
    op.add_column('foncier_lots', sa.Column('limites_est', sa.Text(), nullable=True))
    op.add_column('foncier_lots', sa.Column('limites_ouest', sa.Text(), nullable=True))
    op.add_column('foncier_lots', sa.Column('gps_lat', sa.Numeric(9, 6), nullable=True))
    op.add_column('foncier_lots', sa.Column('gps_lng', sa.Numeric(9, 6), nullable=True))
    op.add_column('foncier_lots', sa.Column('gps_precision', sa.Numeric(5, 2), nullable=True))
    op.add_column('foncier_lots', sa.Column('gps_points', postgresql.JSON(), nullable=False, server_default='[]'))
    op.add_column('foncier_lots', sa.Column('registre_volume', sa.String(50), nullable=True))
    op.add_column('foncier_lots', sa.Column('registre_page', sa.Integer(), nullable=True))
    op.add_column('foncier_lots', sa.Column('registre_ligne', sa.Integer(), nullable=True))
    op.add_column('foncier_lots', sa.Column('numero_enregistrement', sa.String(100), nullable=True))
    op.add_column('foncier_lots', sa.Column('qr_payload', sa.Text(), nullable=True))
    op.add_column('foncier_lots', sa.Column('signature_numerique', sa.Text(), nullable=True))
    op.add_column('foncier_lots', sa.Column('hash_sha256', sa.String(64), nullable=True))
    op.add_column('foncier_lots', sa.Column('control_number', sa.String(20), nullable=True))
    op.add_column('foncier_lots', sa.Column('signature_nonce', sa.String(64), nullable=True))
    op.add_column('foncier_lots', sa.Column('signature_issued_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('foncier_lots', sa.Column('validation_agent_nom', sa.String(255), nullable=True))
    op.add_column('foncier_lots', sa.Column('validation_agent_id', postgresql.UUID(as_uuid=False), nullable=True))
    op.add_column('foncier_lots', sa.Column('validation_agent_date', sa.DateTime(timezone=True), nullable=True))
    op.add_column('foncier_lots', sa.Column('validation_chef_nom', sa.String(255), nullable=True))
    op.add_column('foncier_lots', sa.Column('validation_chef_id', postgresql.UUID(as_uuid=False), nullable=True))
    op.add_column('foncier_lots', sa.Column('validation_chef_date', sa.DateTime(timezone=True), nullable=True))
    op.add_column('foncier_lots', sa.Column('proprietaire_photo_media_id', postgresql.UUID(as_uuid=False), nullable=True))
    op.add_column('foncier_lots', sa.Column('proprietaire_empreinte_media_id', postgresql.UUID(as_uuid=False), nullable=True))
    op.add_column('foncier_lots', sa.Column('chef_signature_manuscrite_requise', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('foncier_lots', sa.Column('chef_signature_media_id', postgresql.UUID(as_uuid=False), nullable=True))
    op.add_column('foncier_lots', sa.Column('chef_empreinte_media_id', postgresql.UUID(as_uuid=False), nullable=True))
    op.add_column('foncier_lots', sa.Column('temoin_empreinte_media_ids', postgresql.ARRAY(postgresql.UUID(as_uuid=False)), nullable=False, server_default='{}'))
    op.add_column('foncier_lots', sa.Column('revoke_reason', sa.Text(), nullable=True))
    op.add_column('foncier_lots', sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('foncier_lots', sa.Column('revoked_by', postgresql.UUID(as_uuid=False), nullable=True))
    op.add_column('foncier_lots', sa.Column('pdf_media_id', postgresql.UUID(as_uuid=False), nullable=True))
    op.add_column('foncier_lots', sa.Column('pdf_generated_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('foncier_lots', sa.Column('printed_by', postgresql.UUID(as_uuid=False), nullable=True))
    op.add_column('foncier_lots', sa.Column('printed_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('foncier_lots', sa.Column('print_count', sa.Integer(), nullable=False, server_default='0'))

    # Add check constraints for foncier_lots
    op.create_check_constraint('ck_lot_type', 'foncier_lots', "type IN ('standard', 'cession', 'succession', 'mutation')")

    # ============================================================
    # FONCIER_ATTESTATIONS - add missing columns
    # This is the biggest gap - many columns missing
    # ============================================================
    op.add_column('foncier_attestations', sa.Column('version', sa.Integer(), nullable=False, server_default='1'))
    op.add_column('foncier_attestations', sa.Column('type', sa.String(20), nullable=False, server_default='standard'))
    op.add_column('foncier_attestations', sa.Column('date_etablissement', sa.Date(), nullable=True))
    op.add_column('foncier_attestations', sa.Column('date_expiration', sa.DateTime(timezone=True), nullable=True))
    op.add_column('foncier_attestations', sa.Column('mode_acquisition', sa.Text(), nullable=True))
    op.add_column('foncier_attestations', sa.Column('historique_possession', sa.Text(), nullable=True))
    op.add_column('foncier_attestations', sa.Column('domicile', sa.Text(), nullable=True))
    op.add_column('foncier_attestations', sa.Column('cedant_nom', sa.String(255), nullable=True))
    op.add_column('foncier_attestations', sa.Column('cedant_prenom', sa.String(255), nullable=True))
    op.add_column('foncier_attestations', sa.Column('cedant_cni_numero', sa.String(50), nullable=True))
    op.add_column('foncier_attestations', sa.Column('cedant_telephone', sa.String(50), nullable=True))
    op.add_column('foncier_attestations', sa.Column('cedant_domicile', sa.Text(), nullable=True))
    op.add_column('foncier_attestations', sa.Column('limites_nord', sa.Text(), nullable=True))
    op.add_column('foncier_attestations', sa.Column('limites_sud', sa.Text(), nullable=True))
    op.add_column('foncier_attestations', sa.Column('limites_est', sa.Text(), nullable=True))
    op.add_column('foncier_attestations', sa.Column('limites_ouest', sa.Text(), nullable=True))
    op.add_column('foncier_attestations', sa.Column('gps_lat', sa.Numeric(9, 6), nullable=True))
    op.add_column('foncier_attestations', sa.Column('gps_lng', sa.Numeric(9, 6), nullable=True))
    op.add_column('foncier_attestations', sa.Column('gps_precision', sa.Numeric(5, 2), nullable=True))
    op.add_column('foncier_attestations', sa.Column('gps_points', postgresql.JSON(), nullable=False, server_default='[]'))
    op.add_column('foncier_attestations', sa.Column('registre_volume', sa.String(50), nullable=True))
    op.add_column('foncier_attestations', sa.Column('registre_page', sa.Integer(), nullable=True))
    op.add_column('foncier_attestations', sa.Column('registre_ligne', sa.Integer(), nullable=True))
    op.add_column('foncier_attestations', sa.Column('numero_enregistrement', sa.String(100), nullable=True))
    op.add_column('foncier_attestations', sa.Column('qr_payload', sa.Text(), nullable=True))
    op.add_column('foncier_attestations', sa.Column('signature_numerique', sa.Text(), nullable=True))
    op.add_column('foncier_attestations', sa.Column('hash_sha256', sa.String(64), nullable=True))
    op.add_column('foncier_attestations', sa.Column('reference_sequence', sa.Integer(), nullable=True))
    op.add_column('foncier_attestations', sa.Column('control_number', sa.String(20), nullable=True))
    op.add_column('foncier_attestations', sa.Column('signature_nonce', sa.String(64), nullable=True))
    op.add_column('foncier_attestations', sa.Column('signature_issued_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('foncier_attestations', sa.Column('validation_agent_nom', sa.String(255), nullable=True))
    op.add_column('foncier_attestations', sa.Column('validation_agent_id', postgresql.UUID(as_uuid=False), nullable=True))
    op.add_column('foncier_attestations', sa.Column('validation_agent_date', sa.DateTime(timezone=True), nullable=True))
    op.add_column('foncier_attestations', sa.Column('validation_chef_nom', sa.String(255), nullable=True))
    op.add_column('foncier_attestations', sa.Column('validation_chef_id', postgresql.UUID(as_uuid=False), nullable=True))
    op.add_column('foncier_attestations', sa.Column('validation_chef_date', sa.DateTime(timezone=True), nullable=True))
    op.add_column('foncier_attestations', sa.Column('proprietaire_photo_media_id', postgresql.UUID(as_uuid=False), nullable=True))
    op.add_column('foncier_attestations', sa.Column('proprietaire_empreinte_media_id', postgresql.UUID(as_uuid=False), nullable=True))
    op.add_column('foncier_attestations', sa.Column('chef_signature_manuscrite_requise', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('foncier_attestations', sa.Column('chef_signature_media_id', postgresql.UUID(as_uuid=False), nullable=True))
    op.add_column('foncier_attestations', sa.Column('chef_empreinte_media_id', postgresql.UUID(as_uuid=False), nullable=True))
    op.add_column('foncier_attestations', sa.Column('temoin_empreinte_media_ids', postgresql.ARRAY(postgresql.UUID(as_uuid=False)), nullable=False, server_default='{}'))
    op.add_column('foncier_attestations', sa.Column('revoke_reason', sa.Text(), nullable=True))
    op.add_column('foncier_attestations', sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('foncier_attestations', sa.Column('revoked_by', postgresql.UUID(as_uuid=False), nullable=True))
    op.add_column('foncier_attestations', sa.Column('verify_url', sa.Text(), nullable=True))
    op.add_column('foncier_attestations', sa.Column('pdf_media_id', postgresql.UUID(as_uuid=False), nullable=True))
    op.add_column('foncier_attestations', sa.Column('pdf_generated_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('foncier_attestations', sa.Column('printed_by', postgresql.UUID(as_uuid=False), nullable=True))
    op.add_column('foncier_attestations', sa.Column('printed_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('foncier_attestations', sa.Column('print_count', sa.Integer(), nullable=False, server_default='0'))

    # Add check constraints for type and statut
    op.create_check_constraint('ck_attestation_type', 'foncier_attestations', "type IN ('standard', 'cession', 'succession', 'mutation')")
    op.create_check_constraint('ck_attestation_statut', 'foncier_attestations', "statut IN ('brouillon', 'soumis', 'valide', 'archive', 'revoque', 'expire', 'annule')")

    # ============================================================
    # FONCIER_ATTESTATION_TEMOINS - add missing columns
    # ============================================================
    op.add_column('foncier_attestation_temoins', sa.Column('profession', sa.String(255), nullable=True))
    op.add_column('foncier_attestation_temoins', sa.Column('telephone', sa.String(50), nullable=True))
    op.add_column('foncier_attestation_temoins', sa.Column('cni', sa.String(50), nullable=True))
    op.add_column('foncier_attestation_temoins', sa.Column('empreinte_media_id', postgresql.UUID(as_uuid=False), nullable=True))
    op.add_column('foncier_attestation_temoins', sa.Column('signed_at', sa.DateTime(timezone=True), nullable=True))

    print("Migration 015 completed: Added missing Foncier columns")


def downgrade() -> None:
    """Remove added columns (destructive - only for dev reset)."""
    # This is a baseline migration - downgrade not recommended for production
    # Just drop the added columns if needed for development reset
    
    # Drop constraints first
    op.drop_constraint('ck_attestation_type', 'foncier_attestations', type_='check')
    op.drop_constraint('ck_attestation_statut', 'foncier_attestations', type_='check')
    op.drop_constraint('ck_lot_type', 'foncier_lots', type_='check')
    
    # Columns to drop from foncier_lots
    lots_columns = [
        "version", "type", "date_etablissement", "mode_acquisition", "historique_possession", 
        "domicile", "cedant_nom", "cedant_prenom", "cedant_cni_numero", "cedant_telephone", 
        "cedant_domicile", "limites_nord", "limites_sud", "limites_est", "limites_ouest",
        "gps_lat", "gps_lng", "gps_precision", "gps_points", "registre_volume", "registre_page", 
        "registre_ligne", "numero_enregistrement", "qr_payload", "signature_numerique", 
        "hash_sha256", "control_number", "signature_nonce", "signature_issued_at",
        "validation_agent_nom", "validation_agent_id", "validation_agent_date",
        "validation_chef_nom", "validation_chef_id", "validation_chef_date",
        "proprietaire_photo_media_id", "proprietaire_empreinte_media_id", 
        "chef_signature_manuscrite_requise", "chef_signature_media_id", 
        "chef_empreinte_media_id", "temoin_empreinte_media_ids", "revoke_reason", 
        "revoked_at", "revoked_by", "pdf_media_id", "pdf_generated_at", 
        "printed_by", "printed_at", "print_count"
    ]
    
    for col in lots_columns:
        op.drop_column('foncier_lots', col)
    
    # Columns to drop from foncier_attestations
    attestations_columns = [
        "version", "type", "date_etablissement", "date_expiration", "mode_acquisition", 
        "historique_possession", "domicile", "cedant_nom", "cedant_prenom", "cedant_cni_numero", 
        "cedant_telephone", "cedant_domicile", "limites_nord", "limites_sud", "limites_est", 
        "limites_ouest", "gps_lat", "gps_lng", "gps_precision", "gps_points", "registre_volume", 
        "registre_page", "registre_ligne", "numero_enregistrement", "qr_payload", 
        "signature_numerique", "hash_sha256", "reference_sequence", "control_number", 
        "signature_nonce", "signature_issued_at", "validation_agent_nom", 
        "validation_agent_id", "validation_agent_date", "validation_chef_nom", 
        "validation_chef_id", "validation_chef_date", "proprietaire_photo_media_id", 
        "proprietaire_empreinte_media_id", "chef_signature_manuscrite_requise", 
        "chef_signature_media_id", "chef_empreinte_media_id", "temoin_empreinte_media_ids", 
        "revoke_reason", "revoked_at", "revoked_by", "verify_url", "pdf_media_id", 
        "pdf_generated_at", "printed_by", "printed_at", "print_count"
    ]
    
    for col in attestations_columns:
        op.drop_column('foncier_attestations', col)
    
    # Columns to drop from foncier_attestation_temoins
    temoins_columns = [
        "profession", "telephone", "cni", "empreinte_media_id", "signed_at"
    ]
    
    for col in temoins_columns:
        op.drop_column('foncier_attestation_temoins', col)
    
    # Updated_by columns
    op.drop_column('foncier_villages', 'updated_by')
    op.drop_column('foncier_lotissements', 'updated_by')
    op.drop_column('foncier_ilots', 'updated_by')
    
    print("Migration 015 downgraded: Removed Foncier columns")
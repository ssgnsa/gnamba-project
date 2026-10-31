"""fix foncier schema drift

Revision ID: 038_fix_foncier_schema_drift
Revises: 037_add_mfa_to_users
"""
from alembic import op

revision = "038_fix_foncier_schema_drift"
down_revision = "037_add_mfa_to_users"
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Fix parties entity_id (dérive détectée lors de l'audit)
    op.execute("ALTER TABLE parties ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES entities(id) ON DELETE SET NULL;")
    
    # 2. Fix foncier_attestations workflow columns
    op.execute("ALTER TABLE foncier_attestations ADD COLUMN IF NOT EXISTS delivre BOOLEAN DEFAULT FALSE;")
    op.execute("ALTER TABLE foncier_attestations ADD COLUMN IF NOT EXISTS delivre_par UUID;")
    op.execute("ALTER TABLE foncier_attestations ADD COLUMN IF NOT EXISTS delivre_le TIMESTAMP WITH TIME ZONE;")
    
    # 3. Fix type mismatch for temoin array
    op.execute("ALTER TABLE foncier_attestations ALTER COLUMN temoin_empreinte_media_ids TYPE VARCHAR[] USING temoin_empreinte_media_ids::VARCHAR[];")

def downgrade() -> None:
    pass

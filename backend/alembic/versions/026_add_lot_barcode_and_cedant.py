"""Add persistent lot barcode and cedant snapshot fields.

Revision ID: 026_add_lot_barcode_and_cedant
Revises: 025_fix_missing_foncier_schema_columns
Create Date: 2026-09-15 00:00:00
"""

from alembic import op
import sqlalchemy as sa

revision = "026_add_lot_barcode_and_cedant"
down_revision = "025_fix_missing_foncier_schema_columns"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return

    bind.execute(sa.text("ALTER TABLE foncier_lots ADD COLUMN IF NOT EXISTS code_barre VARCHAR(64)"))
    bind.execute(sa.text("ALTER TABLE foncier_lots ADD COLUMN IF NOT EXISTS cedant_nom VARCHAR(255)"))
    bind.execute(sa.text("ALTER TABLE foncier_lots ADD COLUMN IF NOT EXISTS cedant_prenom VARCHAR(255)"))
    bind.execute(sa.text("ALTER TABLE foncier_lots ADD COLUMN IF NOT EXISTS cedant_cni_numero VARCHAR(50)"))
    bind.execute(sa.text("ALTER TABLE foncier_lots ADD COLUMN IF NOT EXISTS cedant_telephone VARCHAR(50)"))
    bind.execute(sa.text("ALTER TABLE foncier_lots ADD COLUMN IF NOT EXISTS cedant_domicile TEXT"))
    bind.execute(sa.text("UPDATE foncier_lots SET code_barre = 'LOT-' || upper(substr(replace(id::text, '-', ''), 1, 24)) WHERE code_barre IS NULL"))
    bind.execute(sa.text("ALTER TABLE foncier_lots ALTER COLUMN code_barre SET NOT NULL"))
    bind.execute(sa.text("CREATE UNIQUE INDEX IF NOT EXISTS uq_foncier_lots_code_barre ON foncier_lots (code_barre)"))


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return
    bind.execute(sa.text("DROP INDEX IF EXISTS uq_foncier_lots_code_barre"))
    for column in ("cedant_domicile", "cedant_telephone", "cedant_cni_numero", "cedant_prenom", "cedant_nom", "code_barre"):
        bind.execute(sa.text(f"ALTER TABLE foncier_lots DROP COLUMN IF EXISTS {column}"))

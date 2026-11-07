"""villages: unique index partiels pour permettre recréation après archivage

Revision ID: 040_villages_partial_unique
Revises: 039_add_proprietaire_entity_id_to_properties
Create Date: 2026-11-07
"""
from alembic import op

revision = "040_villages_partial_unique"
down_revision = "039_add_proprietaire_entity_id_to_properties"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Drop les contraintes UNIQUE globales
    op.execute("ALTER TABLE foncier_villages DROP CONSTRAINT IF EXISTS foncier_villages_nom_key")
    op.execute("ALTER TABLE foncier_villages DROP CONSTRAINT IF EXISTS foncier_villages_code_key")

    # 2. Recréer en index partiels (uniquement sur les villages actifs)
    op.execute("""
        CREATE UNIQUE INDEX uq_foncier_villages_nom_actif
          ON foncier_villages (nom)
          WHERE actif = true
    """)
    op.execute("""
        CREATE UNIQUE INDEX uq_foncier_villages_code_actif
          ON foncier_villages (code)
          WHERE actif = true
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS uq_foncier_villages_nom_actif")
    op.execute("DROP INDEX IF EXISTS uq_foncier_villages_code_actif")
    op.execute("ALTER TABLE foncier_villages ADD CONSTRAINT foncier_villages_nom_key UNIQUE (nom)")
    op.execute("ALTER TABLE foncier_villages ADD CONSTRAINT foncier_villages_code_key UNIQUE (code)")
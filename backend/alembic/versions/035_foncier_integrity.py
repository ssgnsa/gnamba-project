"""Enforce active Foncier lot and attestation uniqueness."""

from alembic import op
import sqlalchemy as sa


revision = "035_foncier_integrity"
down_revision = "034_add_mfa_session_state"
branch_labels = None
depends_on = None


def _fail_on_duplicates(query: str, label: str) -> None:
    rows = op.get_bind().execute(sa.text(query)).fetchall()
    if rows:
        examples = ", ".join(f"{row[0]}={row[1]} ({row[2]})" for row in rows[:5])
        raise RuntimeError(
            f"Migration Foncier bloquée: doublons actifs dans {label}: {examples}. "
            "Archivez ou corrigez les doublons avant de relancer la migration."
        )


def upgrade() -> None:
    _fail_on_duplicates(
        """
        SELECT ilot_id, numero_lot, COUNT(*)
        FROM foncier_lots
        WHERE deleted_at IS NULL
        GROUP BY ilot_id, numero_lot
        HAVING COUNT(*) > 1
        LIMIT 5
        """,
        "foncier_lots (ilot_id, numero_lot)",
    )
    _fail_on_duplicates(
        """
        SELECT lot_id, version, COUNT(*)
        FROM foncier_attestations
        WHERE deleted_at IS NULL
        GROUP BY lot_id, version
        HAVING COUNT(*) > 1
        LIMIT 5
        """,
        "foncier_attestations (lot_id, version)",
    )

    op.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS uq_foncier_lots_active_ilot_numero_lot
        ON foncier_lots (ilot_id, numero_lot)
        WHERE deleted_at IS NULL
        """
    )
    op.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS uq_foncier_attestations_active_lot_version
        ON foncier_attestations (lot_id, version)
        WHERE deleted_at IS NULL
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS uq_foncier_attestations_active_lot_version")
    op.execute("DROP INDEX IF EXISTS uq_foncier_lots_active_ilot_numero_lot")

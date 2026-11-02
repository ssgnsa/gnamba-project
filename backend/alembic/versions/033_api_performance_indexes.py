"""Add indexes supporting API filters, ordering, and soft-delete reads."""

from alembic import op


revision = "033_api_performance_indexes"
down_revision = "032_immobilier_v2_contract"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Partial indexes keep archived rows out of the hot read paths.
    op.execute("CREATE INDEX IF NOT EXISTS idx_properties_active_created ON properties (created_at DESC, id) WHERE deleted_at IS NULL")
    op.execute("CREATE INDEX IF NOT EXISTS idx_properties_active_status_created ON properties (statut, created_at DESC, id) WHERE deleted_at IS NULL")
    op.execute("CREATE INDEX IF NOT EXISTS idx_properties_published_created ON properties (created_at DESC, id) WHERE deleted_at IS NULL AND publier_vitrine IS TRUE")

    op.execute("CREATE INDEX IF NOT EXISTS idx_lease_contracts_active_created ON lease_contracts (created_at DESC, id) WHERE deleted_at IS NULL")
    op.execute("CREATE INDEX IF NOT EXISTS idx_lease_contracts_active_status_created ON lease_contracts (statut, created_at DESC, id) WHERE deleted_at IS NULL")

    op.execute("CREATE INDEX IF NOT EXISTS idx_rent_payments_active_created ON rent_payments (created_at DESC, id) WHERE deleted_at IS NULL")
    op.execute("CREATE INDEX IF NOT EXISTS idx_rent_payments_active_property_created ON rent_payments (property_id, created_at DESC, id) WHERE deleted_at IS NULL")
    op.execute("CREATE INDEX IF NOT EXISTS idx_rent_payments_active_contract_created ON rent_payments (contract_id, created_at DESC, id) WHERE deleted_at IS NULL")

    op.execute("CREATE INDEX IF NOT EXISTS idx_lead_campaigns_created ON lead_campaigns (created_at DESC, id DESC)")


def downgrade() -> None:
    for index_name in (
        "idx_lead_campaigns_created",
        "idx_rent_payments_active_contract_created",
        "idx_rent_payments_active_property_created",
        "idx_rent_payments_active_created",
        "idx_lease_contracts_active_status_created",
        "idx_lease_contracts_active_created",
        "idx_properties_published_created",
        "idx_properties_active_status_created",
        "idx_properties_active_created",
    ):
        op.execute(f"DROP INDEX IF EXISTS {index_name}")

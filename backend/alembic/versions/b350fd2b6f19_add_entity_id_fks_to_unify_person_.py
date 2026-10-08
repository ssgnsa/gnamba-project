"""Add nullable links from existing business records to unified entities.

Revision ID: b350fd2b6f19
Revises: 6c21cb4b996d
Create Date: 2026-08-08 13:01:41.564360

The original autogenerate output recreated tables already owned by earlier
revisions and dropped unrelated schema objects. This revision is limited to
the entity links named by its purpose.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "b350fd2b6f19"
down_revision = "6c21cb4b996d"
branch_labels = None
depends_on = None


ENTITY_LINKS = (
    ("employees", "entity_id", "fk_employees_entity"),
    ("finances", "entity_id", "fk_finances_entity"),
    ("foncier_attestation_temoins", "entity_id", "fk_foncier_temoins_entity"),
    ("leads", "entity_id", "fk_leads_entity"),
    ("lease_contracts", "locataire_entity_id", "fk_lease_contracts_locataire_entity"),
    ("parties", "entity_id", "fk_parties_entity"),
    ("properties", "proprietaire_entity_id", "fk_properties_proprietaire_entity"),
    ("rent_payments", "locataire_entity_id", "fk_rent_payments_locataire_entity"),
    ("suppliers", "entity_id", "fk_suppliers_entity"),
    ("users", "entity_id", "fk_users_entity"),
)


def upgrade() -> None:
    for table, column, constraint in ENTITY_LINKS:
        op.add_column(table, sa.Column(column, postgresql.UUID(as_uuid=False), nullable=True))
        op.create_index(f"ix_{table}_{column}", table, [column])
        op.create_foreign_key(constraint, table, "entities", [column], ["id"], ondelete="SET NULL")


def downgrade() -> None:
    for table, column, constraint in reversed(ENTITY_LINKS):
        op.drop_constraint(constraint, table, type_="foreignkey")
        op.drop_index(f"ix_{table}_{column}", table_name=table)
        op.drop_column(table, column)

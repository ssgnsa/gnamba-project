"""Convert activity_logs.changed_fields from PostgreSQL array to JSON.

JSON is portable across PostgreSQL and SQLite test databases and is
consistent with the existing old_values / new_values columns.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "036_foncier_activity_logs_json"
down_revision = "035_foncier_integrity"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "activity_logs",
        "changed_fields",
        type_=sa.JSON(),
        postgresql_using="to_json(changed_fields)",
        existing_type=postgresql.ARRAY(sa.String()),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "activity_logs",
        "changed_fields",
        type_=postgresql.ARRAY(sa.String()),
        postgresql_using=r"regexp_replace(regexp_replace(changed_fields::text, '^\[', '{', ''), '\]$', '}', '')::text[]",
        existing_type=sa.JSON(),
        existing_nullable=True,
    )

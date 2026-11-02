"""Track MFA verification on auth sessions."""

from alembic import op
import sqlalchemy as sa


revision = "034_add_mfa_session_state"
down_revision = "033_api_performance_indexes"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "auth_sessions",
        sa.Column("mfa_verified_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("auth_sessions", "mfa_verified_at")

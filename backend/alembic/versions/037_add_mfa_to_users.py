"""add MFA columns to users

Revision ID: 037_add_mfa_to_users
Revises: 036_foncier_activity_logs_json
"""
from alembic import op
import sqlalchemy as sa

revision = "037_add_mfa_to_users"
down_revision = "036_foncier_activity_logs_json"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("mfa_secret", sa.String(64), nullable=True))
    op.add_column(
        "users",
        sa.Column(
            "mfa_enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.add_column(
        "users",
        sa.Column("mfa_confirmed_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "mfa_confirmed_at")
    op.drop_column("users", "mfa_enabled")
    op.drop_column("users", "mfa_secret")

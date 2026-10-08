"""Add password reset tokens and server-side auth rate limit events.

Status: HOLD — not applied.
Revision ID: 029_auth_password_lifecycle
Revises: 028_normalize_vitrine_lots_types
"""
from alembic import op
import sqlalchemy as sa


revision = "029_auth_password_lifecycle"
down_revision = "028_normalize_vitrine_lots_types"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "auth_password_reset_tokens",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("token_hash", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_auth_password_reset_tokens_id", "auth_password_reset_tokens", ["id"])
    op.create_index("ix_auth_password_reset_tokens_user_id", "auth_password_reset_tokens", ["user_id"])
    op.create_index("ix_auth_password_reset_tokens_token_hash", "auth_password_reset_tokens", ["token_hash"], unique=True)
    op.create_index(
        "uq_auth_password_reset_tokens_active_user",
        "auth_password_reset_tokens",
        ["user_id"],
        unique=True,
        postgresql_where=sa.text("used_at IS NULL"),
        sqlite_where=sa.text("used_at IS NULL"),
    )

    op.create_table(
        "auth_rate_limit_events",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("event_type", sa.String(), nullable=False),
        sa.Column("identifier", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_auth_rate_limit_events_id", "auth_rate_limit_events", ["id"])
    op.create_index("ix_auth_rate_limit_events_event_type", "auth_rate_limit_events", ["event_type"])
    op.create_index("ix_auth_rate_limit_events_identifier", "auth_rate_limit_events", ["identifier"])
    op.create_index("ix_auth_rate_limit_events_created_at", "auth_rate_limit_events", ["created_at"])
    op.create_index(
        "ix_auth_rate_limit_events_lookup",
        "auth_rate_limit_events",
        ["event_type", "identifier", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_auth_rate_limit_events_lookup", table_name="auth_rate_limit_events")
    op.drop_index("ix_auth_rate_limit_events_created_at", table_name="auth_rate_limit_events")
    op.drop_index("ix_auth_rate_limit_events_identifier", table_name="auth_rate_limit_events")
    op.drop_index("ix_auth_rate_limit_events_event_type", table_name="auth_rate_limit_events")
    op.drop_index("ix_auth_rate_limit_events_id", table_name="auth_rate_limit_events")
    op.drop_table("auth_rate_limit_events")
    op.drop_index("uq_auth_password_reset_tokens_active_user", table_name="auth_password_reset_tokens")
    op.drop_index("ix_auth_password_reset_tokens_token_hash", table_name="auth_password_reset_tokens")
    op.drop_index("ix_auth_password_reset_tokens_user_id", table_name="auth_password_reset_tokens")
    op.drop_index("ix_auth_password_reset_tokens_id", table_name="auth_password_reset_tokens")
    op.drop_table("auth_password_reset_tokens")

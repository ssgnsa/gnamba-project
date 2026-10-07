"""Add auth sessions, token rotation state and audit logs."""

from alembic import op
import sqlalchemy as sa

revision = "004_auth_sessions_audit"
down_revision = "003_projects"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "auth_sessions",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("refresh_token_hash", sa.String(), nullable=False),
        sa.Column("user_agent", sa.String(), nullable=True),
        sa.Column("ip_address", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_reason", sa.String(), nullable=True),
        sa.Column("compromised_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("refresh_token_hash"),
    )
    op.create_index(op.f("ix_auth_sessions_id"), "auth_sessions", ["id"], unique=False)
    op.create_index(op.f("ix_auth_sessions_user_id"), "auth_sessions", ["user_id"], unique=False)
    op.create_index(op.f("ix_auth_sessions_refresh_token_hash"), "auth_sessions", ["refresh_token_hash"], unique=True)

    op.create_table(
        "auth_audit_logs",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=True),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("action", sa.String(), nullable=False),
        sa.Column("ip_address", sa.String(), nullable=True),
        sa.Column("user_agent", sa.String(), nullable=True),
        sa.Column("metadata_json", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_auth_audit_logs_id"), "auth_audit_logs", ["id"], unique=False)
    op.create_index(op.f("ix_auth_audit_logs_user_id"), "auth_audit_logs", ["user_id"], unique=False)
    op.create_index(op.f("ix_auth_audit_logs_email"), "auth_audit_logs", ["email"], unique=False)
    op.create_index(op.f("ix_auth_audit_logs_action"), "auth_audit_logs", ["action"], unique=False)

    op.create_table(
        "auth_login_failures",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("ip_address", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_auth_login_failures_id"), "auth_login_failures", ["id"], unique=False)
    op.create_index(op.f("ix_auth_login_failures_email"), "auth_login_failures", ["email"], unique=False)
    op.create_index(op.f("ix_auth_login_failures_ip_address"), "auth_login_failures", ["ip_address"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_auth_login_failures_ip_address"), table_name="auth_login_failures")
    op.drop_index(op.f("ix_auth_login_failures_email"), table_name="auth_login_failures")
    op.drop_index(op.f("ix_auth_login_failures_id"), table_name="auth_login_failures")
    op.drop_table("auth_login_failures")
    op.drop_index(op.f("ix_auth_audit_logs_action"), table_name="auth_audit_logs")
    op.drop_index(op.f("ix_auth_audit_logs_email"), table_name="auth_audit_logs")
    op.drop_index(op.f("ix_auth_audit_logs_user_id"), table_name="auth_audit_logs")
    op.drop_index(op.f("ix_auth_audit_logs_id"), table_name="auth_audit_logs")
    op.drop_table("auth_audit_logs")
    op.drop_index(op.f("ix_auth_sessions_refresh_token_hash"), table_name="auth_sessions")
    op.drop_index(op.f("ix_auth_sessions_user_id"), table_name="auth_sessions")
    op.drop_index(op.f("ix_auth_sessions_id"), table_name="auth_sessions")
    op.drop_table("auth_sessions")

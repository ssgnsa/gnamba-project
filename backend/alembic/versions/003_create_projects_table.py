"""create projects table

Revision ID: 003_projects
Revises: 002_core_domain
Create Date: 2026-07-06 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


revision = "003_projects"
down_revision = "002_core_domain"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "projects",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("nom", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("statut", sa.String(), nullable=False, server_default="planifie"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_projects_id"), "projects", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_projects_id"), table_name="projects")
    op.drop_table("projects")


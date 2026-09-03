"""Add content_hash column and media_taxonomy table.

Revision ID: 024_add_media_taxonomy_and_content_hash
Revises: 023_fix_immobilier_uuid_columns
Create Date: 2026-09-03 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "024_add_media_taxonomy_and_content_hash"
down_revision = "023_fix_immobilier_uuid_columns"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name

    if dialect == "sqlite":
        op.add_column("media_files", sa.Column("content_hash", sa.Text(), nullable=True))
        op.add_column("media_files", sa.Column("taxonomy_id", sa.Text(), nullable=True))
        op.create_table(
            "media_taxonomy",
            sa.Column("id", sa.Text(), primary_key=True),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("slug", sa.String(), nullable=False),
            sa.Column("parent_id", sa.Text(), nullable=True),
        )
    else:
        op.add_column("media_files", sa.Column("content_hash", sa.Text(), nullable=True))
        op.add_column("media_files", sa.Column("taxonomy_id", postgresql.UUID(as_uuid=False), nullable=True))
        op.create_table(
            "media_taxonomy",
            sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("slug", sa.String(), nullable=False),
            sa.Column("parent_id", postgresql.UUID(as_uuid=False), nullable=True),
        )
    # index to speed up dedup queries
    try:
        op.create_index("idx_media_content_hash", "media_files", ["content_hash"])
    except Exception:
        # index creation may fail on sqlite older versions; ignore
        pass


def downgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name

    try:
        op.drop_index("idx_media_content_hash", table_name="media_files")
    except Exception:
        pass

    if dialect == "sqlite":
        # SQLite: dropping columns requires table rebuild; keep simple: don't drop columns in downgrade
        op.drop_table("media_taxonomy")
    else:
        op.drop_table("media_taxonomy")
        op.drop_column("media_files", "taxonomy_id")
        op.drop_column("media_files", "content_hash")

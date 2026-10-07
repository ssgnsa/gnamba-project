"""fusion des branches

Revision ID: 6c21cb4b996d
Revises: 018_add_entity_id_to_foncier, 021_add_app_settings_cols
Create Date: 2026-08-07 10:47:50.785548

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6c21cb4b996d'
down_revision: Union[str, Sequence[str], None] = ('018_add_entity_id_to_foncier', '021_add_app_settings_cols')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass

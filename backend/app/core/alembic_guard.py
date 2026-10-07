"""Mission-scoped database guard for the Immobilier V2 Alembic run."""

from sqlalchemy import text
from sqlalchemy.engine import Connection

from alembic.util import CommandError


def enforce_immo_v2_guard(connection: Connection, enabled: bool) -> None:
    """Allow only egs_test when the Immobilier V2 guard is explicitly enabled."""
    if not enabled:
        return
    database = connection.execute(text("SELECT current_database()")).scalar_one()
    if database != "egs_test":
        raise CommandError(
            "IMMOBILIER V2 GUARD: base interdite — seule egs_test est autorisée"
        )

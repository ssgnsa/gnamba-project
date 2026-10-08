"""Unit checks for the opt-in, mission-scoped Alembic DB guard."""
from unittest.mock import Mock

import pytest
from alembic.util import CommandError

from app.core.alembic_guard import enforce_immo_v2_guard


@pytest.mark.parametrize("database", ["egs_local", "egs_phase34_staging"])
def test_guard_refuses_excluded_database_without_migration(database):
    connection = Mock()
    connection.execute.return_value.scalar_one.return_value = database

    with pytest.raises(CommandError, match="seule egs_test est autorisée"):
        enforce_immo_v2_guard(connection, enabled=True)

    connection.execute.assert_called_once()


def test_guard_allows_egs_test():
    connection = Mock()
    connection.execute.return_value.scalar_one.return_value = "egs_test"
    enforce_immo_v2_guard(connection, enabled=True)
    connection.execute.assert_called_once()


def test_guard_is_inert_when_not_enabled():
    connection = Mock()
    enforce_immo_v2_guard(connection, enabled=False)
    connection.execute.assert_not_called()

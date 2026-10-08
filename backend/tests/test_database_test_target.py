import pytest

from conftest import _test_database_url


def test_default_backend_tests_ignore_untrusted_database_url(monkeypatch):
    monkeypatch.delenv("EGS_TEST_DATABASE_URL", raising=False)
    monkeypatch.setenv("DATABASE_URL", "postgresql://user@gnamba-server:5432/egs_local")

    assert _test_database_url() == "sqlite:///./_test_sqlite.db"


@pytest.mark.parametrize(
    "database_url",
    [
        "postgresql://user@gnamba-server:5432/egs_test",
        "postgresql://user@localhost:5432/egs_local",
        "postgresql://user@localhost:5432/egs_local_production",
    ],
)
def test_backend_tests_reject_non_test_postgresql_targets(monkeypatch, database_url):
    monkeypatch.setenv("EGS_TEST_DATABASE_URL", database_url)

    with pytest.raises(RuntimeError, match="must target SQLite or a loopback PostgreSQL"):
        _test_database_url()


def test_backend_tests_accept_loopback_test_database(monkeypatch):
    database_url = "postgresql://user@localhost:5432/egs_test"
    monkeypatch.setenv("EGS_TEST_DATABASE_URL", database_url)

    assert _test_database_url() == database_url

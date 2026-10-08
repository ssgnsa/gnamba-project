import pytest

from app import main
from app.core import migration_runner


class _Result:
    def scalar_one(self):
        return "032_immobilier_v2_contract"


class _DatabaseSession:
    def __init__(self):
        self.closed = False

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        self.close()

    def execute(self, _statement):
        return _Result()

    def close(self):
        self.closed = True


def test_readiness_requires_an_alembic_revision(monkeypatch):
    session = _DatabaseSession()
    monkeypatch.setattr(main, "SessionLocal", lambda: session)

    assert main.readiness() == {"status": "ready", "service": "egs-local-api"}
    assert session.closed


def test_startup_seed_failure_is_not_suppressed(monkeypatch):
    session = _DatabaseSession()

    def fail_seed(_session):
        raise RuntimeError("seed failed")

    monkeypatch.setattr(main, "SessionLocal", lambda: session)
    monkeypatch.setattr(main, "initialize_system_seed", fail_seed)

    with pytest.raises(RuntimeError, match="seed failed"):
        main.run_system_seed()
    assert session.closed


def test_migration_runner_requires_verified_backup_before_database_access(monkeypatch):
    monkeypatch.delenv("EGS_BACKUP_VERIFIED", raising=False)
    monkeypatch.setenv("EGS_MIGRATION_APPROVED", "1")
    monkeypatch.setenv("DATABASE_URL", "postgresql://egs_app@egs-postgres/egs_local")
    monkeypatch.setattr(
        migration_runner,
        "_verify_database",
        lambda _url: pytest.fail("database must not be accessed before backup approval"),
    )

    with pytest.raises(RuntimeError, match="EGS_BACKUP_VERIFIED"):
        migration_runner.main()


@pytest.mark.parametrize("backup_value", ["TRUE", "true", "yes", "OK", "HOLD"])
def test_migration_runner_rejects_noncanonical_backup_approval(monkeypatch, backup_value):
    monkeypatch.setenv("EGS_BACKUP_VERIFIED", backup_value)
    monkeypatch.setenv("EGS_MIGRATION_APPROVED", "1")
    monkeypatch.setenv("DATABASE_URL", "postgresql://egs_app@egs-postgres:5432/egs_local")
    monkeypatch.setattr(
        migration_runner,
        "_verify_database",
        lambda _url: pytest.fail("database must not be accessed for a noncanonical backup token"),
    )

    with pytest.raises(RuntimeError, match="EGS_BACKUP_VERIFIED=1"):
        migration_runner.main()


def test_migration_runner_requires_explicit_migration_approval(monkeypatch):
    monkeypatch.setenv("EGS_BACKUP_VERIFIED", "1")
    monkeypatch.delenv("EGS_MIGRATION_APPROVED", raising=False)
    monkeypatch.setenv("DATABASE_URL", "postgresql://egs_app@egs-postgres/egs_local")
    monkeypatch.setattr(
        migration_runner,
        "_verify_database",
        lambda _url: pytest.fail("database must not be accessed before migration approval"),
    )

    with pytest.raises(RuntimeError, match="EGS_MIGRATION_APPROVED"):
        migration_runner.main()


def test_initial_migration_runner_rejects_a_superuser(monkeypatch):
    class _RoleResult:
        def scalar_one(self):
            return True

    class _Connection:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def execute(self, _statement):
            return _RoleResult()

    class _Engine:
        def connect(self):
            return _Connection()

        def dispose(self):
            pass

    monkeypatch.setattr(migration_runner, "create_engine", lambda *_args, **_kwargs: _Engine())

    with pytest.raises(RuntimeError, match="superutilisateur"):
        migration_runner._verify_database("postgresql://postgres@egs-postgres:5432/egs_local")


def test_initial_migration_runner_rejects_existing_tables(monkeypatch):
    class _RoleResult:
        def scalar_one(self):
            return False

    class _TablesResult:
        def all(self):
            return [("public", "users")]

    class _Connection:
        def __init__(self):
            self.calls = 0

        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def execute(self, _statement):
            self.calls += 1
            return _RoleResult() if self.calls == 1 else _TablesResult()

    class _Engine:
        def __init__(self):
            self.connection = _Connection()

        def connect(self):
            return self.connection

        def dispose(self):
            pass

    monkeypatch.setenv("EGS_REQUIRE_EMPTY_DATABASE", "1")
    monkeypatch.setattr(migration_runner, "create_engine", lambda *_args, **_kwargs: _Engine())

    with pytest.raises(RuntimeError, match="base n'est pas vierge"):
        migration_runner._verify_database("postgresql://egs_app@egs-postgres:5432/egs_local")


def test_new_host_migration_rejects_production_database_before_connecting(monkeypatch):
    monkeypatch.setenv("EGS_DEPLOYMENT_TARGET", "new-host")
    monkeypatch.setenv("EGS_REQUIRE_EMPTY_DATABASE", "1")
    monkeypatch.setattr(
        migration_runner,
        "create_engine",
        lambda *_args, **_kwargs: pytest.fail("production database must not be contacted"),
    )

    with pytest.raises(RuntimeError, match="egs-postgres:5432/egs_local"):
        migration_runner._verify_database(
            "postgresql://egs_app@gnamba-server:5432/egs_local"
        )


def test_new_host_migration_requires_empty_database_gate(monkeypatch):
    monkeypatch.setenv("EGS_DEPLOYMENT_TARGET", "new-host")
    monkeypatch.delenv("EGS_REQUIRE_EMPTY_DATABASE", raising=False)
    monkeypatch.setenv("EGS_BACKUP_VERIFIED", "1")
    monkeypatch.setenv("EGS_MIGRATION_APPROVED", "1")
    monkeypatch.setenv(
        "DATABASE_URL", "postgresql://egs_app@egs-postgres:5432/egs_local"
    )
    monkeypatch.setattr(
        migration_runner,
        "_verify_database",
        lambda _url: pytest.fail("database must not be accessed without empty DB gate"),
    )

    with pytest.raises(RuntimeError, match="EGS_REQUIRE_EMPTY_DATABASE"):
        migration_runner.main()

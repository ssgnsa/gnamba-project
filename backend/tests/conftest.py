"""Pytest configuration for backend tests.

This conftest forces a local SQLite test database to allow running tests
without a PostgreSQL instance. It must set `DATABASE_URL` before importing
the application so `app.core.database` creates an engine bound to SQLite.
"""
import os
import secrets
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import inspect, text
from sqlalchemy.engine import make_url
from sqlalchemy.exc import ArgumentError


def _test_database_url() -> str:
    """Use SQLite by default; permit only explicit loopback PostgreSQL test DBs."""
    configured_url = os.environ.get("EGS_TEST_DATABASE_URL")
    if not configured_url:
        return "sqlite:///./_test_sqlite.db"

    try:
        url = make_url(configured_url)
    except ArgumentError as exc:
        raise RuntimeError("EGS_TEST_DATABASE_URL is not a valid SQLAlchemy URL") from exc

    if url.get_backend_name() == "sqlite":
        return configured_url

    if (
        url.get_backend_name() == "postgresql"
        and url.host in {"localhost", "127.0.0.1", "::1"}
        and url.database
        and url.database.endswith("_test")
    ):
        return configured_url

    raise RuntimeError(
        "EGS_TEST_DATABASE_URL must target SQLite or a loopback PostgreSQL "
        "database whose name ends in _test"
    )


# Never inherit an arbitrary DATABASE_URL (which may point at a live database).
os.environ["DATABASE_URL"] = _test_database_url()
os.environ.setdefault(
    "LOCAL_AUTH_SECRET",
    "test-only-local-auth-secret-012345678901234567890123456789",
)
os.environ["INITIAL_ADMIN_PASSWORD"] = secrets.token_urlsafe(24)

from app.main import app
from app.api import deps
from app.core.database import SessionLocal, engine, get_db, Base
from app.models.entity import Entity

# The models use PostgreSQL column types (UUID, INET, ARRAY). SQLite cannot
# render them natively, so map them onto storage-equivalent SQLite types when
# the suite provisions its own schema. PostgreSQL DDL is untouched.
from sqlalchemy import ARRAY
from sqlalchemy.dialects.postgresql import INET, UUID
from sqlalchemy.ext.compiler import compiles


@compiles(UUID, "sqlite")
def _compile_uuid_sqlite(type_, compiler, **kw):
    return "CHAR(36)"


@compiles(INET, "sqlite")
def _compile_inet_sqlite(type_, compiler, **kw):
    return "VARCHAR(45)"


@compiles(ARRAY, "sqlite")
def _compile_array_sqlite(type_, compiler, **kw):
    return "TEXT"


def _ensure_test_schema() -> None:
    """Provision SQLite locally; PostgreSQL tests must use the migrated schema."""
    if engine.dialect.name == "sqlite":
        Base.metadata.create_all(bind=engine, checkfirst=True)
        return

    if engine.dialect.name == "postgresql" and inspect(engine).has_table("alembic_version"):
        return

    raise RuntimeError(
        "PostgreSQL backend tests require an Alembic-migrated EGS_TEST_DATABASE_URL"
    )


_ensure_test_schema()


def _ensure_legacy_sqlite_property_columns() -> None:
    """Add only additive v2 columns to the disposable legacy SQLite fixture."""
    if engine.dialect.name != "sqlite":
        return
    inspector = inspect(engine)
    if not inspector.has_table("properties"):
        return
    additions = {
        "reference": "TEXT",
        "titre": "TEXT",
        "ville": "TEXT",
        "commune": "TEXT",
        "localite_statut": "TEXT DEFAULT 'HOLD'",
        "localite_preuve_reference": "TEXT",
        "localite_anstat_code": "TEXT",
        "localite_verifiee_le": "TIMESTAMP",
        "localite_verifiee_par": "TEXT",
        "quartier": "TEXT",
        "proprietaire": "TEXT",
        "proprietaire_entity_id": "TEXT",
        "charges_mensuelles": "NUMERIC",
        "publier_vitrine": "INTEGER DEFAULT 0",
        "titre_fige_le": "TIMESTAMP",
        "cover_image_url": "TEXT",
        "created_by": "TEXT",
        "updated_by": "TEXT",
        "deleted_at": "TIMESTAMP",
        "deleted_by": "TEXT",
    }
    existing = {column["name"] for column in inspector.get_columns("properties")}
    with engine.begin() as connection:
        for name, definition in additions.items():
            if name not in existing:
                connection.execute(text(f"ALTER TABLE properties ADD COLUMN {name} {definition}"))
                existing.add(name)


_ensure_legacy_sqlite_property_columns()


@pytest.fixture
def memory_repository():
    """Provide an in-memory user repository for tests."""
    return InMemoryUserRepository()


@pytest.fixture
def auth_service(memory_repository):
    """Provide an auth service with in-memory repository."""
    return AuthService(memory_repository)


@pytest.fixture
def test_client():
    """Provide an isolated authenticated client; auth denial tests use TestClient directly."""
    def override_current_user():
        return {
            "id": "00000000-0000-0000-0000-000000000001",
            "sub": "00000000-0000-0000-0000-000000000001",
            "role": "admin",
            "mfa_verified": True,
            "full_name": "Test Administrator",
        }

    app.dependency_overrides[deps.get_current_user] = override_current_user
    app.dependency_overrides[get_db] = lambda: None

    yield TestClient(app)

    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def clean_entities():
    """Clean entities only in an explicitly opted-in disposable test database."""
    if os.getenv("EGS_ALLOW_TEST_ENTITY_CLEANUP") != "1":
        return
    bind = SessionLocal.kw.get("bind")
    if bind is None:
        # SessionLocal normally uses the engine configured by the application;
        # refuse cleanup when its target cannot be positively identified.
        return
    database_name = getattr(getattr(bind, "url", None), "database", None)
    disposable_sqlite = database_name == "./_test_sqlite.db"
    if not database_name or not (database_name.endswith("_test") or disposable_sqlite):
        return
    db = SessionLocal()
    try:
        # Clean test data - try delete, but if table/schema doesn't exist, ignore
        try:
            db.query(Entity).delete()
            db.commit()
        except Exception:
            db.rollback()
    finally:
        db.close()

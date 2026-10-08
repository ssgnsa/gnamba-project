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

# Force a local sqlite DB for tests to run isolated from Postgres
os.environ.setdefault("DATABASE_URL", "sqlite:///./_test_sqlite.db")
os.environ.setdefault(
    "LOCAL_AUTH_SECRET",
    "test-only-local-auth-secret-012345678901234567890123456789",
)
os.environ["INITIAL_ADMIN_PASSWORD"] = secrets.token_urlsafe(24)

from app.main import app
from app.api import deps
from app.core.database import SessionLocal, engine, get_db
from app.models.entity import Entity
from app.models.user import AuthPasswordResetToken, AuthRateLimitEvent


def _ensure_sqlite_model_tables() -> None:
    """Complete only the auth tables added by the latest migration.

    Production schema changes remain Alembic-only. Tests use a persistent
    SQLite file for speed, so older local fixtures may not contain the latest
    auth lifecycle tables.
    """
    if engine.dialect.name == "sqlite":
        inspector = inspect(engine)
        for model in (AuthPasswordResetToken, AuthRateLimitEvent):
            if not inspector.has_table(model.__tablename__):
                model.__table__.create(bind=engine)


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


_ensure_sqlite_model_tables()
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

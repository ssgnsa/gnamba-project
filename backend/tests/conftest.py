"""Pytest configuration for backend tests.

This conftest forces a local SQLite test database to allow running tests
without a PostgreSQL instance. It must set `DATABASE_URL` before importing
the application so `app.core.database` creates an engine bound to SQLite.
"""
import os
import pytest
from fastapi.testclient import TestClient

# Force a local sqlite DB for tests to run isolated from Postgres
os.environ.setdefault("DATABASE_URL", "sqlite:///./_test_sqlite.db")

from app.main import app
from app.repositories.user_repository import InMemoryUserRepository
from app.services.auth_service import AuthService
from app.api import deps
from app.core.database import SessionLocal
from app.models.entity import Entity


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
    """Provide a test client with mocked dependencies."""
    # Override the dependency to use in-memory repository for tests
    def override_get_user_repository():
        return InMemoryUserRepository()

    def override_get_auth_service(user_repo=pytest.fixture(override_get_user_repository)):
        return AuthService(user_repo)

    app.dependency_overrides[deps.get_user_repository] = override_get_user_repository
    app.dependency_overrides[deps.get_auth_service] = override_get_auth_service

    yield TestClient(app)

    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def clean_entities():
    """Clean entities table before each test."""
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

"""Pytest configuration for backend tests."""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.repositories.user_repository import InMemoryUserRepository
from backend.app.services.auth_service import AuthService
from backend.app.api import deps


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

from fastapi.testclient import TestClient
import pytest
from uuid import uuid4

from app.api import deps

from app.main import app


client = TestClient(app)


@pytest.fixture(autouse=True)
def admin_context():
    app.dependency_overrides[deps.get_current_user] = lambda: {"id": "test-admin", "role": "admin", "mfa_verified": True}
    app.dependency_overrides[deps.get_optional_current_user] = lambda: {"id": "test-admin", "role": "admin", "mfa_verified": True}
    yield
    app.dependency_overrides.clear()


def test_projects_crud_flow():
    create_response = client.post(
        "/api/v1/projects",
        json={"nom": "Projet Alpha", "description": "Alpha", "statut": "planifie"},
    )
    assert create_response.status_code == 200, create_response.text
    payload = create_response.json()
    assert payload["nom"] == "Projet Alpha"

    list_response = client.get("/api/v1/projects")
    assert list_response.status_code == 200
    assert any(item["id"] == payload["id"] for item in list_response.json())


def test_employees_crud_flow():
    suffix = uuid4().hex[:8]
    email = f"amadou-{suffix}@example.com"
    create_response = client.post(
        "/api/v1/employees",
        json={"nom": "Diop", "prenom": "Amadou", "poste": "Ingénieur", "email": email},
    )
    assert create_response.status_code == 200, create_response.text
    payload = create_response.json()
    assert payload["email"] == email

    list_response = client.get("/api/v1/employees")
    assert list_response.status_code == 200
    assert any(item["id"] == payload["id"] for item in list_response.json())

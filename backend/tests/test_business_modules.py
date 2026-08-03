from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


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
    create_response = client.post(
        "/api/v1/employees",
        json={"nom": "Diop", "prenom": "Amadou", "poste": "Ingénieur", "email": "amadou@example.com"},
    )
    assert create_response.status_code == 200, create_response.text
    payload = create_response.json()
    assert payload["email"] == "amadou@example.com"

    list_response = client.get("/api/v1/employees")
    assert list_response.status_code == 200
    assert any(item["id"] == payload["id"] for item in list_response.json())

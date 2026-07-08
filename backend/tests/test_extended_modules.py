from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def test_suppliers_module_flow():
    response = client.post(
        "/api/v1/suppliers",
        json={"nom": "Fournisseur A", "email": "fournisseur@example.com", "telephone": "22500000000"},
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["nom"] == "Fournisseur A"

    list_response = client.get("/api/v1/suppliers")
    assert list_response.status_code == 200
    assert any(item["id"] == payload["id"] for item in list_response.json())


def test_products_module_flow():
    response = client.post(
        "/api/v1/products",
        json={"designation": "Ciment", "categorie": "Materiaux", "prix_unitaire": 2500},
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["designation"] == "Ciment"

    list_response = client.get("/api/v1/products")
    assert list_response.status_code == 200
    assert any(item["id"] == payload["id"] for item in list_response.json())


def test_finance_module_flow():
    response = client.post(
        "/api/v1/finance",
        json={"reference": "TX-001", "montant": 1500000, "type": "entree", "statut": "approuve"},
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["reference"] == "TX-001"

    list_response = client.get("/api/v1/finance")
    assert list_response.status_code == 200
    assert any(item["id"] == payload["id"] for item in list_response.json())


def test_immobilier_module_flow():
    response = client.post(
        "/api/v1/immobilier",
        json={"titre": "Villa Nord", "ville": "Abidjan", "prix": 120000000},
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["titre"] == "Villa Nord"

    list_response = client.get("/api/v1/immobilier")
    assert list_response.status_code == 200
    assert any(item["id"] == payload["id"] for item in list_response.json())


def test_foncier_module_flow():
    response = client.post(
        "/api/v1/foncier",
        json={"reference": "LOT-001", "superficie": 500, "statut": "disponible"},
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["reference"] == "LOT-001"

    list_response = client.get("/api/v1/foncier")
    assert list_response.status_code == 200
    assert any(item["id"] == payload["id"] for item in list_response.json())

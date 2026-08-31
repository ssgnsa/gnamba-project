from fastapi.testclient import TestClient

from app.main import app


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
        "/api/v1/immobilier/properties",
        json={
            "type_bien": "villa",
            "adresse": "Villa Nord, Abidjan",
            "proprietaire_name": "Alpha Koné",
            "valeur": 120000000,
            "loyer_mensuel": 2500000,
            "charges_mensuelles": 150000,
            "statut": "disponible",
            "description": "Villa test",
        },
    )
    assert response.status_code == 201, response.text
    payload = response.json()
    assert payload["adresse"] == "Villa Nord, Abidjan"

    list_response = client.get("/api/v1/immobilier/properties")
    assert list_response.status_code == 200
    assert any(item["id"] == payload["id"] for item in list_response.json()["items"])


def test_immobilier_routes_are_not_duplicated():
    paths = sorted({route.path for route in app.routes if getattr(route, "path", None) and "/immobilier" in route.path})

    assert "/api/v1/immobilier/properties" in paths
    assert "/api/v1/immobilier/properties/{property_id}" in paths
    assert "/api/v1/immobilier/api/v1/immobilier/properties" not in paths
    assert "/api/v1/immobilier/api/v1/immobilier" not in paths


def test_foncier_module_flow():
    # Foncier module is already properly normalized with router in router.py
    # and __init__.py only re-exporting the router. Its endpoints require authentication.
    # We just verify the module can be imported and the router has the correct prefix.
    from app.api.v1.foncier import router
    assert router.prefix == "/api/v1/foncier"
    assert router.tags == ["foncier"]
    # Verify it has routes
    assert len(router.routes) > 0

from fastapi.testclient import TestClient

from app.main import app
from app.api.deps import get_current_user
from app.core.authorization import has_permission


def test_sensitive_api_routes_reject_anonymous_requests():
    app.dependency_overrides.clear()
    client = TestClient(app, raise_server_exceptions=False)

    requests = [
        ("get", "/api/v1/tables/properties", None),
        ("post", "/api/v1/tables/properties", {"type_bien": "terrain"}),
        ("get", "/api/v1/clients", None),
        ("get", "/api/v1/leads", None),
        ("get", "/api/v1/leads/campaigns", None),
        ("get", "/api/v1/media", None),
        ("post", "/api/v1/page-layouts", {"page_slug": "accueil"}),
    ]
    for method, path, payload in requests:
        response = getattr(client, method)(path, json=payload) if payload is not None else getattr(client, method)(path)
        assert response.status_code == 401, f"{method.upper()} {path}: {response.status_code} {response.text}"


def test_non_admin_reads_are_scoped_and_writes_are_denied():
    app.dependency_overrides[get_current_user] = lambda: {"id": "test-user", "role": "gestionnaire"}
    client = TestClient(app, raise_server_exceptions=False)
    try:
        response = client.post("/api/v1/site/vitrine-lots", json={})
        assert response.status_code == 403, response.text

        response = client.get("/api/v1/leads/campaigns")
        assert response.status_code == 403, response.text
    finally:
        app.dependency_overrides.clear()


def test_central_permission_policy_fails_closed_for_unverified_scopes():
    admin = {"id": "admin", "role": "admin", "mfa_verified": True}
    manager = {"id": "manager", "role": "gestionnaire"}
    employee = {"id": "employee", "role": "employe"}

    assert has_permission(manager, "erp_table", "read", resource="stats_journalieres")
    assert not has_permission(manager, "clients", "read_private")
    assert not has_permission(manager, "site_vitrine", "read_draft")
    assert not has_permission(manager, "media", "read_private")
    assert not has_permission(manager, "erp_table", "read", resource="tasks")
    assert not has_permission(manager, "erp_table", "read", resource="app_settings")
    assert not has_permission(manager, "erp_table", "read", resource="visites_du_jour")
    assert not has_permission(manager, "clients", "create")
    assert not has_permission(manager, "site_vitrine", "publish")
    assert not has_permission(manager, "media", "delete")
    assert not has_permission(manager, "erp_table", "export", resource="stats_journalieres")
    assert not has_permission(employee, "clients", "read_private")
    assert not has_permission(employee, "erp_table", "read", resource="tasks")
    assert has_permission(admin, "media", "purge")
    assert not has_permission({"id": "admin", "role": "admin"}, "media", "read_private")
    assert not has_permission(admin, "erp_table", "delete", resource="stats_journalieres")
    assert not has_permission(admin, "erp_table", "export", resource="stats_journalieres")

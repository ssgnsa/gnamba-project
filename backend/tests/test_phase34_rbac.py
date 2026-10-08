from app.core.authorization import has_permission
from fastapi.testclient import TestClient

from app.api.deps import get_current_user, get_optional_current_user
from app.main import app
from app.schemas.entity import EntityResponse


def test_tables_allowlist_is_limited_to_verified_non_personal_aggregate():
    manager = {"id": "manager", "role": "gestionnaire"}
    admin = {"id": "admin", "role": "admin", "mfa_verified": True}
    employee = {"id": "employee", "role": "employe"}

    for role in (manager, admin):
        assert has_permission(role, "erp_table", "read", resource="stats_journalieres")
        assert not has_permission(role, "erp_table", "read", resource="visites_du_jour")
        assert not has_permission(role, "erp_table", "read", resource="tasks")

    assert not has_permission(employee, "erp_table", "read", resource="stats_journalieres")
    assert not has_permission(None, "erp_table", "read", resource="stats_journalieres")


def test_generic_tables_are_read_only_for_every_role():
    for user in (
        {"id": "admin", "role": "admin"},
        {"id": "manager", "role": "gestionnaire"},
        {"id": "employee", "role": "employe"},
    ):
        for action in ("create", "update", "delete", "publish", "unpublish", "export"):
            assert not has_permission(user, "erp_table", action, resource="stats_journalieres")


def test_unverified_manager_scopes_fail_closed():
    manager = {"id": "manager", "role": "gestionnaire"}

    for module in ("clients", "site_vitrine", "media", "immobilier", "foncier", "leads"):
        assert not has_permission(manager, module, "read_private")
        assert not has_permission(manager, module, "create")


def test_cni_fields_are_masked_in_entity_api_responses():
    entity = EntityResponse(
        id="entity-1",
        type="client",
        created_at="2026-09-28T00:00:00Z",
        updated_at="2026-09-28T00:00:00Z",
        id_document_type="cni",
        id_document_number="CI123456",
        id_document_place="Abidjan",
    )

    response = entity.model_dump()
    assert response["id_document_type"] is None
    assert response["id_document_number"] is None
    assert response["id_document_place"] is None


def test_table_routes_reject_unlisted_reads_and_all_writes():
    client = TestClient(app, raise_server_exceptions=False)
    app.dependency_overrides[get_current_user] = lambda: {
        "id": "manager",
        "role": "gestionnaire",
    }
    try:
        assert client.get("/api/v1/tables/visites_du_jour").status_code == 403
        assert client.get("/api/v1/tables/tasks").status_code == 403

        app.dependency_overrides[get_current_user] = lambda: {
            "id": "admin",
            "role": "admin",
            "mfa_verified": True,
        }
        app.dependency_overrides[get_optional_current_user] = lambda: {
            "id": "admin",
            "role": "admin",
            "mfa_verified": True,
        }
        assert client.post("/api/v1/tables/stats_journalieres", json={}).status_code == 403
        assert client.patch("/api/v1/tables/stats_journalieres/1", json={}).status_code == 403
        assert client.delete("/api/v1/tables/stats_journalieres/1").status_code == 403
    finally:
        app.dependency_overrides.clear()


def test_private_routes_reject_non_admin_until_scopes_are_verified():
    paths = (
        "/api/v1/tasks",
        "/api/v1/immobilier/properties",
        "/api/v1/immobilier/contracts",
        "/api/v1/immobilier/payments",
        "/api/v1/employees",
        "/api/v1/entities",
        "/api/v1/tenants",
        "/api/v1/finance",
        "/api/v1/dashboard",
        "/api/v1/settings",
    )
    client = TestClient(app, raise_server_exceptions=False)
    app.dependency_overrides[get_current_user] = lambda: {
        "id": "employee",
        "role": "employe",
    }
    try:
        for path in paths:
            response = client.get(path)
            assert response.status_code == 403, f"{path}: {response.status_code} {response.text}"
    finally:
        app.dependency_overrides.clear()

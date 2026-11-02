import pytest
from app.core.authorization import has_permission
from fastapi.testclient import TestClient

from app.api import deps
from app.api.deps import get_current_user, get_optional_current_user
from app.main import app
from app.schemas.entity import EntityResponse


class _FakeAuthService:
    def requires_mfa(self, _user):
        return False

    def get_current_user(self, _authorization):
        return None


def _fake_auth_service():
    return _FakeAuthService()


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
    from unittest.mock import MagicMock

    from fastapi import HTTPException

    request = MagicMock()
    request.method = "GET"

    fake_auth = _FakeAuthService()
    employee = {"id": "employee", "role": "employe"}
    admin = {"id": "admin", "role": "admin", "mfa_verified": True}

    # Non-admin should be rejected
    with pytest.raises(HTTPException) as exc:
        deps.require_admin_user(request, employee, fake_auth)
    assert exc.value.status_code == 403

    # Admin with MFA verified should pass
    result = deps.require_admin_user(request, admin, fake_auth)
    assert result == admin

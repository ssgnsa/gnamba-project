from fastapi.testclient import TestClient
from fastapi import HTTPException
from importlib import import_module
from uuid import UUID

from app.api import deps
from app.main import app
foncier_router = import_module("app.api.v1.foncier.router")


def test_private_foncier_reads_and_rpc_reject_anonymous_requests():
    client = TestClient(app)

    for path in (
        "/api/v1/foncier/villages",
        "/api/v1/foncier/lots",
        "/api/v1/foncier/attestations/verify/ATT-TEST",
    ):
        response = client.get(path)
        assert response.status_code == 401, (path, response.status_code)

    response = client.post(
        "/api/v1/rpc/log_foncier_audit",
        json={"p_lot_id": "00000000-0000-0000-0000-000000000001", "p_action": "test"},
    )
    assert response.status_code == 401


def test_foncier_policy_rejects_unapproved_authenticated_roles():
    app.dependency_overrides[deps.get_current_user] = lambda: {
        "id": "00000000-0000-0000-0000-000000000002",
        "sub": "00000000-0000-0000-0000-000000000002",
        "role": "gestionnaire",
        "full_name": "Test Manager",
    }
    try:
        response = TestClient(app).get("/api/v1/foncier/villages")
        assert response.status_code == 403
    finally:
        app.dependency_overrides.pop(deps.get_current_user, None)


def test_foncier_archival_endpoints_never_physically_delete(monkeypatch):
    class ExistingRepository:
        def get(self, _row_id):
            return object()

    class ExistingService:
        repo = ExistingRepository()

    monkeypatch.setattr(foncier_router, "get_lotissement_service", lambda _db: ExistingService())
    monkeypatch.setattr(foncier_router, "get_ilot_service", lambda _db: ExistingService())
    entity_id = UUID("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")

    for delete_call in (
        lambda: foncier_router.delete_lotissement(entity_id, db=None),
        lambda: foncier_router.delete_ilot(entity_id, db=None),
    ):
        try:
            delete_call()
        except HTTPException as error:
            assert error.status_code == 409
            assert "Suppression physique désactivée" in error.detail
        else:
            raise AssertionError("Physical deletion should be rejected")


def test_foncier_villages_are_not_exposed_through_generic_table_api(test_client):
    app.dependency_overrides[deps.get_optional_current_user] = lambda: {
        "id": "00000000-0000-0000-0000-000000000001",
        "sub": "00000000-0000-0000-0000-000000000001",
        "role": "admin",
        "mfa_verified": True,
    }
    try:
        response = test_client.get("/api/v1/tables/foncier_villages")
        assert response.status_code == 404
    finally:
        app.dependency_overrides.pop(deps.get_optional_current_user, None)

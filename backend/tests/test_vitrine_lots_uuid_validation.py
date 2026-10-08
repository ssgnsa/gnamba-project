from __future__ import annotations

import importlib
from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.api import deps
from app.main import app

site_router = importlib.import_module("app.api.v1.site.router")
tables_router = importlib.import_module("app.api.v1.tables.router")


VALID_UUID = "550e8400-e29b-41d4-a716-446655440000"
INVALID_UUIDS = ("not-a-uuid", "123", "abc", "")


@pytest.fixture
def api_client():
    app.dependency_overrides.clear()
    current_user = lambda: {
        "id": "test-admin",
        "role": "admin",
        "mfa_verified": True,
    }
    app.dependency_overrides[deps.get_current_user] = current_user
    app.dependency_overrides[deps.get_optional_current_user] = current_user
    try:
        yield TestClient(app, raise_server_exceptions=False)
    finally:
        app.dependency_overrides.clear()


def inquiry_payload(lot_id: str) -> dict[str, str]:
    return {
        "lot_id": lot_id,
        "reference": "LOT-1",
        "email": "client@example.test",
        "telephone": "000000000",
        "nom": "Client",
        "prenom": "Test",
        "message": "Demande de renseignements",
    }


@pytest.mark.parametrize("field_name", ("id", "lot_id", "property_id"))
def test_vitrine_lot_dto_accepts_valid_uuid_string(field_name: str) -> None:
    dto = site_router.VitrineLotRow(**{field_name: VALID_UUID})
    value = getattr(dto, field_name)

    assert isinstance(value, UUID)
    assert str(value) == VALID_UUID
    assert VALID_UUID in dto.model_dump_json()


@pytest.mark.parametrize("field_name", ("id", "lot_id", "property_id"))
@pytest.mark.parametrize("value", INVALID_UUIDS)
def test_vitrine_lot_dto_rejects_invalid_uuid(field_name: str, value: str) -> None:
    with pytest.raises(ValidationError):
        site_router.VitrineLotRow(**{field_name: value})


@pytest.mark.parametrize("value", INVALID_UUIDS)
def test_public_lot_inquiry_rejects_invalid_lot_id(value: str) -> None:
    with pytest.raises(ValidationError):
        site_router.PublicLotInquiry(**inquiry_payload(value))


@pytest.mark.parametrize("method", ("get", "patch", "delete"))
def test_site_lot_id_routes_reject_invalid_path_before_sql(
    api_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    method: str,
) -> None:
    def forbidden_session():
        pytest.fail("La route a ouvert une session pour un UUID invalide")

    monkeypatch.setattr(site_router, "SessionLocal", forbidden_session)
    path = "/api/v1/site/vitrine-lots/not-a-uuid"
    if method == "patch":
        response = api_client.patch(path, json={})
    else:
        response = getattr(api_client, method)(path)

    assert response.status_code == 422


def test_site_lot_route_accepts_valid_uuid_string(
    api_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    executed_params: list[dict | None] = []

    class Result:
        def fetchone(self):
            return None

    class Session:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def execute(self, _statement, params=None):
            executed_params.append(params)
            return Result()

    monkeypatch.setattr(site_router, "SessionLocal", Session)
    response = api_client.get(f"/api/v1/site/vitrine-lots/{VALID_UUID}")

    assert response.status_code == 404
    assert executed_params == [{"item_id": VALID_UUID}]


@pytest.mark.parametrize("field_name", ("id", "lot_id", "property_id"))
@pytest.mark.parametrize("value", INVALID_UUIDS)
def test_site_lot_write_rejects_invalid_body_uuid_before_sql(
    api_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    field_name: str,
    value: str,
) -> None:
    def forbidden_session():
        pytest.fail("La route a ouvert une session pour un UUID invalide")

    monkeypatch.setattr(site_router, "SessionLocal", forbidden_session)
    response = api_client.post(
        "/api/v1/site/vitrine-lots",
        json={field_name: value},
    )

    assert response.status_code == 422


def test_inquiry_rejects_invalid_lot_id_before_sql(
    api_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    class Session:
        def execute(self, *_args, **_kwargs):
            pytest.fail("La demande a exécuté du SQL avec un UUID invalide")

    monkeypatch.setattr(site_router, "get_db", lambda: Session())
    response = api_client.post(
        "/api/v1/site/vitrine-lot-inquiries",
        json=inquiry_payload("not-a-uuid"),
    )

    assert response.status_code == 422


@pytest.mark.parametrize("method", ("patch", "delete"))
def test_generic_table_mutations_are_denied_before_repository(
    api_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    method: str,
) -> None:
    def forbidden_repository(*_args, **_kwargs):
        pytest.fail("Le dépôt générique a été appelé pour un UUID invalide")

    monkeypatch.setattr(tables_router, "_repository", forbidden_repository)
    path = "/api/v1/tables/vitrine_lots/not-a-uuid"
    if method == "patch":
        response = api_client.patch(path, json={})
    else:
        response = getattr(api_client, method)(path)

    assert response.status_code == 403


@pytest.mark.parametrize("field_name", ("id", "lot_id", "property_id"))
@pytest.mark.parametrize("value", INVALID_UUIDS)
def test_generic_table_create_is_denied_before_repository(
    api_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    field_name: str,
    value: str,
) -> None:
    def forbidden_repository(*_args, **_kwargs):
        pytest.fail("Le dépôt générique a été appelé pour un UUID invalide")

    monkeypatch.setattr(tables_router, "_repository", forbidden_repository)
    response = api_client.post(
        "/api/v1/tables/vitrine_lots",
        json={field_name: value},
    )

    assert response.status_code == 403


@pytest.mark.parametrize("field_name", ("id", "lot_id", "property_id"))
@pytest.mark.parametrize("value", INVALID_UUIDS)
def test_generic_table_update_is_denied_before_repository(
    api_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    field_name: str,
    value: str,
) -> None:
    def forbidden_repository(*_args, **_kwargs):
        pytest.fail("Le dépôt générique a été appelé pour un UUID invalide")

    monkeypatch.setattr(tables_router, "_repository", forbidden_repository)
    response = api_client.patch(
        f"/api/v1/tables/vitrine_lots/{VALID_UUID}",
        json={field_name: value},
    )

    assert response.status_code == 403


def test_generic_table_update_is_denied_even_for_valid_uuid(
    api_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    captured: list[str] = []

    class Repository:
        def update(self, row_id, _payload):
            captured.append(row_id)
            return {"id": row_id}

    monkeypatch.setattr(tables_router, "_repository", lambda *_args: Repository())
    response = api_client.patch(
        f"/api/v1/tables/vitrine_lots/{VALID_UUID.upper()}",
        json={},
    )

    assert response.status_code == 403
    assert captured == []

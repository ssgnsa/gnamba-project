from __future__ import annotations

from pathlib import Path

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.api.deps import get_current_user, get_db, get_optional_current_user
from app.main import app
from app.services.storage_provider import LocalStorageProvider, get_storage_provider


class _ScalarResult:
    def __init__(self, value: bool):
        self.value = value

    def scalar(self) -> bool:
        return self.value


class _PublicAssetDb:
    def __init__(self, is_public: bool):
        self.is_public = is_public

    def execute(self, *_args, **_kwargs) -> _ScalarResult:
        return _ScalarResult(self.is_public)


@pytest.fixture
def storage_client(tmp_path: Path):
    previous_overrides = app.dependency_overrides.copy()
    state: dict[str, object] = {"user": None, "is_public": False}
    storage_root = tmp_path / "uploads"
    (storage_root / "private").mkdir(parents=True)
    (storage_root / "private" / "record.pdf").write_bytes(b"private document")
    (storage_root / "public").mkdir()
    (storage_root / "public" / "logo.webp").write_bytes(b"public image")

    def current_user():
        user = state["user"]
        if user is None:
            raise HTTPException(status_code=401, detail="Authentification requise")
        return user

    app.dependency_overrides[get_current_user] = current_user
    app.dependency_overrides[get_optional_current_user] = lambda: state["user"]
    app.dependency_overrides[get_db] = lambda: _PublicAssetDb(bool(state["is_public"]))
    app.dependency_overrides[get_storage_provider] = lambda: LocalStorageProvider(str(storage_root))

    yield TestClient(app), state, storage_root

    app.dependency_overrides.clear()
    app.dependency_overrides.update(previous_overrides)


def test_private_storage_requires_authentication(storage_client) -> None:
    client, _state, _root = storage_client

    response = client.get("/storage/private/record.pdf")

    assert response.status_code == 401


def test_private_storage_requires_media_read_permission(storage_client) -> None:
    client, state, _root = storage_client
    state["user"] = {"id": "employee-1", "role": "employe"}

    response = client.get("/storage/private/record.pdf")

    assert response.status_code == 403


def test_authorized_media_user_can_read_private_file(storage_client) -> None:
    client, state, _root = storage_client
    state["user"] = {"id": "manager-1", "role": "gestionnaire"}

    response = client.get("/storage/private/record.pdf")

    assert response.status_code == 200
    assert response.content == b"private document"
    assert response.headers["cache-control"] == "private, no-store"


def test_publicly_referenced_asset_remains_anonymous(storage_client) -> None:
    client, state, _root = storage_client
    state["is_public"] = True

    response = client.get("/storage/public/logo.webp")

    assert response.status_code == 200
    assert response.content == b"public image"
    assert response.headers["content-type"] == "image/webp"


def test_missing_private_file_is_not_found_for_authorized_user(storage_client) -> None:
    client, state, _root = storage_client
    state["user"] = {"id": "admin-1", "role": "admin"}

    response = client.get("/storage/private/missing.pdf")

    assert response.status_code == 404


def test_private_file_api_requires_authentication(storage_client) -> None:
    client, _state, _root = storage_client

    response = client.get("/api/v1/storage/files/private/record.pdf")

    assert response.status_code == 401


def test_private_file_api_requires_media_read_permission(storage_client) -> None:
    client, state, _root = storage_client
    state["user"] = {"id": "employee-1", "role": "employe"}

    response = client.get("/api/v1/storage/files/private/record.pdf")

    assert response.status_code == 403


def test_private_file_api_serves_file_to_authorized_media_user(storage_client) -> None:
    client, state, _root = storage_client
    state["user"] = {"id": "manager-1", "role": "gestionnaire"}

    response = client.get("/api/v1/storage/files/private/record.pdf")

    assert response.status_code == 200
    assert response.content == b"private document"
    assert response.headers["cache-control"] == "private, no-store"


@pytest.mark.parametrize(
    "storage_key",
    [
        "../outside.txt",
        "..\\outside.txt",
        "/etc/passwd",
        "C:\\Windows\\win.ini",
    ],
)
def test_storage_provider_rejects_traversal_and_absolute_paths(
    tmp_path: Path, storage_key: str
) -> None:
    provider = LocalStorageProvider(str(tmp_path / "uploads"))

    with pytest.raises(ValueError):
        provider.resolve_path(storage_key)


def test_encoded_traversal_cannot_escape_storage(storage_client) -> None:
    client, state, root = storage_client
    state["user"] = {"id": "admin-1", "role": "admin"}
    outside_file = root.parent / "outside.txt"
    outside_file.write_text("outside storage")

    response = client.get("/storage/%2E%2E%2Foutside.txt")

    assert response.status_code in {400, 404}
    assert response.content != b"outside storage"


def test_symlink_cannot_escape_storage(tmp_path: Path) -> None:
    root = tmp_path / "uploads"
    root.mkdir()
    outside_file = tmp_path / "outside.txt"
    outside_file.write_text("outside storage")
    (root / "escape.txt").symlink_to(outside_file)
    provider = LocalStorageProvider(str(root))

    with pytest.raises(ValueError):
        provider.resolve_path("escape.txt")

from pathlib import Path

from app.core.config import settings
from app.main import app
from app.services.storage_provider import LocalStorageProvider


def test_storage_mount_and_provider_share_configured_root() -> None:
    expected = settings.STORAGE_ROOT
    assert expected.parts[-3:] == ("backend", "storage", "uploads")

    storage_route = next(
        route for route in app.routes
        if getattr(route, "path", None) == "/storage/{storage_key:path}"
    )
    assert storage_route.endpoint.__name__ == "serve_storage_file"
    assert LocalStorageProvider().storage_root == expected


def test_default_storage_root_does_not_depend_on_current_directory(
    tmp_path: Path, monkeypatch
) -> None:
    expected = settings.STORAGE_ROOT
    monkeypatch.chdir(tmp_path)

    assert LocalStorageProvider().storage_root == expected


def test_local_provider_writes_under_its_configured_root(tmp_path: Path) -> None:
    storage_root = tmp_path / "uploads"
    provider = LocalStorageProvider(storage_root=str(storage_root))

    result = provider.upload_bytes("autre/probe.txt", b"storage probe", "text/plain")

    stored_file = storage_root / "autre" / "probe.txt"
    assert Path(result["path"]) == stored_file
    assert stored_file.read_bytes() == b"storage probe"

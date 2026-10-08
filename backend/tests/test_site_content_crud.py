from __future__ import annotations

import importlib

from fastapi.testclient import TestClient

from app.main import app
from app.api.deps import get_current_user


def test_site_content_writes_require_admin(monkeypatch) -> None:
    site_content_module = importlib.import_module("app.api.v1.site_content.router")

    calls: list[tuple[str, dict | None]] = []

    class FakeSession:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def execute(self, statement, params=None):
            calls.append((str(statement), params))

        def commit(self):
            calls.append(("COMMIT", None))

    monkeypatch.setattr(site_content_module, "SessionLocal", FakeSession)
    client = TestClient(app, raise_server_exceptions=False)
    payload = {"section": "hero", "key": "security_test", "value": "Valeur"}

    writes = [
        ("post", "/api/site-content", payload),
        ("patch", "/api/site-content/1", payload),
        ("delete", "/api/site-content/1", None),
    ]
    try:
        # Anonymous calls are rejected before a database session is opened.
        for method, path, body in writes:
            response = getattr(client, method)(path, json=body) if body else getattr(client, method)(path)
            assert response.status_code == 401, response.text
        assert calls == []

        # An authenticated non-admin is denied by the same server dependency.
        app.dependency_overrides[get_current_user] = lambda: {"id": "test-user", "role": "gestionnaire"}
        for method, path, body in writes:
            response = getattr(client, method)(path, json=body) if body else getattr(client, method)(path)
            assert response.status_code == 403, response.text
        assert calls == []

        # An authorized admin reaches the write path and commits.
        app.dependency_overrides[get_current_user] = lambda: {
            "id": "test-admin",
            "role": "admin",
            "mfa_verified": True,
        }
        response = client.post("/api/site-content", json=payload)
        assert response.status_code == 200, response.text
        assert response.json()["status"] == "ok"
        assert any(sql == "COMMIT" for sql, _ in calls)
    finally:
        app.dependency_overrides.clear()


def test_site_content_public_read_remains_available(monkeypatch) -> None:
    site_content_module = importlib.import_module("app.api.v1.site_content.router")

    class FakeResult:
        def fetchall(self):
            return [("hero", "title", "Site public")]

    class FakeSession:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def execute(self, *_args, **_kwargs):
            return FakeResult()

    monkeypatch.setattr(site_content_module, "SessionLocal", FakeSession)
    app.dependency_overrides.clear()
    response = TestClient(app).get("/api/site-content")
    assert response.status_code == 200
    assert response.json() == [{"section": "hero", "key": "title", "value": "Site public"}]

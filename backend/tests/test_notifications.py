import os
import json
import pytest
from fastapi.testclient import TestClient

from app.main import app


def override_get_current_user():
    return {"id": "test", "role": "admin"}


@pytest.fixture(autouse=True)
def _override_deps(monkeypatch):
    from app.api.deps import get_current_user
    monkeypatch.setattr(get_current_user, "__call__", lambda: override_get_current_user())


class DummyResp:
    def __init__(self, ok=True, text="ok", status_code=200):
        self.ok = ok
        self.text = text
        self.status_code = status_code


def test_callmebot_send(monkeypatch):
    # Override auth dependency to simulate an authenticated admin
    from app.api import deps
    app.dependency_overrides[deps.get_current_user] = lambda: {"id": "test", "role": "admin"}
    client = TestClient(app)

    def fake_get(self, url, params=None, timeout=None):
        assert "callmebot" in url
        return DummyResp(ok=True, text="sent")

    monkeypatch.setenv("WHATSAPP_PROVIDER", "callmebot")
    monkeypatch.setenv("CALLMEBOT_API_KEY", "testkey")
    monkeypatch.setattr("requests.Session.get", fake_get)

    resp = client.post("/api/v1/notifications/whatsapp/send", json={"to": "+22512345678", "message": "hello"})
    assert resp.status_code == 200
    assert resp.json().get("status") == "ok"


def test_twilio_send(monkeypatch):
    # Override auth dependency to simulate an authenticated admin
    from app.api import deps
    app.dependency_overrides[deps.get_current_user] = lambda: {"id": "test", "role": "admin"}
    client = TestClient(app)

    def fake_post(self, url, data=None, auth=None, timeout=None):
        assert "twilio" in url
        return DummyResp(ok=True, text="twilio ok")

    monkeypatch.setenv("WHATSAPP_PROVIDER", "twilio")
    monkeypatch.setenv("TWILIO_ACCOUNT_SID", "sid")
    monkeypatch.setenv("TWILIO_AUTH_TOKEN", "token")
    monkeypatch.setenv("TWILIO_WHATSAPP_FROM", "+22500000000")
    monkeypatch.setattr("requests.Session.post", fake_post)

    resp = client.post("/api/v1/notifications/whatsapp/send", json={"to": "+22512345678", "message": "hi"})
    assert resp.status_code == 200
    assert resp.json().get("status") == "ok"

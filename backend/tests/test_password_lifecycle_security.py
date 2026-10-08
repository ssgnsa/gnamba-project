from __future__ import annotations

import os
import uuid
from urllib.parse import parse_qs, urlsplit
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.api import deps
from app.core.config import settings
from app.core.security import AuthenticationError, validate_password
from app.infrastructure.auth_state_repository import SqlAlchemyAuthStateRepository
from app.main import app
from app.models.user import AuthPasswordResetToken, AuthRateLimitEvent, AuthSession
from app.repositories.user_repository import InMemoryUserRepository
from app.services.auth_service import AuthService


class FakeResetMailer:
    def __init__(self) -> None:
        self.sent: list[tuple[str, str]] = []

    def is_configured(self) -> bool:
        return True

    def send_password_reset(self, address: str, link: str) -> None:
        self.sent.append((address, link))


@pytest.fixture
def auth_api():
    repository = InMemoryUserRepository()
    mailer = FakeResetMailer()
    app.dependency_overrides[deps.get_user_repository] = lambda: repository
    app.dependency_overrides[deps.get_auth_service] = lambda: AuthService(repository)
    app.dependency_overrides[deps.get_password_reset_mailer] = lambda: mailer
    client = TestClient(app, base_url="https://testserver")
    yield client, repository, mailer
    client.close()
    app.dependency_overrides.clear()


def login(client: TestClient, password: str | None = None):
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "admin@egs.local",
            "password": password or os.environ["INITIAL_ADMIN_PASSWORD"],
        },
    )
    assert response.status_code == 200, response.text
    return response


def test_login_keeps_refresh_token_out_of_json_and_sets_httponly_cookie(auth_api):
    client, _, _ = auth_api
    response = login(client)
    assert "refresh_token" not in response.json()
    cookie = response.headers["set-cookie"].lower()
    assert "egs_refresh=" in cookie
    assert "httponly" in cookie
    assert "secure" in cookie
    assert "samesite=lax" in cookie


def test_refresh_token_cannot_be_used_as_access_token(auth_api):
    client, _, _ = auth_api
    login_response = login(client)
    refresh_token = client.cookies.get(settings.AUTH_REFRESH_COOKIE_NAME)
    assert refresh_token
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {refresh_token}"},
    )
    assert response.status_code == 401
    assert login_response.json()["access_token"]


def test_refresh_rotates_token_and_replay_revokes_session(auth_api):
    client, _, _ = auth_api
    login_response = login(client)
    access_token = login_response.json()["access_token"]
    old_refresh = client.cookies.get(settings.AUTH_REFRESH_COOKIE_NAME)
    rotated = client.post("/api/v1/auth/refresh")
    assert rotated.status_code == 200
    assert "refresh_token" not in rotated.json()
    assert client.cookies.get(settings.AUTH_REFRESH_COOKIE_NAME) != old_refresh

    replay_client = TestClient(app, base_url="https://testserver")
    replay = replay_client.post(
        "/api/v1/auth/refresh",
        headers={"Cookie": f"{settings.AUTH_REFRESH_COOKIE_NAME}={old_refresh}"},
    )
    assert replay.status_code == 401
    assert client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    ).status_code == 401
    replay_client.close()


def test_logout_revokes_access_and_refresh_session(auth_api):
    client, _, _ = auth_api
    response = login(client)
    access = response.json()["access_token"]
    assert client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {access}"},
    ).status_code == 200
    assert client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access}"},
    ).status_code == 401
    assert client.post("/api/v1/auth/refresh").status_code == 401


def test_forgot_password_response_does_not_disclose_account_existence(auth_api):
    client, _, mailer = auth_api
    existing = client.post("/api/v1/auth/password/forgot", json={"email": "admin@egs.local"})
    missing = client.post("/api/v1/auth/password/forgot", json={"email": "unknown@egs.local"})
    assert existing.status_code == missing.status_code == 202
    assert existing.json() == missing.json()
    assert len(mailer.sent) == 1


def test_reset_token_is_random_hashed_single_use_and_revokes_sessions(auth_api):
    client, repository, mailer = auth_api
    old_access = login(client).json()["access_token"]
    response = client.post("/api/v1/auth/password/forgot", json={"email": "admin@egs.local"})
    assert response.status_code == 202

    address, link = mailer.sent[0]
    assert address == "admin@egs.local"
    parsed = urlsplit(link)
    assert parsed.scheme == "https"
    token = parse_qs(parsed.fragment)["token"][0]
    assert token not in repository._auth_state_repository.reset_tokens

    reset = client.post(
        "/api/v1/auth/password/reset",
        json={"token": token, "new_password": "NouvellePhraseSolide2026!"},
    )
    assert reset.status_code == 200
    assert client.post(
        "/api/v1/auth/password/reset",
        json={"token": token, "new_password": "EncoreUnePhraseSolide2026!"},
    ).status_code == 401
    assert client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {old_access}"},
    ).status_code == 401
    assert login(client, "NouvellePhraseSolide2026!").status_code == 200


def test_password_change_requires_old_password_and_revokes_all_sessions(auth_api):
    client, _, _ = auth_api
    old_password = os.environ["INITIAL_ADMIN_PASSWORD"]
    old_access = login(client).json()["access_token"]
    second_access = login(client).json()["access_token"]

    invalid = client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {second_access}"},
        json={"current_password": "incorrect", "new_password": "NouvellePhraseSolide2026!"},
    )
    assert invalid.status_code == 401

    changed = client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {second_access}"},
        json={"current_password": old_password, "new_password": "NouvellePhraseSolide2026!"},
    )
    assert changed.status_code == 200
    assert client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {old_access}"},
    ).status_code == 401
    assert client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {second_access}"},
    ).status_code == 401
    assert login(client, "NouvellePhraseSolide2026!").status_code == 200


def test_password_change_attempts_are_rate_limited(auth_api, monkeypatch):
    client, _, _ = auth_api
    access = login(client).json()["access_token"]
    monkeypatch.setattr(settings, "AUTH_RESET_RATE_LIMIT", 2)
    for _ in range(2):
        assert client.post(
            "/api/v1/auth/change-password",
            headers={"Authorization": f"Bearer {access}"},
            json={"current_password": "incorrect", "new_password": "NouvellePhraseSolide2026!"},
        ).status_code == 401
    limited = client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {access}"},
        json={"current_password": "incorrect", "new_password": "NouvellePhraseSolide2026!"},
    )
    assert limited.status_code == 429


def test_server_password_policy_rejects_short_and_bcrypt_oversized_passwords():
    with pytest.raises(AuthenticationError):
        validate_password("short")
    with pytest.raises(AuthenticationError):
        validate_password("é" * 37)
    validate_password("UnePhraseDePasseSolide2026!")


def test_login_rate_limit_is_enforced_on_server(auth_api, monkeypatch):
    client, _, _ = auth_api
    monkeypatch.setattr(settings, "AUTH_LOGIN_RATE_LIMIT", 2)
    for _ in range(2):
        assert client.post(
            "/api/v1/auth/login",
            json={"email": "admin@egs.local", "password": "wrong-password"},
        ).status_code == 401
    limited = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@egs.local", "password": "wrong-password"},
    )
    assert limited.status_code == 429
    assert limited.headers["retry-after"]


def test_production_auth_transport_rejects_plain_http(monkeypatch):
    monkeypatch.setattr(settings, "AUTH_REQUIRE_HTTPS", True)
    client = TestClient(app, base_url="http://public.example")
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@egs.local", "password": "not-a-real-password"},
    )
    assert response.status_code == 426


def test_sql_auth_state_persists_rotation_revocation_reset_and_rate_limits():
    engine = create_engine("sqlite://")
    AuthSession.__table__.create(engine)
    AuthPasswordResetToken.__table__.create(engine)
    AuthRateLimitEvent.__table__.create(engine)
    now = datetime.now(timezone.utc)

    with Session(engine) as db:
        state = SqlAlchemyAuthStateRepository(db)
        session_id = str(uuid.uuid4())
        state.create_session(session_id, "user-1", "old-hash", now + timedelta(days=1), None, None)
        assert state.session_is_active(session_id, "user-1", now)
        assert state.rotate_session(session_id, "old-hash", "new-hash", now + timedelta(days=1), now)
        assert not state.rotate_session(session_id, "old-hash", "replay-hash", now + timedelta(days=1), now)
        assert not state.session_is_active(session_id, "user-1", now)

        state.create_reset_token("reset-1", "user-1", "token-hash", now + timedelta(minutes=30), now)
        assert state.consume_reset_token("token-hash", now) == "user-1"
        assert state.consume_reset_token("token-hash", now) is None
        state.create_reset_token("reset-2", "user-1", "expired-hash", now - timedelta(seconds=1), now)
        assert state.consume_reset_token("expired-hash", now) is None

        assert state.consume_rate_limit_event("login", "identifier", now - timedelta(minutes=1), now, 2)
        assert state.consume_rate_limit_event("login", "identifier", now - timedelta(minutes=1), now, 2)
        assert not state.consume_rate_limit_event("login", "identifier", now - timedelta(minutes=1), now, 2)

    engine.dispose()

from __future__ import annotations

import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.parse import urlsplit

from app.core.config import settings
from app.core.security import (
    AuthenticationError,
    AuthorizationError,
    RateLimitError,
    get_user_payload,
    hash_opaque_token,
    hash_password,
    issue_token,
    require_token,
    validate_password,
    verify_password,
)
from app.domain.user import User
from app.infrastructure.auth_state_repository import (
    AuthStateRepository,
    InMemoryAuthStateRepository,
)
from app.repositories.user_repository import UserRepositoryPort

def _now() -> datetime:
    return datetime.now(timezone.utc)


def _rate_identifier(value: str) -> str:
    return hashlib.sha256(f"{settings.SECRET_KEY}:{value}".encode("utf-8")).hexdigest()


class UserApplicationService:
    def __init__(
        self,
        user_repository: UserRepositoryPort,
        auth_state_repository: AuthStateRepository | None = None,
    ) -> None:
        self.user_repository = user_repository
        # The in-memory repository is used by unit tests. Keep its state attached
        # to the repository so per-request service construction remains coherent.
        if auth_state_repository is None:
            auth_state_repository = getattr(user_repository, "_auth_state_repository", None)
            if auth_state_repository is None:
                auth_state_repository = InMemoryAuthStateRepository()
                setattr(user_repository, "_auth_state_repository", auth_state_repository)
        self.auth_state = auth_state_repository

    def _new_tokens(self, user: User, session_id: str) -> tuple[str, str]:
        payload = user.to_payload()
        return (
            issue_token(payload, "access", session_id),
            issue_token(payload, "refresh", session_id),
        )

    def _consume_rate_limit(self, event_type: str, identifiers: list[str], max_events: int) -> bool:
        now = _now()
        since = now - timedelta(seconds=settings.AUTH_RATE_LIMIT_WINDOW_SECONDS)
        allowed = True
        for value in sorted(set(value for value in identifiers if value)):
            if not self.auth_state.consume_rate_limit_event(
                event_type,
                _rate_identifier(value),
                since,
                now,
                max_events,
            ):
                allowed = False
        return allowed

    def authenticate(
        self,
        email: str,
        password: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> dict[str, Any]:
        normalized_email = email.strip().lower()
        identifiers = [f"email:{normalized_email}", f"ip:{ip_address or ''}"]
        if not self._consume_rate_limit("login_attempt", identifiers, settings.AUTH_LOGIN_RATE_LIMIT):
            raise RateLimitError("Trop de tentatives. Réessayez plus tard.")

        user = self.user_repository.get_by_email(normalized_email)
        if (
            len(password.encode("utf-8")) > 72
            or not user
            or not user.is_active
            or not verify_password(password, user.password_hash)
        ):
            raise AuthenticationError("Identifiants invalides")

        for value in identifiers:
            if value:
                self.auth_state.clear_rate_limit_events("login_attempt", _rate_identifier(value))

        now = _now()
        session_id = str(uuid.uuid4())
        access_token, refresh_token = self._new_tokens(user, session_id)
        refresh_expiry = now + timedelta(seconds=settings.REFRESH_TOKEN_TTL_SECONDS)
        self.auth_state.create_session(
            session_id,
            user.id,
            hash_opaque_token(refresh_token),
            refresh_expiry,
            ip_address,
            user_agent,
        )
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": get_user_payload(user.to_payload()),
        }

    def refresh(self, refresh_token: str) -> dict[str, Any]:
        payload = require_token(refresh_token)
        if payload.get("type") != "refresh" or not payload.get("sid"):
            raise AuthorizationError("Refresh token invalide")
        user = self.user_repository.get_by_id(payload.get("sub"))
        if not user or not user.is_active:
            raise AuthorizationError("Refresh token invalide")

        now = _now()
        session_id = payload["sid"]
        access_token, next_refresh_token = self._new_tokens(user, session_id)
        rotated = self.auth_state.rotate_session(
            session_id,
            hash_opaque_token(refresh_token),
            hash_opaque_token(next_refresh_token),
            now + timedelta(seconds=settings.REFRESH_TOKEN_TTL_SECONDS),
            now,
        )
        if not rotated:
            raise AuthorizationError("Refresh token invalide ou déjà utilisé")
        return {
            "access_token": access_token,
            "refresh_token": next_refresh_token,
            "user": get_user_payload(user.to_payload()),
        }

    def get_current_user(self, authorization: str | None) -> dict[str, Any]:
        if not authorization or not authorization.startswith("Bearer "):
            raise AuthorizationError("Authorization header manquant")
        payload = require_token(authorization.split(" ", 1)[1])
        if payload.get("type") != "access" or not payload.get("sid"):
            raise AuthorizationError("Access token invalide")
        user_id = payload.get("sub")
        user = self.user_repository.get_by_id(user_id)
        if not user or not user.is_active:
            raise AuthorizationError("Token invalide")
        if not self.auth_state.session_is_active(payload["sid"], user.id, _now()):
            raise AuthorizationError("Session révoquée ou expirée")
        current = get_user_payload(user.to_payload())
        aal2 = bool(settings.TEST_TOTP_SECRET and payload.get("aal") == 2)
        current["aal"] = "AAL2" if aal2 else "AAL1"
        if aal2 and str(user.id) == settings.TEST_TOTP_USER_ID:
            # This test-only claim can only be minted after the RFC 6238 verifier.
            current["mfa_verified"] = True
        return current

    def logout(self, authorization: str | None, refresh_cookie: str | None = None) -> None:
        now = _now()
        if authorization and authorization.startswith("Bearer "):
            try:
                payload = require_token(authorization.split(" ", 1)[1])
                if payload.get("type") == "access" and payload.get("sid"):
                    self.auth_state.revoke_session(payload["sid"], "logout", now)
                    return
            except AuthorizationError:
                pass
        if refresh_cookie:
            self.auth_state.revoke_refresh_hash(hash_opaque_token(refresh_cookie), "logout", now)

    def request_password_reset(self, email: str, ip_address: str | None, mailer: Any) -> tuple[str, str] | None:
        normalized_email = email.strip().lower()
        identifiers = [f"reset-email:{normalized_email}", f"ip:{ip_address or ''}"]
        if not self._consume_rate_limit("password_reset_request", identifiers, settings.AUTH_RESET_RATE_LIMIT):
            return None

        user = self.user_repository.get_by_email(normalized_email)
        if not user or not user.is_active or not mailer.is_configured():
            return None
        app_url = urlsplit(settings.PUBLIC_APP_URL)
        local_reset_origin = app_url.hostname in {"localhost", "127.0.0.1", "::1"}
        if app_url.scheme != "https" and not local_reset_origin:
            return None

        raw_token = secrets.token_urlsafe(32)
        now = _now()
        self.auth_state.create_reset_token(
            str(uuid.uuid4()),
            user.id,
            hash_opaque_token(raw_token),
            now + timedelta(seconds=settings.PASSWORD_RESET_TTL_SECONDS),
            now,
        )
        link = f"{settings.PUBLIC_APP_URL}/reset-password#token={raw_token}"
        return normalized_email, link

    def complete_password_reset(self, token: str, new_password: str, ip_address: str | None = None) -> None:
        validate_password(new_password)
        token_identifier = hash_opaque_token(token)
        identifiers = [f"reset-ip:{ip_address or ''}", f"reset-token:{token_identifier}"]
        if not self._consume_rate_limit("password_reset_submit", identifiers, settings.AUTH_RESET_RATE_LIMIT):
            raise RateLimitError("Trop de tentatives. Réessayez plus tard.")
        user_id = self.auth_state.consume_reset_token(token_identifier, _now())
        if not user_id:
            raise AuthorizationError("Lien de réinitialisation invalide ou expiré")
        user = self.user_repository.update(user_id, {"password_hash": hash_password(new_password)})
        if not user:
            raise AuthorizationError("Lien de réinitialisation invalide ou expiré")
        self.auth_state.revoke_user_sessions(user_id, "password_reset", _now())

    def create_user(self, payload: dict[str, Any]) -> dict[str, Any]:
        validate_password(payload["password"])
        email = payload["email"].strip().lower()
        if self.user_repository.get_by_email(email):
            raise AuthenticationError("Utilisateur déjà existant")
        payload = {**payload, "email": email}
        user = self.user_repository.create(payload)
        return get_user_payload(user.to_payload())

    def list_users(self) -> list[dict[str, Any]]:
        return [user.to_payload() for user in self.user_repository.get_all()]

    def update_user(self, user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        user = self.user_repository.update(user_id, payload)
        if not user:
            raise AuthorizationError("Utilisateur introuvable")
        return user.to_payload()

    def delete_user(self, user_id: str) -> None:
        if not self.user_repository.delete(user_id):
            raise AuthorizationError("Utilisateur introuvable")

    def change_password(self, user_id: str, current_password: str, new_password: str) -> None:
        if not self._consume_rate_limit(
            "password_change",
            [f"user:{user_id}"],
            settings.AUTH_RESET_RATE_LIMIT,
        ):
            raise RateLimitError("Trop de tentatives. Réessayez plus tard.")
        user = self.user_repository.get_by_id(user_id)
        if not user:
            raise AuthorizationError("Utilisateur introuvable")
        if not current_password:
            raise AuthenticationError("Le mot de passe actuel est requis")
        if not verify_password(current_password, user.password_hash):
            raise AuthenticationError("Le mot de passe actuel est incorrect")
        validate_password(new_password)
        if current_password == new_password:
            raise AuthenticationError("Le nouveau mot de passe doit être différent de l'actuel")
        self.user_repository.update(user_id, {"password_hash": hash_password(new_password)})
        self.auth_state.clear_rate_limit_events(
            "password_change",
            _rate_identifier(f"user:{user_id}"),
        )
        self.auth_state.revoke_user_sessions(user_id, "password_changed", _now())

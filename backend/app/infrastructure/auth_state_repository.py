from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from threading import RLock
from typing import Protocol

from sqlalchemy import func, text, update
from sqlalchemy.orm import Session

from app.models.user import AuthPasswordResetToken, AuthRateLimitEvent, AuthSession


class AuthStateRepository(Protocol):
    def create_session(self, session_id: str, user_id: str, refresh_hash: str, expires_at: datetime, ip_address: str | None, user_agent: str | None) -> None: ...
    def session_is_active(self, session_id: str, user_id: str, now: datetime) -> bool: ...
    def rotate_session(self, session_id: str, expected_hash: str, new_hash: str, expires_at: datetime, now: datetime) -> bool: ...
    def revoke_session(self, session_id: str, reason: str, now: datetime) -> None: ...
    def revoke_refresh_hash(self, refresh_hash: str, reason: str, now: datetime) -> None: ...
    def revoke_user_sessions(self, user_id: str, reason: str, now: datetime) -> None: ...
    def create_reset_token(self, token_id: str, user_id: str, token_hash: str, expires_at: datetime, now: datetime) -> None: ...
    def consume_reset_token(self, token_hash: str, now: datetime) -> str | None: ...
    def consume_rate_limit_event(self, event_type: str, identifier: str, since: datetime, now: datetime, limit: int) -> bool: ...
    def clear_rate_limit_events(self, event_type: str, identifier: str) -> None: ...


class SqlAlchemyAuthStateRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_session(self, session_id: str, user_id: str, refresh_hash: str, expires_at: datetime, ip_address: str | None, user_agent: str | None) -> None:
        self.db.add(AuthSession(
            id=session_id,
            user_id=user_id,
            refresh_token_hash=refresh_hash,
            expires_at=expires_at,
            ip_address=ip_address,
            user_agent=user_agent,
        ))
        self.db.commit()

    def session_is_active(self, session_id: str, user_id: str, now: datetime) -> bool:
        return self.db.query(AuthSession.id).filter(
            AuthSession.id == session_id,
            AuthSession.user_id == user_id,
            AuthSession.revoked_at.is_(None),
            AuthSession.expires_at > now,
        ).first() is not None

    def rotate_session(self, session_id: str, expected_hash: str, new_hash: str, expires_at: datetime, now: datetime) -> bool:
        session = self.db.query(AuthSession).filter(AuthSession.id == session_id).first()
        stored_expiry = session.expires_at if session and session.expires_at else None
        if stored_expiry is not None and stored_expiry.tzinfo is None:
            stored_expiry = stored_expiry.replace(tzinfo=timezone.utc)
        if session is None or session.revoked_at is not None or stored_expiry is None or stored_expiry <= now:
            return False
        result = self.db.execute(
            update(AuthSession)
            .where(
                AuthSession.id == session_id,
                AuthSession.refresh_token_hash == expected_hash,
                AuthSession.revoked_at.is_(None),
                AuthSession.expires_at > now,
            )
            .values(refresh_token_hash=new_hash, last_seen_at=now)
            .execution_options(synchronize_session=False)
        )
        if result.rowcount != 1:
            self.db.query(AuthSession).filter(
                AuthSession.id == session_id,
                AuthSession.revoked_at.is_(None),
            ).update({"revoked_at": now, "revoked_reason": "refresh_replay"}, synchronize_session=False)
        self.db.commit()
        return result.rowcount == 1

    def revoke_session(self, session_id: str, reason: str, now: datetime) -> None:
        self.db.query(AuthSession).filter(
            AuthSession.id == session_id,
            AuthSession.revoked_at.is_(None),
        ).update({"revoked_at": now, "revoked_reason": reason}, synchronize_session=False)
        self.db.commit()

    def revoke_refresh_hash(self, refresh_hash: str, reason: str, now: datetime) -> None:
        self.db.query(AuthSession).filter(
            AuthSession.refresh_token_hash == refresh_hash,
            AuthSession.revoked_at.is_(None),
        ).update({"revoked_at": now, "revoked_reason": reason}, synchronize_session=False)
        self.db.commit()

    def revoke_user_sessions(self, user_id: str, reason: str, now: datetime) -> None:
        self.db.query(AuthSession).filter(
            AuthSession.user_id == user_id,
            AuthSession.revoked_at.is_(None),
        ).update({"revoked_at": now, "revoked_reason": reason}, synchronize_session=False)
        self.db.commit()

    def create_reset_token(self, token_id: str, user_id: str, token_hash: str, expires_at: datetime, now: datetime) -> None:
        self.db.query(AuthPasswordResetToken).filter(
            AuthPasswordResetToken.user_id == user_id,
            AuthPasswordResetToken.used_at.is_(None),
        ).update({"used_at": now}, synchronize_session=False)
        self.db.add(AuthPasswordResetToken(
            id=token_id,
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        ))
        self.db.commit()

    def consume_reset_token(self, token_hash: str, now: datetime) -> str | None:
        record = self.db.query(AuthPasswordResetToken).filter(
            AuthPasswordResetToken.token_hash == token_hash,
            AuthPasswordResetToken.used_at.is_(None),
            AuthPasswordResetToken.expires_at > now,
        ).with_for_update().first()
        if record is None:
            return None
        record.used_at = now
        self.db.commit()
        return record.user_id

    def consume_rate_limit_event(self, event_type: str, identifier: str, since: datetime, now: datetime, limit: int) -> bool:
        import uuid
        import hashlib

        lock_id = int.from_bytes(
            hashlib.sha256(f"{event_type}:{identifier}".encode("utf-8")).digest()[:8],
            byteorder="big",
            signed=True,
        )
        if self.db.bind and self.db.bind.dialect.name == "postgresql":
            self.db.execute(text("SELECT pg_advisory_xact_lock(:lock_id)"), {"lock_id": lock_id})
        count = int(self.db.query(func.count(AuthRateLimitEvent.id)).filter(
            AuthRateLimitEvent.event_type == event_type,
            AuthRateLimitEvent.identifier == identifier,
            AuthRateLimitEvent.created_at >= since,
        ).scalar() or 0)
        if count >= limit:
            self.db.rollback()
            return False
        self.db.add(AuthRateLimitEvent(
            id=str(uuid.uuid4()), event_type=event_type,
            identifier=identifier, created_at=now,
        ))
        self.db.commit()
        return True

    def clear_rate_limit_events(self, event_type: str, identifier: str) -> None:
        self.db.query(AuthRateLimitEvent).filter(
            AuthRateLimitEvent.event_type == event_type,
            AuthRateLimitEvent.identifier == identifier,
        ).delete(synchronize_session=False)
        self.db.commit()


@dataclass
class _MemorySession:
    user_id: str
    refresh_hash: str
    expires_at: datetime
    revoked_at: datetime | None = None


@dataclass
class _MemoryResetToken:
    user_id: str
    expires_at: datetime
    used_at: datetime | None = None


class InMemoryAuthStateRepository:
    """Per-process auth state for unit tests and explicit in-memory deployments."""
    def __init__(self) -> None:
        self._lock = RLock()
        self.sessions: dict[str, _MemorySession] = {}
        self.reset_tokens: dict[str, _MemoryResetToken] = {}
        self.rate_events: list[tuple[str, str, datetime]] = []

    def create_session(self, session_id: str, user_id: str, refresh_hash: str, expires_at: datetime, ip_address: str | None, user_agent: str | None) -> None:
        with self._lock:
            self.sessions[session_id] = _MemorySession(user_id, refresh_hash, expires_at)

    def session_is_active(self, session_id: str, user_id: str, now: datetime) -> bool:
        with self._lock:
            row = self.sessions.get(session_id)
            return bool(row and row.user_id == user_id and row.revoked_at is None and row.expires_at > now)

    def rotate_session(self, session_id: str, expected_hash: str, new_hash: str, expires_at: datetime, now: datetime) -> bool:
        with self._lock:
            row = self.sessions.get(session_id)
            if not row or row.revoked_at is not None or row.expires_at <= now or row.refresh_hash != expected_hash:
                if row and row.revoked_at is None:
                    row.revoked_at = now
                return False
            row.refresh_hash = new_hash
            return True

    def revoke_session(self, session_id: str, reason: str, now: datetime) -> None:
        with self._lock:
            row = self.sessions.get(session_id)
            if row:
                row.revoked_at = now

    def revoke_refresh_hash(self, refresh_hash: str, reason: str, now: datetime) -> None:
        with self._lock:
            for row in self.sessions.values():
                if row.refresh_hash == refresh_hash:
                    row.revoked_at = now

    def revoke_user_sessions(self, user_id: str, reason: str, now: datetime) -> None:
        with self._lock:
            for row in self.sessions.values():
                if row.user_id == user_id and row.revoked_at is None:
                    row.revoked_at = now

    def create_reset_token(self, token_id: str, user_id: str, token_hash: str, expires_at: datetime, now: datetime) -> None:
        with self._lock:
            for row in self.reset_tokens.values():
                if row.user_id == user_id and row.used_at is None:
                    row.used_at = now
            self.reset_tokens[token_hash] = _MemoryResetToken(user_id, expires_at)

    def consume_reset_token(self, token_hash: str, now: datetime) -> str | None:
        with self._lock:
            row = self.reset_tokens.get(token_hash)
            if not row or row.used_at is not None or row.expires_at <= now:
                return None
            row.used_at = now
            return row.user_id

    def consume_rate_limit_event(self, event_type: str, identifier: str, since: datetime, now: datetime, limit: int) -> bool:
        with self._lock:
            self.rate_events = [e for e in self.rate_events if e[2] >= since]
            count = sum(1 for kind, key, _ in self.rate_events if kind == event_type and key == identifier)
            if count >= limit:
                return False
            self.rate_events.append((event_type, identifier, now))
            return True

    def clear_rate_limit_events(self, event_type: str, identifier: str) -> None:
        with self._lock:
            self.rate_events = [e for e in self.rate_events if (e[0], e[1]) != (event_type, identifier)]

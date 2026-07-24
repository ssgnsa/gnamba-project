from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any


@dataclass(slots=True)
class AuthSession:
    id: str
    user_id: str
    refresh_token_hash: str
    created_at: datetime
    expires_at: datetime
    last_seen_at: datetime
    user_agent: str | None = None
    ip_address: str | None = None
    revoked_at: datetime | None = None
    revoked_reason: str | None = None
    compromised_at: datetime | None = None

    def to_payload(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat(),
            "expires_at": self.expires_at.isoformat(),
            "last_seen_at": self.last_seen_at.isoformat(),
            "user_agent": self.user_agent,
            "ip_address": self.ip_address,
            "revoked_at": self.revoked_at.isoformat() if self.revoked_at else None,
            "revoked_reason": self.revoked_reason,
            "compromised_at": self.compromised_at.isoformat() if self.compromised_at else None,
        }


@dataclass(slots=True)
class LoginFailure:
    email: str
    ip_address: str
    created_at: datetime

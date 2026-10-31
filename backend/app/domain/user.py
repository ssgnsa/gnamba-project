from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass(slots=True)
class User:
    id: str
    entity_id: str | None = None
    password_hash: str = ""
    role: str = "guest"
    access_level: str = "guest"
    is_active: bool = True
    mfa_required: bool = False
    # Identity fields (moved to the linked Entity). Populated by the repository
    # via user -> entity_id -> Entity. Kept for the API contract (UserResponse).
    email: str | None = None
    full_name: str | None = None
    poste: str | None = None
    department: str | None = None
    phone: str | None = None
    mfa_secret: str | None = None
    mfa_enabled: bool = False
    mfa_confirmed_at: datetime | None = None

    def to_payload(self) -> dict[str, object]:
        return {
            "id": self.id,
            "entity_id": self.entity_id or self.id,
            "password_hash": self.password_hash,
            "role": self.role,
            "access_level": self.access_level,
            "is_active": self.is_active,
            "mfa_required": self.mfa_required,
            "mfa_enabled": self.mfa_enabled,
            "email": self.email or "",
            "full_name": self.full_name or "",
            "poste": self.poste,
            "department": self.department,
            "phone": self.phone,
        }

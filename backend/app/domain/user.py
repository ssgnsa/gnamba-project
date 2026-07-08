from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass(slots=True)
class User:
    id: str
    email: str
    full_name: str
    password_hash: str
    role: str = "employe"
    access_level: str = "employe"
    poste: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool = True

    def to_payload(self) -> dict[str, object]:
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role,
            "access_level": self.access_level,
            "poste": self.poste,
            "department": self.department,
            "phone": self.phone,
        }

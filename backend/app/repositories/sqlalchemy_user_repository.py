"""User repository with SQLAlchemy backend."""
from __future__ import annotations

from typing import Any
import time
import enum
from sqlalchemy.orm import Session
from backend.app.core.security import hash_password
from backend.app.models.user import User, RoleEnum, AccessLevelEnum


def _coerce_enum(enum_cls: type[enum.Enum], value: Any, default: enum.Enum) -> enum.Enum:
    if isinstance(value, enum_cls):
        return value
    if isinstance(value, str):
        normalized = value.strip().lower()
        try:
            return enum_cls(normalized)
        except ValueError:
            for member in enum_cls:
                if member.name.lower() == normalized:
                    return member
    return default


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def _ensure_default_admin(self) -> None:
        existing = self.db.query(User).filter(User.email == "admin@egs.local").first()
        if existing is not None:
            return

        admin = User(
            id="admin-local",
            email="admin@egs.local",
            password_hash=hash_password("deadsoulja28@"),
            full_name="Administrateur EGS",
            role=RoleEnum.ADMIN.value,
            access_level=AccessLevelEnum.ADMIN.value,
            poste="Administrateur",
            department="Direction",
            phone="",
        )
        self.db.add(admin)
        self.db.commit()
        self.db.refresh(admin)

    def get_by_email(self, email: str) -> dict[str, Any] | None:
        if email == "admin@egs.local":
            self._ensure_default_admin()

        user = self.db.query(User).filter(User.email == email).first()
        if user:
            return user.to_dict() | {"password_hash": user.password_hash}
        return None

    def get_by_id(self, user_id: str) -> dict[str, Any] | None:
        user = self.db.query(User).filter(User.id == user_id).first()
        if user:
            return user.to_dict() | {"password_hash": user.password_hash}
        return None

    def get_all(self) -> list[dict[str, Any]]:
        return [
            user.to_dict() | {"password_hash": user.password_hash}
            for user in self.db.query(User).order_by(User.full_name).all()
        ]

    def update(self, user_id: str, payload: dict[str, Any]) -> dict[str, Any] | None:
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return None

        for field in ("full_name", "role", "access_level", "poste", "department", "phone"):
            if field in payload and payload[field] is not None:
                value = payload[field]
                if field == "role":
                    value = _coerce_enum(RoleEnum, value, RoleEnum.EMPLOYE).value
                elif field == "access_level":
                    value = _coerce_enum(AccessLevelEnum, value, AccessLevelEnum.EMPLOYE).value
                setattr(user, field, value)

        self.db.commit()
        self.db.refresh(user)
        return user.to_dict() | {"password_hash": user.password_hash}

    def delete(self, user_id: str) -> bool:
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return False

        self.db.delete(user)
        self.db.commit()
        return True

    def create(self, payload: dict[str, Any]) -> dict[str, Any]:
        user = User(
            id=f"local-user-{int(time.time() * 1000)}",
            email=payload["email"],
            password_hash=hash_password(payload["password"]),
            full_name=payload.get("full_name", ""),
            role=_coerce_enum(RoleEnum, payload.get("role"), RoleEnum.EMPLOYE).value,
            access_level=_coerce_enum(AccessLevelEnum, payload.get("access_level"), AccessLevelEnum.EMPLOYE).value,
            poste=payload.get("poste"),
            department=payload.get("department"),
            phone=payload.get("phone"),
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user.to_dict() | {"password_hash": user.password_hash}


def seed_system(db: Session) -> None:
    """Create the default admin and standard roles if they are missing."""
    existing = db.query(User).filter(User.email == "admin@egs.local").first()
    if existing is not None:
        return

    admin = User(
        id="admin-local",
        email="admin@egs.local",
        password_hash=hash_password("deadsoulja28@"),
        full_name="Administrateur EGS",
        role=RoleEnum.ADMIN.value,
        access_level=AccessLevelEnum.ADMIN.value,
        poste="Administrateur",
        department="Direction",
        phone="",
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)

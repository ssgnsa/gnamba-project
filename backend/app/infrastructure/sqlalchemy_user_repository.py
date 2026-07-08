from __future__ import annotations

import time
from typing import Any

from sqlalchemy.orm import Session

from backend.app.core.security import hash_password
from backend.app.domain.user import User as DomainUser
from backend.app.models.user import AccessLevelEnum, RoleEnum, User as SqlAlchemyUser
from backend.app.repositories.user_repository import UserRepositoryPort


class SqlAlchemyUserRepository(UserRepositoryPort):
    def __init__(self, db: Session) -> None:
        self.db = db

    def _coerce_enum(self, enum_cls: type[object], value: Any, default: object) -> object:
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

    def _seed_default_admin(self) -> None:
        existing = self.db.query(SqlAlchemyUser).filter(SqlAlchemyUser.email == "admin@egs.local").first()
        if existing is not None:
            return

        admin = SqlAlchemyUser(
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

    def get_by_email(self, email: str) -> DomainUser | None:
        if email == "admin@egs.local":
            self._seed_default_admin()
        user = self.db.query(SqlAlchemyUser).filter(SqlAlchemyUser.email == email).first()
        if not user:
            return None
        return DomainUser(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            password_hash=user.password_hash,
            role=user.role,
            access_level=user.access_level,
            poste=user.poste,
            department=user.department,
            phone=user.phone,
            is_active=bool(user.is_active),
        )

    def get_by_id(self, user_id: str) -> DomainUser | None:
        user = self.db.query(SqlAlchemyUser).filter(SqlAlchemyUser.id == user_id).first()
        if not user:
            return None
        return DomainUser(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            password_hash=user.password_hash,
            role=user.role,
            access_level=user.access_level,
            poste=user.poste,
            department=user.department,
            phone=user.phone,
            is_active=bool(user.is_active),
        )

    def get_all(self) -> list[DomainUser]:
        return [
            DomainUser(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                password_hash=user.password_hash,
                role=user.role,
                access_level=user.access_level,
                poste=user.poste,
                department=user.department,
                phone=user.phone,
                is_active=bool(user.is_active),
            )
            for user in self.db.query(SqlAlchemyUser).order_by(SqlAlchemyUser.full_name).all()
        ]

    def update(self, user_id: str, payload: dict[str, Any]) -> DomainUser | None:
        user = self.db.query(SqlAlchemyUser).filter(SqlAlchemyUser.id == user_id).first()
        if not user:
            return None

        for field in ("full_name", "role", "access_level", "poste", "department", "phone"):
            if field in payload and payload[field] is not None:
                value = payload[field]
                if field == "role":
                    value = self._coerce_enum(RoleEnum, value, RoleEnum.EMPLOYE).value
                elif field == "access_level":
                    value = self._coerce_enum(AccessLevelEnum, value, AccessLevelEnum.EMPLOYE).value
                setattr(user, field, value)

        self.db.commit()
        self.db.refresh(user)
        return self.get_by_id(user.id)

    def delete(self, user_id: str) -> bool:
        user = self.db.query(SqlAlchemyUser).filter(SqlAlchemyUser.id == user_id).first()
        if not user:
            return False
        self.db.delete(user)
        self.db.commit()
        return True

    def create(self, payload: dict[str, Any]) -> DomainUser:
        user = SqlAlchemyUser(
            id=f"local-user-{int(time.time() * 1000)}",
            email=payload["email"],
            password_hash=hash_password(payload["password"]),
            full_name=payload.get("full_name", ""),
            role=self._coerce_enum(RoleEnum, payload.get("role"), RoleEnum.EMPLOYE).value,
            access_level=self._coerce_enum(AccessLevelEnum, payload.get("access_level"), AccessLevelEnum.EMPLOYE).value,
            poste=payload.get("poste"),
            department=payload.get("department"),
            phone=payload.get("phone"),
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return self.get_by_id(user.id)

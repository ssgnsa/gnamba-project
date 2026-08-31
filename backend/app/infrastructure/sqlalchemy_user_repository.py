from __future__ import annotations

import os
import time
from typing import Any

from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.domain.user import User as DomainUser
from app.models.entity import Entity
from app.models.user import AccessLevelEnum, RoleEnum, User as SqlAlchemyUser
from app.repositories.user_repository import UserRepositoryPort

ADMIN_USER_ID = "00000000-0000-0000-0000-000000000001"
ADMIN_EMAIL = "admin@egs.local"


def _entity_identity(entity: Entity | None, fallback_user: SqlAlchemyUser | None = None) -> dict[str, Any]:
    """Extract identity fields from a linked Entity, with fallback to the legacy user row when needed."""
    fallback = {
        "email": fallback_user.email if fallback_user is not None else None,
        "full_name": fallback_user.full_name if fallback_user is not None else None,
        "poste": fallback_user.poste if fallback_user is not None else None,
        "department": fallback_user.department if fallback_user is not None else None,
        "phone": fallback_user.phone if fallback_user is not None else None,
    }
    if entity is None:
        return {
            "email": fallback.get("email"),
            "full_name": fallback.get("full_name"),
            "poste": fallback.get("poste"),
            "department": fallback.get("department"),
            "phone": fallback.get("phone"),
        }

    metadata = entity.entity_metadata or {}
    return {
        "email": entity.email or fallback.get("email"),
        "full_name": entity.display_name
        or f"{entity.first_name or ''} {entity.last_name or ''}".strip()
        or fallback.get("full_name")
        or None,
        "poste": metadata.get("poste") or fallback.get("poste"),
        "department": metadata.get("department") or fallback.get("department"),
        "phone": entity.phone or fallback.get("phone"),
    }


def _to_domain(user: SqlAlchemyUser) -> DomainUser:
    """Map an ORM User (identity in linked Entity) to the domain User."""
    identity = _entity_identity(user.entity, user)
    return DomainUser(
        id=user.id,
        entity_id=str(user.entity_id) if user.entity_id else user.id,
        password_hash=user.password_hash,
        role=user.role,
        access_level=user.access_level,
        is_active=bool(user.is_active),
        **identity,
    )


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
        """Ensure the admin exists and only repairs known stale bootstrap hashes."""
        entity = self.db.query(Entity).filter(Entity.email == ADMIN_EMAIL).first()
        if entity is None:
            entity = Entity(
                type="user",
                status="active",
                email=ADMIN_EMAIL,
                display_name="Administrateur EGS",
                phone="",
                entity_metadata={"role": "admin", "department": "Direction", "poste": "Administrateur"},
            )
            self.db.add(entity)
            self.db.commit()
            self.db.refresh(entity)

        existing = self.db.query(SqlAlchemyUser).filter(SqlAlchemyUser.id == ADMIN_USER_ID).first()
        admin_password = os.getenv("INITIAL_ADMIN_PASSWORD", "Admin@EGS2025!")
        desired_hash = hash_password(admin_password)
        legacy_passwords = {
            "Admin@EGS2025!",
            "EgsAdminInitialPass2026Secure!",
            admin_password,
        }

        if existing is None:
            existing = SqlAlchemyUser(
                id=ADMIN_USER_ID,
                password_hash=desired_hash,
                role=RoleEnum.ADMIN.value,
                access_level=AccessLevelEnum.ADMIN.value,
                entity_id=entity.id,
            )
            self.db.add(existing)
            self.db.commit()
            self.db.refresh(existing)
            return

        if existing.entity_id != entity.id:
            existing.entity_id = entity.id
        if existing.role != RoleEnum.ADMIN.value:
            existing.role = RoleEnum.ADMIN.value
        if existing.access_level != AccessLevelEnum.ADMIN.value:
            existing.access_level = AccessLevelEnum.ADMIN.value

        is_known_stale_hash = any(
            verify_password(candidate, existing.password_hash)
            for candidate in legacy_passwords
            if candidate
        )
        if is_known_stale_hash and not verify_password(admin_password, existing.password_hash):
            existing.password_hash = desired_hash

        self.db.commit()
        self.db.refresh(existing)

    def get_by_email(self, email: str) -> DomainUser | None:
        if email.strip().lower() == ADMIN_EMAIL:
            self._seed_default_admin()
        user = (
            self.db.query(SqlAlchemyUser)
            .join(Entity, Entity.id == SqlAlchemyUser.entity_id)
            .filter(Entity.email == email)
            .first()
        )
        return _to_domain(user) if user else None

    def get_by_id(self, user_id: str) -> DomainUser | None:
        user = self.db.query(SqlAlchemyUser).filter(SqlAlchemyUser.id == user_id).first()
        return _to_domain(user) if user else None

    def get_all(self) -> list[DomainUser]:
        users = self.db.query(SqlAlchemyUser).order_by(SqlAlchemyUser.id).all()
        return [_to_domain(user) for user in users]

    def update(self, user_id: str, payload: dict[str, Any]) -> DomainUser | None:
        user = self.db.query(SqlAlchemyUser).filter(SqlAlchemyUser.id == user_id).first()
        if not user:
            return None

        # Auth-specific fields stay on the user.
        if "role" in payload and payload["role"] is not None:
            value = payload["role"]
            if isinstance(value, str):
                value = self._coerce_enum(RoleEnum, value, RoleEnum.EMPLOYE).value
            user.role = value
        if "access_level" in payload and payload["access_level"] is not None:
            value = payload["access_level"]
            if isinstance(value, str):
                value = self._coerce_enum(AccessLevelEnum, value, AccessLevelEnum.EMPLOYE).value
            user.access_level = value
        if "password_hash" in payload and payload["password_hash"]:
            user.password_hash = payload["password_hash"]

        # Identity fields are written to the linked Entity (single source of truth).
        if user.entity and payload:
            self._apply_entity_update(user.entity, payload)

        self.db.commit()
        self.db.refresh(user)
        return _to_domain(user)

    @staticmethod
    def _apply_entity_update(entity: Entity, payload: dict[str, Any]) -> None:
        if "email" in payload and payload["email"] is not None:
            entity.email = payload["email"].lower()
        if "phone" in payload and payload["phone"] is not None:
            entity.phone = payload["phone"]
        full_name = payload.get("full_name")
        if full_name:
            parts = full_name.strip().split(" ", 1)
            entity.first_name = parts[0]
            entity.last_name = parts[1].strip() if len(parts) > 1 else None
            entity.display_name = full_name.strip()
        metadata = dict(entity.entity_metadata or {})
        if "poste" in payload and payload["poste"] is not None:
            metadata["poste"] = payload["poste"]
        if "department" in payload and payload["department"] is not None:
            metadata["department"] = payload["department"]
        entity.entity_metadata = metadata

    def delete(self, user_id: str) -> bool:
        user = self.db.query(SqlAlchemyUser).filter(SqlAlchemyUser.id == user_id).first()
        if not user:
            return False
        self.db.delete(user)
        self.db.commit()
        return True

    def create(self, payload: dict[str, Any]) -> DomainUser:
        email = (payload.get("email") or "").strip().lower() or None
        entity = self.db.query(Entity).filter(Entity.email == email).first() if email else None
        if not entity and email:
            full_name = payload.get("full_name", "") or ""
            parts = full_name.strip().split(" ", 1)
            entity = Entity(
                type="user",
                status="pending",
                email=email,
                first_name=parts[0] if parts else None,
                last_name=parts[1].strip() if len(parts) > 1 else None,
                phone=payload.get("phone"),
                entity_metadata={
                    "role": payload.get("role", "employe"),
                    "department": payload.get("department"),
                    "poste": payload.get("poste"),
                },
            )
            self.db.add(entity)
            self.db.commit()
            self.db.refresh(entity)

        email_value = (payload.get("email") or "").strip().lower()
        full_name_value = (payload.get("full_name") or "").strip() or email_value
        role_value = self._coerce_enum(RoleEnum, payload.get("role"), RoleEnum.EMPLOYE).value
        access_value = self._coerce_enum(AccessLevelEnum, payload.get("access_level", "employe"), AccessLevelEnum.EMPLOYE).value

        user = SqlAlchemyUser(
            id=f"local-user-{int(time.time() * 1000)}",
            email=email_value,
            full_name=full_name_value,
            password_hash=hash_password(payload["password"]),
            role=role_value,
            access_level=access_value,
            poste=payload.get("poste"),
            department=payload.get("department"),
            phone=payload.get("phone"),
            entity_id=entity.id if entity else None,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return _to_domain(user)
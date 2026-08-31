"""User repository with SQLAlchemy backend."""
from __future__ import annotations

import os
import uuid
from typing import Any
import time
import enum
from sqlalchemy.orm import Session
from app.core.security import hash_password, verify_password
from app.models.entity import Entity
from app.models.user import User, RoleEnum, AccessLevelEnum

ADMIN_USER_ID = "00000000-0000-0000-0000-000000000001"
ADMIN_EMAIL = "admin@egs.local"


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
        """Ensure admin Entity and User exist and stay aligned with the configured admin password."""
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

        admin = self.db.query(User).filter(User.id == ADMIN_USER_ID).first()
        admin_password = os.getenv("INITIAL_ADMIN_PASSWORD", "Admin@EGS2025!")
        desired_hash = hash_password(admin_password)

        if admin is None:
            admin = User(
                id=ADMIN_USER_ID,
                email=ADMIN_EMAIL,
                full_name="Administrateur EGS",
                password_hash=desired_hash,
                role=RoleEnum.ADMIN.value,
                access_level=AccessLevelEnum.ADMIN.value,
                entity_id=entity.id,
            )
            self.db.add(admin)
            self.db.commit()
            return

        if admin.entity_id != entity.id:
            admin.entity_id = entity.id
        if admin.role != RoleEnum.ADMIN.value:
            admin.role = RoleEnum.ADMIN.value
        if admin.access_level != AccessLevelEnum.ADMIN.value:
            admin.access_level = AccessLevelEnum.ADMIN.value
        if not verify_password(admin_password, admin.password_hash):
            admin.password_hash = desired_hash

        self.db.commit()

    def get_by_email(self, email: str) -> dict[str, Any] | None:
        if email == ADMIN_EMAIL:
            self._ensure_default_admin()

        # JOIN avec Entity car l'email est désormais dans Entity
        user = (
            self.db.query(User)
            .join(Entity, User.entity_id == Entity.id)
            .filter(Entity.email == email)
            .first()
        )
        if user:
            return user.to_dict() | {"password_hash": user.password_hash}
        return None

    def get_by_id(self, user_id: str) -> dict[str, Any] | None:
        user = self.db.query(User).filter(User.id == user_id).first()
        if user:
            return user.to_dict() | {"password_hash": user.password_hash}
        return None

    def get_all(self) -> list[dict[str, Any]]:
        # JOIN pour pouvoir trier par le nom dans Entity
        users = (
            self.db.query(User)
            .join(Entity, User.entity_id == Entity.id)
            .order_by(Entity.display_name)
            .all()
        )
        return [user.to_dict() | {"password_hash": user.password_hash} for user in users]

    def update(self, user_id: str, payload: dict[str, Any]) -> dict[str, Any] | None:
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user or not user.entity:
            return None

        if "password_hash" in payload and payload["password_hash"] is not None:
            user.password_hash = payload["password_hash"]

        # 1. Mettre à jour les champs spécifiques à User
        for field in ("role", "access_level"):
            if field in payload and payload[field] is not None:
                value = payload[field]
                if field == "role":
                    value = _coerce_enum(RoleEnum, value, RoleEnum.EMPLOYE).value
                elif field == "access_level":
                    value = _coerce_enum(AccessLevelEnum, value, AccessLevelEnum.EMPLOYE).value
                setattr(user, field, value)

        # 2. Mettre à jour les champs d'identité dans Entity
        entity_fields = ("display_name", "first_name", "last_name", "email", "phone")
        for field in entity_fields:
            if field in payload and payload[field] is not None:
                setattr(user.entity, field, payload[field])
                if field == "email":
                    user.email = payload[field]
                
        # Anciens champs mappés vers entity_metadata
        if "poste" in payload or "department" in payload or "full_name" in payload:
            metadata = user.entity.entity_metadata or {}
            if "poste" in payload: 
                metadata["poste"] = payload["poste"]
            if "department" in payload: 
                metadata["department"] = payload["department"]
            if "full_name" in payload:
                user.entity.display_name = payload["full_name"]
                parts = payload["full_name"].split(" ", 1)
                user.entity.first_name = parts[0]
                user.entity.last_name = parts[1] if len(parts) > 1 else ""
            user.entity.entity_metadata = metadata

        self.db.commit()
        self.db.refresh(user)
        return user.to_dict() | {"password_hash": user.password_hash}

    def delete(self, user_id: str) -> bool:
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return False

        self.db.delete(user)
        # Optionnel : supprimer l'entité associée si elle n'est pas partagée
        # if user.entity: self.db.delete(user.entity)
        self.db.commit()
        return True

    def create(self, payload: dict[str, Any]) -> dict[str, Any]:
        # 1. Créer d'abord l'Entité (source de vérité pour l'identité)
        new_entity_id = str(uuid.uuid4())
        full_name = payload.get("full_name", "")
        parts = full_name.split(" ", 1) if full_name else ["", ""]
        
        entity = Entity(
            id=new_entity_id,
            type="user",
            status="active",
            email=payload["email"],
            display_name=full_name or payload["email"],
            first_name=parts[0],
            last_name=parts[1] if len(parts) > 1 else "",
            phone=payload.get("phone", ""),
            entity_metadata={
                "poste": payload.get("poste", ""),
                "department": payload.get("department", "")
            }
        )
        self.db.add(entity)
        self.db.flush()  # Pour obtenir l'ID de l'entité avant de créer l'utilisateur

        # 2. Créer l'Utilisateur lié à cette Entité
        user = User(
            id=f"local-user-{int(time.time() * 1000)}",
            email=payload["email"],
            full_name=full_name or payload["email"],
            password_hash=hash_password(payload["password"]),
            role=_coerce_enum(RoleEnum, payload.get("role"), RoleEnum.EMPLOYE).value,
            access_level=_coerce_enum(AccessLevelEnum, payload.get("access_level"), AccessLevelEnum.EMPLOYE).value,
            entity_id=new_entity_id,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user.to_dict() | {"password_hash": user.password_hash}


def seed_system(db: Session) -> None:
    """Create and normalize the default admin account at startup.

    Only known bootstrap hashes are repaired; a user-driven admin password reset
    must remain intact and must not be overwritten by the env default.
    """
    entity = db.query(Entity).filter(Entity.email == ADMIN_EMAIL).first()
    if entity is None:
        entity = Entity(
            type="user",
            status="active",
            email=ADMIN_EMAIL,
            display_name="Administrateur EGS",
            phone="",
            entity_metadata={"role": "admin", "department": "Direction", "poste": "Administrateur"},
        )
        db.add(entity)
        db.commit()
        db.refresh(entity)

    admin = db.query(User).filter(User.id == ADMIN_USER_ID).first()
    admin_password = os.getenv("INITIAL_ADMIN_PASSWORD", "Admin@EGS2025!")
    desired_hash = hash_password(admin_password)
    legacy_passwords = {
        "Admin@EGS2025!",
        "EgsAdminInitialPass2026Secure!",
        admin_password,
    }
    repair_flag = os.getenv("AUTO_RESET_DEFAULT_ADMIN_PASSWORD", "false").strip().lower() == "true"

    if admin is None:
        admin = User(
            id=ADMIN_USER_ID,
            password_hash=desired_hash,
            role=RoleEnum.ADMIN.value,
            access_level=AccessLevelEnum.ADMIN.value,
            entity_id=entity.id,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        return

    if admin.entity_id != entity.id:
        admin.entity_id = entity.id
    if admin.role != RoleEnum.ADMIN.value:
        admin.role = RoleEnum.ADMIN.value
    if admin.access_level != AccessLevelEnum.ADMIN.value:
        admin.access_level = AccessLevelEnum.ADMIN.value

    is_known_stale_hash = any(
        verify_password(candidate, admin.password_hash)
        for candidate in legacy_passwords
        if candidate
    )
    if repair_flag and not verify_password(admin_password, admin.password_hash):
        admin.password_hash = desired_hash
    elif is_known_stale_hash and not verify_password(admin_password, admin.password_hash):
        admin.password_hash = desired_hash

    db.commit()
    db.refresh(admin)
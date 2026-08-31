from __future__ import annotations

import os
import time
from abc import ABC, abstractmethod
from typing import Any

from app.core.security import hash_password
from app.domain.user import User


class UserRepositoryPort(ABC):
    @abstractmethod
    def get_by_email(self, email: str) -> User | None:
        raise NotImplementedError

    @abstractmethod
    def get_by_id(self, user_id: str) -> User | None:
        raise NotImplementedError

    @abstractmethod
    def get_all(self) -> list[User]:
        raise NotImplementedError

    @abstractmethod
    def update(self, user_id: str, payload: dict[str, Any]) -> User | None:
        raise NotImplementedError

    @abstractmethod
    def delete(self, user_id: str) -> bool:
        raise NotImplementedError

    @abstractmethod
    def create(self, payload: dict[str, Any]) -> User:
        raise NotImplementedError


class InMemoryUserRepository(UserRepositoryPort):
    def __init__(self) -> None:
        self._users_by_email: dict[str, User] = {}
        self._users_by_id: dict[str, User] = {}
        self._seed_default_admin()

    def _seed_default_admin(self) -> None:
        if self._users_by_email:
            return
        admin_password = os.getenv("INITIAL_ADMIN_PASSWORD", "Admin@EGS2025!")
        admin = User(
            id="local-admin",
            entity_id="local-admin-entity",
            email="admin@egs.local",
            password_hash=hash_password(admin_password),
            full_name="Admin Local",
            role="admin",
            access_level="admin",
            poste="Administrateur",
            department="IT",
            phone="+22500000000",
        )
        self._users_by_email[admin.email] = admin
        self._users_by_id[admin.id] = admin

    def get_by_email(self, email: str) -> User | None:
        return self._users_by_email.get(email)

    def get_by_id(self, user_id: str) -> User | None:
        return self._users_by_id.get(user_id)

    def get_all(self) -> list[User]:
        return list(self._users_by_id.values())

    def update(self, user_id: str, payload: dict[str, Any]) -> User | None:
        user = self._users_by_id.get(user_id)
        if not user:
            return None
        for field in ("full_name", "role", "access_level", "poste", "department", "phone", "email", "entity_id"):
            if field in payload and payload[field] is not None:
                setattr(user, field, payload[field])
        if "password_hash" in payload and payload["password_hash"] is not None:
            user.password_hash = payload["password_hash"]
        return user

    def delete(self, user_id: str) -> bool:
        user = self._users_by_id.pop(user_id, None)
        if not user:
            return False
        self._users_by_email.pop(user.email, None)
        return True

    def create(self, payload: dict[str, Any]) -> User:
        user = User(
            id=f"local-user-{int(time.time() * 1000)}",
            entity_id=f"local-entity-{int(time.time() * 1000)}",
            email=payload["email"],
            password_hash=hash_password(payload["password"]),
            full_name=payload.get("full_name", ""),
            role=payload.get("role") or "employe",
            access_level=payload.get("access_level", "employe"),
            poste=payload.get("poste"),
            department=payload.get("department"),
            phone=payload.get("phone"),
        )
        self._users_by_email[user.email] = user
        self._users_by_id[user.id] = user
        return user

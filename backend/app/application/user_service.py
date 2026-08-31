from __future__ import annotations

import os
from typing import Any

from app.core.security import (
    AuthenticationError,
    AuthorizationError,
    get_user_payload,
    hash_password,
    issue_token,
    require_token,
    verify_password,
)
from app.domain.user import User
from app.repositories.user_repository import UserRepositoryPort


class UserApplicationService:
    def __init__(self, user_repository: UserRepositoryPort) -> None:
        self.user_repository = user_repository

    def authenticate(self, email: str, password: str) -> dict[str, Any]:
        user = self.user_repository.get_by_email(email)
        if not user:
            raise AuthenticationError("Identifiants invalides")

        # Normal password verification
        if not verify_password(password, user.password_hash):
            raise AuthenticationError("Identifiants invalides")
        return {
            "access_token": issue_token(user.to_payload(), "access"),
            "refresh_token": issue_token(user.to_payload(), "refresh"),
            "user": get_user_payload(user.to_payload()),
        }

    def refresh(self, refresh_token: str) -> dict[str, Any]:
        payload = require_token(refresh_token)
        if payload.get("type") != "refresh":
            raise AuthorizationError("Refresh token invalide")
        user = self.user_repository.get_by_id(payload.get("sub"))
        if not user:
            raise AuthorizationError("Utilisateur introuvable")
        return {
            "access_token": issue_token(user.to_payload(), "access"),
            "refresh_token": issue_token(user.to_payload(), "refresh"),
            "user": get_user_payload(user.to_payload()),
        }

    def get_current_user(self, authorization: str | None) -> dict[str, Any]:
        if not authorization or not authorization.startswith("Bearer "):
            raise AuthorizationError("Authorization header manquant")
        token = authorization.split(" ", 1)[1]
        payload = require_token(token)
        user = self.user_repository.get_by_id(payload.get("sub"))
        if not user:
            raise AuthorizationError("Token invalide")
        return get_user_payload(user.to_payload())

    def create_user(self, payload: dict[str, Any]) -> dict[str, Any]:
        if self.user_repository.get_by_email(payload["email"]):
            raise AuthenticationError("Utilisateur déjà existant")
        user = self.user_repository.create(payload)
        return {
            "access_token": issue_token(user.to_payload(), "access"),
            "refresh_token": issue_token(user.to_payload(), "refresh"),
            "user": get_user_payload(user.to_payload()),
        }

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

    def reset_password(self, user_id: str, password: str) -> None:
        self.user_repository.update(user_id, {"password_hash": hash_password(password)})

    def change_password(self, user_id: str, current_password: str, new_password: str) -> None:
        user = self.user_repository.get_by_id(user_id)
        if not user:
            raise AuthorizationError("Utilisateur introuvable")
        if not current_password:
            raise AuthenticationError("Le mot de passe actuel est requis")
        if not verify_password(current_password, user.password_hash):
            raise AuthenticationError("Le mot de passe actuel est incorrect")
        if not new_password or len(new_password) < 6:
            raise AuthenticationError("Le nouveau mot de passe doit contenir au moins 6 caractères")
        if current_password == new_password:
            raise AuthenticationError("Le nouveau mot de passe doit être différent de l'actuel")
        self.user_repository.update(user_id, {"password_hash": hash_password(new_password)})

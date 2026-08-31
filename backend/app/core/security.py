import hashlib
import os
import time
from typing import Any

import jwt
from fastapi import HTTPException
from passlib.hash import bcrypt

from app.core.config import settings


class AuthenticationError(Exception):
    """Raised when authentication fails."""


class AuthorizationError(Exception):
    """Raised when a token is invalid or missing."""


def hash_password(password: str) -> str:
    return bcrypt.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.verify(password, password_hash)
    except Exception:
        return False


def issue_token(user: dict[str, Any], token_type: str) -> str:
    now = int(time.time())
    ttl = settings.ACCESS_TOKEN_TTL_SECONDS if token_type == "access" else settings.REFRESH_TOKEN_TTL_SECONDS
    payload = {
        "sub": user["id"],
        "email": user["email"],
        "type": token_type,
        "iat": now,
        "exp": now + ttl,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


def require_token(token: str | None) -> dict[str, Any]:
    if not token:
        raise AuthorizationError("Authorization header manquant")
    try:
        return decode_token(token)
    except jwt.InvalidTokenError as exc:
        raise AuthorizationError("Token invalide") from exc


def get_user_payload(user: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": user["id"],
        "entity_id": user.get("entity_id") or user["id"],
        "email": user.get("email") or "",
        "full_name": user.get("full_name") or "",
        "role": user.get("role", "employe"),
        "access_level": user.get("access_level", "employe"),
        "poste": user.get("poste"),
        "department": user.get("department"),
        "phone": user.get("phone"),
    }


def get_http_exception_for_error(exc: Exception) -> HTTPException:
    if isinstance(exc, AuthenticationError):
        return HTTPException(status_code=401, detail="Identifiants invalides")
    if isinstance(exc, AuthorizationError):
        return HTTPException(status_code=401, detail=str(exc))
    return HTTPException(status_code=500, detail="Erreur interne")

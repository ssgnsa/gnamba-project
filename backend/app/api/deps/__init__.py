"""Dependencies for API routes."""
from typing import Any

from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import AuthorizationError
from app.infrastructure.sqlalchemy_user_repository import SqlAlchemyUserRepository
from app.repositories.user_repository import UserRepositoryPort
from app.services.auth_service import AuthService
from app.services.media_service import MediaService


def get_user_repository(db: Session = Depends(get_db)) -> UserRepositoryPort:
    """Get the SQLAlchemy-backed user repository."""
    return SqlAlchemyUserRepository(db)


def get_auth_service(
    user_repository: UserRepositoryPort = Depends(get_user_repository),
) -> AuthService:
    """Get the auth service."""
    return AuthService(user_repository)


def get_current_user(
    authorization: str | None = Header(default=None),
    auth_service: AuthService = Depends(get_auth_service),
) -> dict[str, Any]:
    """Dependency to extract and validate the current user from the Authorization header."""
    return auth_service.get_current_user(authorization)


def get_optional_current_user(
    authorization: str | None = Header(default=None),
    auth_service: AuthService = Depends(get_auth_service),
) -> dict[str, Any] | None:
    """Return the current user when auth is present, otherwise None."""
    if not authorization:
        return None
    try:
        return auth_service.get_current_user(authorization)
    except AuthorizationError:
        return None


def get_media_service() -> MediaService:
    """Get the media application service."""
    return MediaService()

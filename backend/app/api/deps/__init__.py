"""Dependencies for API routes."""
from typing import Any

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.mail import PasswordResetMailer, SmtpPasswordResetMailer
from app.core.authorization import has_permission
from app.infrastructure.auth_state_repository import SqlAlchemyAuthStateRepository
from app.infrastructure.sqlalchemy_user_repository import SqlAlchemyUserRepository
from app.repositories.user_repository import UserRepositoryPort
from app.services.auth_service import AuthService
from app.services.media_service import MediaService


def get_user_repository(db: Session = Depends(get_db)) -> UserRepositoryPort:
    """Get the SQLAlchemy-backed user repository."""
    return SqlAlchemyUserRepository(db)


def get_auth_service(
    user_repository: UserRepositoryPort = Depends(get_user_repository),
    db: Session = Depends(get_db),
) -> AuthService:
    """Get the auth service."""
    return AuthService(user_repository, SqlAlchemyAuthStateRepository(db))


def get_password_reset_mailer() -> PasswordResetMailer:
    return SmtpPasswordResetMailer()


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
    # Never downgrade an invalid credential to an anonymous request.
    return auth_service.get_current_user(authorization)


def require_admin_user(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Require an authenticated administrator for administrative mutations."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Accès refusé")
    if current_user.get("mfa_verified") is not True:
        raise HTTPException(status_code=403, detail="Vérification MFA requise pour le rôle Admin")
    return current_user


def require_permission(
    module: str,
    action: str,
    *,
    resource: str | None = None,
):
    """Create a centralized FastAPI dependency for a module/action permission."""

    def dependency(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
        if not has_permission(current_user, module, action, resource=resource):
            raise HTTPException(status_code=403, detail="Permission insuffisante")
        return current_user

    return dependency


def enforce_permission(
    current_user: dict[str, Any] | None,
    module: str,
    action: str,
    *,
    resource: str | None = None,
) -> dict[str, Any]:
    """Apply the central policy when the resource is selected dynamically."""
    if not has_permission(current_user, module, action, resource=resource):
        raise HTTPException(status_code=403, detail="Permission insuffisante")
    return current_user or {}


def get_media_service() -> MediaService:
    """Get the media application service."""
    return MediaService()

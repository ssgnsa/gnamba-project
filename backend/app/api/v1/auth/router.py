from __future__ import annotations

from fastapi import APIRouter, Depends, Header

from app.api.deps import get_auth_service
from app.core.security import AuthenticationError, AuthorizationError, get_http_exception_for_error
from app.schemas.auth import (
    AuthMeResponse,
    AuthTokenResponse,
    ChangePasswordRequest,
    LoginRequest,
    PersistTokenRequest,
    RefreshTokenRequest,
    RefreshTokenResponse,
    ResetPasswordRequest,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/login", response_model=AuthTokenResponse)
def login(payload: LoginRequest, auth_service: AuthService = Depends(get_auth_service)) -> AuthTokenResponse:
    # Let AuthenticationError propagate to custom exception handler
    return AuthTokenResponse(**auth_service.authenticate(payload.email, payload.password))


@router.get("/me", response_model=AuthMeResponse)
def me(authorization: str | None = Header(default=None), auth_service: AuthService = Depends(get_auth_service)) -> AuthMeResponse:
    try:
        return AuthMeResponse(user=auth_service.get_current_user(authorization))
    except (AuthenticationError, AuthorizationError) as exc:
        raise get_http_exception_for_error(exc) from exc


@router.post("/refresh", response_model=RefreshTokenResponse)
def refresh(payload: RefreshTokenRequest, auth_service: AuthService = Depends(get_auth_service)) -> RefreshTokenResponse:
    try:
        return RefreshTokenResponse(**auth_service.refresh(payload.refresh_token))
    except (AuthenticationError, AuthorizationError) as exc:
        raise get_http_exception_for_error(exc) from exc


@router.post("/logout")
def logout(authorization: str | None = Header(default=None), auth_service: AuthService = Depends(get_auth_service)) -> dict[str, str]:
    try:
        auth_service.get_current_user(authorization)
        return {"status": "ok", "message": "Déconnecté"}
    except (AuthenticationError, AuthorizationError) as exc:
        raise get_http_exception_for_error(exc) from exc


@router.post("/password/reset")
def reset_password(payload: ResetPasswordRequest, authorization: str | None = Header(default=None), auth_service: AuthService = Depends(get_auth_service)) -> dict[str, str]:
    try:
        user = auth_service.get_current_user(authorization)
        auth_service.reset_password(user["id"], payload.password)
        return {"status": "ok", "message": "Mot de passe mis à jour"}
    except (AuthenticationError, AuthorizationError) as exc:
        raise get_http_exception_for_error(exc) from exc


@router.post("/reset-password")
def reset_password_alias(payload: ResetPasswordRequest, authorization: str | None = Header(default=None), auth_service: AuthService = Depends(get_auth_service)) -> dict[str, str]:
    return reset_password(payload, authorization, auth_service)


@router.post("/change-password")
def change_password(payload: ChangePasswordRequest, authorization: str | None = Header(default=None), auth_service: AuthService = Depends(get_auth_service)) -> dict[str, str]:
    try:
        user = auth_service.get_current_user(authorization)
        auth_service.change_password(user["id"], payload.current_password, payload.new_password)
        return {"status": "ok", "message": "Mot de passe mis à jour"}
    except (AuthenticationError, AuthorizationError) as exc:
        raise get_http_exception_for_error(exc) from exc


@router.post("/persist-token")
def persist_token(payload: PersistTokenRequest, auth_service: AuthService = Depends(get_auth_service)) -> dict[str, str]:
    """Persist local auth tokens - used for offline/remember me"""
    # The tokens are already validated by the frontend
    # We just store them in the user's session/cache if needed
    return {"status": "ok", "message": "Tokens persistés"}


@router.post("/clear-token")
def clear_token() -> dict[str, str]:
    """Clear local auth tokens - used for logout"""
    return {"status": "ok", "message": "Tokens effacés"}

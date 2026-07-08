from __future__ import annotations

from fastapi import APIRouter, Depends, Header

from backend.app.api.deps import get_auth_service
from backend.app.core.security import AuthenticationError, AuthorizationError, get_http_exception_for_error
from backend.app.schemas.auth import (
    AuthMeResponse,
    AuthTokenResponse,
    LoginRequest,
    RefreshTokenRequest,
    RefreshTokenResponse,
    ResetPasswordRequest,
)
from backend.app.services.auth_service import AuthService

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=AuthTokenResponse)
def login(payload: LoginRequest, auth_service: AuthService = Depends(get_auth_service)) -> AuthTokenResponse:
    try:
        return AuthTokenResponse(**auth_service.authenticate(payload.email, payload.password))
    except (AuthenticationError, AuthorizationError) as exc:
        raise get_http_exception_for_error(exc) from exc


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


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, authorization: str | None = Header(default=None), auth_service: AuthService = Depends(get_auth_service)) -> dict[str, str]:
    try:
        user = auth_service.get_current_user(authorization)
        auth_service.reset_password(user["id"], payload.password)
        return {"status": "ok", "message": "Mot de passe mis à jour"}
    except (AuthenticationError, AuthorizationError) as exc:
        raise get_http_exception_for_error(exc) from exc

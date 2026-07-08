from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Header

from backend.app.api.deps import get_auth_service
from backend.app.core.security import AuthenticationError, AuthorizationError, get_http_exception_for_error
from backend.app.schemas.auth import AuthTokenResponse, CreateUserRequest, UpdateUserRequest, UserResponse
from backend.app.services.auth_service import AuthService

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.post("", response_model=AuthTokenResponse)
def create_user(payload: CreateUserRequest, auth_service: AuthService = Depends(get_auth_service)) -> AuthTokenResponse:
    try:
        return AuthTokenResponse(**auth_service.create_user(payload.model_dump()))
    except (AuthenticationError, AuthorizationError) as exc:
        raise get_http_exception_for_error(exc) from exc


@router.get("", response_model=list[UserResponse])
def list_users(authorization: str | None = Header(default=None), auth_service: AuthService = Depends(get_auth_service)) -> list[UserResponse]:
    try:
        current_user = auth_service.get_current_user(authorization)
        if current_user["role"] != "admin":
            raise AuthorizationError("Accès refusé")
        return [UserResponse(**user) for user in auth_service.list_users()]
    except (AuthenticationError, AuthorizationError) as exc:
        raise get_http_exception_for_error(exc) from exc


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(user_id: str, payload: UpdateUserRequest, authorization: str | None = Header(default=None), auth_service: AuthService = Depends(get_auth_service)) -> UserResponse:
    try:
        current_user = auth_service.get_current_user(authorization)
        if current_user["role"] != "admin":
            raise AuthorizationError("Accès refusé")
        return UserResponse(**auth_service.update_user(user_id, payload.model_dump(exclude_unset=True)))
    except (AuthenticationError, AuthorizationError) as exc:
        raise get_http_exception_for_error(exc) from exc


@router.delete("/{user_id}")
def delete_user(user_id: str, authorization: str | None = Header(default=None), auth_service: AuthService = Depends(get_auth_service)) -> dict[str, str]:
    try:
        current_user = auth_service.get_current_user(authorization)
        if current_user["role"] != "admin":
            raise AuthorizationError("Accès refusé")
        auth_service.delete_user(user_id)
        return {"status": "ok", "message": "Utilisateur supprimé"}
    except (AuthenticationError, AuthorizationError) as exc:
        raise get_http_exception_for_error(exc) from exc

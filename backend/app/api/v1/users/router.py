from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException

from app.api.deps import get_auth_service
from app.core.security import AuthenticationError, AuthorizationError, get_http_exception_for_error
from app.schemas.auth import CreateUserRequest, UpdateUserRequest, UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.post("", response_model=UserResponse)
def create_user(
    payload: CreateUserRequest,
    authorization: str | None = Header(default=None),
    auth_service: AuthService = Depends(get_auth_service),
) -> UserResponse:
    try:
        current_user = auth_service.get_current_user(authorization)
        if current_user.get("role") != "admin" or current_user.get("mfa_verified") is not True:
            raise HTTPException(status_code=403, detail="Accès refusé")
        if payload.role is not None or payload.access_level != "guest":
            raise HTTPException(status_code=403, detail="Une attribution de rôle exige une réauthentification step-up")
        return UserResponse(**auth_service.create_user(payload.model_dump()))
    except (AuthenticationError, AuthorizationError) as exc:
        raise get_http_exception_for_error(exc) from exc


@router.get("", response_model=list[UserResponse])
def list_users(authorization: str | None = Header(default=None), auth_service: AuthService = Depends(get_auth_service)) -> list[UserResponse]:
    try:
        current_user = auth_service.get_current_user(authorization)
        if current_user.get("role") != "admin" or current_user.get("mfa_verified") is not True:
            raise HTTPException(status_code=403, detail="Accès refusé")
        return [UserResponse(**user) for user in auth_service.list_users()]
    except (AuthenticationError, AuthorizationError) as exc:
        raise get_http_exception_for_error(exc) from exc


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(user_id: str, payload: UpdateUserRequest, authorization: str | None = Header(default=None), auth_service: AuthService = Depends(get_auth_service)) -> UserResponse:
    try:
        current_user = auth_service.get_current_user(authorization)
        if current_user.get("role") != "admin" or current_user.get("mfa_verified") is not True:
            raise HTTPException(status_code=403, detail="Accès refusé")
        updates = payload.model_dump(exclude_unset=True)
        if "role" in updates or "access_level" in updates:
            raise HTTPException(status_code=403, detail="Un changement de rôle exige une réauthentification step-up")
        return UserResponse(**auth_service.update_user(user_id, updates))
    except (AuthenticationError, AuthorizationError) as exc:
        raise get_http_exception_for_error(exc) from exc


@router.delete("/{user_id}")
def delete_user(user_id: str, authorization: str | None = Header(default=None), auth_service: AuthService = Depends(get_auth_service)) -> dict[str, str]:
    try:
        current_user = auth_service.get_current_user(authorization)
        if current_user.get("role") != "admin" or current_user.get("mfa_verified") is not True:
            raise HTTPException(status_code=403, detail="Accès refusé")
        raise HTTPException(status_code=403, detail="La désactivation motivée du compte est requise; suppression refusée")
    except (AuthenticationError, AuthorizationError) as exc:
        raise get_http_exception_for_error(exc) from exc

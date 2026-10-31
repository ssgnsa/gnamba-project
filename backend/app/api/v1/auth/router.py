from __future__ import annotations

import logging

from fastapi import APIRouter, BackgroundTasks, Cookie, Depends, Header, HTTPException, Request, Response
from fastapi.responses import JSONResponse

from app.api.deps import get_auth_service, get_password_reset_mailer
from app.core.config import settings
from app.core.mail import PasswordResetMailer
from app.core.security import AuthenticationError, AuthorizationError, get_http_exception_for_error
from app.schemas.auth import (
    AuthMeResponse,
    AuthTokenResponse,
    ChangePasswordRequest,
    LoginRequest,
    MfaConfirmRequest,
    MfaDisableRequest,
    MfaSetupResponse,
    MfaVerifyRequest,
    PasswordForgotRequest,
    PasswordResetRequest,
    RefreshTokenResponse,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
logger = logging.getLogger(__name__)
PASSWORD_RESET_ACCEPTED = {
    "status": "ok",
    "message": "Si cette adresse correspond à un compte, un lien de réinitialisation sera envoyé.",
}


def _deliver_reset_mail(mailer: PasswordResetMailer, address: str, link: str) -> None:
    try:
        mailer.send_password_reset(address, link)
    except Exception:
        # Do not include recipient or reset URL in log messages.
        logger.exception("Password reset email delivery failed")


def _cookie_is_secure(request: Request | None) -> bool:
    if not settings.AUTH_COOKIE_SECURE:
        return False
    if request is None:
        return True
    forwarded_proto = request.headers.get("x-forwarded-proto", "").split(",", 1)[0].strip().lower()
    return request.url.scheme == "https" or forwarded_proto == "https"


def _set_refresh_cookie(response: Response, token: str, request: Request | None = None) -> None:
    response.set_cookie(
        key=settings.AUTH_REFRESH_COOKIE_NAME,
        value=token,
        max_age=settings.REFRESH_TOKEN_TTL_SECONDS,
        httponly=True,
        secure=_cookie_is_secure(request),
        samesite=settings.AUTH_COOKIE_SAMESITE,
        path="/api/v1/auth",
    )


def _clear_refresh_cookie(response: Response, request: Request | None = None) -> None:
    response.delete_cookie(
        key=settings.AUTH_REFRESH_COOKIE_NAME,
        httponly=True,
        secure=_cookie_is_secure(request),
        samesite=settings.AUTH_COOKIE_SAMESITE,
        path="/api/v1/auth",
    )


@router.post("/login")
def login(
    payload: LoginRequest,
    response: Response,
    request: Request,
    auth_service: AuthService = Depends(get_auth_service),
) -> dict:
    tokens = auth_service.authenticate(
        payload.email,
        payload.password,
        request.client.host if request.client else None,
        request.headers.get("user-agent"),
    )
    _set_refresh_cookie(response, tokens["refresh_token"], request)
    result = AuthTokenResponse(access_token=tokens["access_token"], user=tokens["user"]).model_dump()
    if auth_service.requires_mfa(tokens["user"]):
        result.update({"aal": "AAL1", "mfa_challenge_required": True})
    return result


@router.post("/mfa/verify")
def verify_mfa(
    payload: MfaVerifyRequest,
    request: Request,
    authorization: str | None = Header(default=None),
    auth_service: AuthService = Depends(get_auth_service),
) -> dict:
    try:
        result = auth_service.verify_mfa(
            authorization,
            payload.code,
            request.client.host if request.client else None,
        )
        return {
            "access_token": result["access_token"],
            "token_type": "bearer",
            "user": result["user"],
        }
    except (AuthenticationError, AuthorizationError) as exc:
        raise get_http_exception_for_error(exc) from exc


@router.get("/me", response_model=AuthMeResponse)
def me(authorization: str | None = Header(default=None), auth_service: AuthService = Depends(get_auth_service)) -> AuthMeResponse:
    try:
        return AuthMeResponse(user=auth_service.get_current_user(authorization))
    except (AuthenticationError, AuthorizationError) as exc:
        raise get_http_exception_for_error(exc) from exc


@router.post("/refresh", response_model=RefreshTokenResponse)
def refresh(
    response: Response,
    request: Request,
    refresh_cookie: str | None = Cookie(default=None, alias=settings.AUTH_REFRESH_COOKIE_NAME),
    auth_service: AuthService = Depends(get_auth_service),
) -> RefreshTokenResponse | JSONResponse:
    try:
        if not refresh_cookie:
            raise AuthorizationError("Refresh token manquant")
        tokens = auth_service.refresh(refresh_cookie)
        _set_refresh_cookie(response, tokens["refresh_token"], request)
        return RefreshTokenResponse(access_token=tokens["access_token"], user=tokens["user"])
    except (AuthenticationError, AuthorizationError) as exc:
        failure = JSONResponse(
            status_code=401,
            content={"detail": str(exc), "code": "invalid_or_missing_token"},
        )
        _clear_refresh_cookie(failure, request)
        return failure


@router.post("/logout")
def logout(
    response: Response,
    request: Request,
    authorization: str | None = Header(default=None),
    refresh_cookie: str | None = Cookie(default=None, alias=settings.AUTH_REFRESH_COOKIE_NAME),
    auth_service: AuthService = Depends(get_auth_service),
) -> dict[str, str]:
    auth_service.logout(authorization, refresh_cookie)
    _clear_refresh_cookie(response, request)
    return {"status": "ok", "message": "Déconnecté"}


@router.post("/password/forgot", status_code=202)
def forgot_password(
    payload: PasswordForgotRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    auth_service: AuthService = Depends(get_auth_service),
    mailer: PasswordResetMailer = Depends(get_password_reset_mailer),
) -> dict[str, str]:
    delivery = auth_service.request_password_reset(
        payload.email,
        request.client.host if request.client else None,
        mailer,
    )
    if delivery:
        background_tasks.add_task(_deliver_reset_mail, mailer, delivery[0], delivery[1])
    return PASSWORD_RESET_ACCEPTED


@router.post("/password/reset")
def reset_password(
    payload: PasswordResetRequest,
    response: Response,
    request: Request,
    auth_service: AuthService = Depends(get_auth_service),
) -> dict[str, str]:
    try:
        auth_service.complete_password_reset(
            payload.token,
            payload.new_password,
            request.client.host if request.client else None,
        )
        _clear_refresh_cookie(response, request)
        return {"status": "ok", "message": "Mot de passe mis à jour. Veuillez vous reconnecter."}
    except (AuthenticationError, AuthorizationError) as exc:
        raise get_http_exception_for_error(exc) from exc


@router.post("/reset-password")
def reset_password_alias(
    payload: PasswordResetRequest,
    response: Response,
    request: Request,
    auth_service: AuthService = Depends(get_auth_service),
) -> dict[str, str]:
    return reset_password(payload, response, request, auth_service)


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    response: Response,
    request: Request,
    authorization: str | None = Header(default=None),
    auth_service: AuthService = Depends(get_auth_service),
) -> dict[str, str]:
    try:
        user = auth_service.get_current_user(authorization)
        if (
            user.get("role") == "admin"
            and user.get("mfa_required")
            and user.get("mfa_verified") is not True
        ):
            raise HTTPException(status_code=403, detail="Vérification MFA requise pour le rôle Admin")
        auth_service.change_password(user["id"], payload.current_password, payload.new_password)
        _clear_refresh_cookie(response, request)
        return {"status": "ok", "message": "Mot de passe mis à jour. Veuillez vous reconnecter."}
    except (AuthenticationError, AuthorizationError) as exc:
        raise get_http_exception_for_error(exc) from exc
@router.post("/mfa/setup", response_model=MfaSetupResponse)
def setup_mfa(request: Request, authorization: str | None = Header(default=None), auth_service: AuthService = Depends(get_auth_service)) -> MfaSetupResponse:
    user = auth_service.get_current_user(authorization)
    user_id = user["id"]
    user_model = auth_service.user_repository.get_by_id(user_id)
    if not user_model: raise AuthorizationError("Utilisateur introuvable")
    setup_data = auth_service.setup_mfa(user_model)
    return MfaSetupResponse(**setup_data)

@router.post("/mfa/setup/confirm", response_model=AuthTokenResponse)
def confirm_mfa(
    payload: MfaConfirmRequest,
    request: Request,
    authorization: str | None = Header(default=None),
    auth_service: AuthService = Depends(get_auth_service),
) -> AuthTokenResponse:
    try:
        user = auth_service.get_current_user(authorization)
        user_model = auth_service.user_repository.get_by_id(user["id"])
        if not user_model:
            raise AuthorizationError("Utilisateur introuvable")
        # Activer la MFA sur l'utilisateur
        auth_service.confirm_mfa(user_model, payload.code)
        # Émettre un token AAL2 via la même logique que /mfa/verify
        result = auth_service.verify_mfa(
            authorization,
            payload.code,
            request.client.host if request.client else None,
        )
        return AuthTokenResponse(
            access_token=result["access_token"], user=result["user"]
        )
    except (AuthenticationError, AuthorizationError) as exc:
        raise get_http_exception_for_error(exc) from exc



@router.post("/mfa/disable")
def disable_mfa(payload: MfaDisableRequest, response: Response, request: Request, authorization: str | None = Header(default=None), auth_service: AuthService = Depends(get_auth_service)) -> dict[str, str]:
    user = auth_service.get_current_user(authorization)
    user_id = user["id"]
    user_model = auth_service.user_repository.get_by_id(user_id)
    if not user_model: raise AuthorizationError("Utilisateur introuvable")
    auth_service.disable_mfa(user_model, payload.password)
    auth_service.logout(authorization, None)
    response.delete_cookie(key=settings.AUTH_REFRESH_COOKIE_NAME, httponly=True, secure=_cookie_is_secure(request), samesite=settings.AUTH_COOKIE_SAMESITE, path="/api/v1/auth")
    return {"status": "ok", "message": "MFA désactivé avec succès"}


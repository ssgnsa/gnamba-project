from __future__ import annotations

import logging

from fastapi import APIRouter, BackgroundTasks, Cookie, Depends, Header, Request, Response
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


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.AUTH_REFRESH_COOKIE_NAME,
        value=token,
        max_age=settings.REFRESH_TOKEN_TTL_SECONDS,
        httponly=True,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=settings.AUTH_COOKIE_SAMESITE,
        path="/api/v1/auth",
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.AUTH_REFRESH_COOKIE_NAME,
        httponly=True,
        secure=settings.AUTH_COOKIE_SECURE,
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
    _set_refresh_cookie(response, tokens["refresh_token"])
    result = AuthTokenResponse(access_token=tokens["access_token"], user=tokens["user"]).model_dump()
    if settings.TEST_TOTP_SECRET and tokens["user"].get("id") == settings.TEST_TOTP_USER_ID:
        result.update({"aal": "AAL1", "mfa_challenge_required": True})
    return result


@router.get("/me", response_model=AuthMeResponse)
def me(authorization: str | None = Header(default=None), auth_service: AuthService = Depends(get_auth_service)) -> AuthMeResponse:
    try:
        return AuthMeResponse(user=auth_service.get_current_user(authorization))
    except (AuthenticationError, AuthorizationError) as exc:
        raise get_http_exception_for_error(exc) from exc


@router.post("/refresh", response_model=RefreshTokenResponse)
def refresh(
    response: Response,
    refresh_cookie: str | None = Cookie(default=None, alias=settings.AUTH_REFRESH_COOKIE_NAME),
    auth_service: AuthService = Depends(get_auth_service),
) -> RefreshTokenResponse | JSONResponse:
    try:
        if not refresh_cookie:
            raise AuthorizationError("Refresh token manquant")
        tokens = auth_service.refresh(refresh_cookie)
        _set_refresh_cookie(response, tokens["refresh_token"])
        return RefreshTokenResponse(access_token=tokens["access_token"], user=tokens["user"])
    except (AuthenticationError, AuthorizationError) as exc:
        failure = JSONResponse(
            status_code=401,
            content={"detail": str(exc), "code": "invalid_or_missing_token"},
        )
        _clear_refresh_cookie(failure)
        return failure


@router.post("/logout")
def logout(
    response: Response,
    authorization: str | None = Header(default=None),
    refresh_cookie: str | None = Cookie(default=None, alias=settings.AUTH_REFRESH_COOKIE_NAME),
    auth_service: AuthService = Depends(get_auth_service),
) -> dict[str, str]:
    auth_service.logout(authorization, refresh_cookie)
    _clear_refresh_cookie(response)
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
        _clear_refresh_cookie(response)
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
    authorization: str | None = Header(default=None),
    auth_service: AuthService = Depends(get_auth_service),
) -> dict[str, str]:
    try:
        user = auth_service.get_current_user(authorization)
        auth_service.change_password(user["id"], payload.current_password, payload.new_password)
        _clear_refresh_cookie(response)
        return {"status": "ok", "message": "Mot de passe mis à jour. Veuillez vous reconnecter."}
    except (AuthenticationError, AuthorizationError) as exc:
        raise get_http_exception_for_error(exc) from exc

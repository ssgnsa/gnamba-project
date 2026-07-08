from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text

from backend.app.api.deps import get_current_user
from backend.app.core.database import SessionLocal
from backend.app.core.security import AuthorizationError, get_http_exception_for_error

router = APIRouter(prefix="/api/settings", tags=["settings"])
v1_settings_router = APIRouter(prefix="/api/v1/settings", tags=["settings"])


class SettingsRow(BaseModel):
    key: str
    value: str | None = None


class SettingsBulkRequest(BaseModel):
    items: list[SettingsRow]


class SiteContentRow(BaseModel):
    section: str
    key: str
    value: str | None = None


def _fetch_settings_rows() -> list[dict[str, Any]]:
    with SessionLocal() as session:
        rows = session.execute(
            text("SELECT key, value, updated_at FROM app_settings ORDER BY key")
        ).fetchall()
    return [
        {"key": row[0], "value": row[1] or "", "updated_at": row[2]}
        for row in rows
    ]


@router.get("", response_model=list[SettingsRow])
def list_settings() -> list[SettingsRow]:
    try:
        return [SettingsRow(**row) for row in _fetch_settings_rows()]
    except Exception as exc:  # pragma: no cover - defensive fallback
        return []


@router.post("", response_model=dict[str, str])
def upsert_settings(
    payload: SettingsBulkRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, str]:
    try:
        if current_user.get("role") != "admin":
            raise AuthorizationError("Accès refusé")

        with SessionLocal() as session:
            for item in payload.items:
                session.execute(
                    text(
                        """
                        INSERT INTO app_settings (key, value, updated_at)
                        VALUES (:key, :value, NOW())
                        ON CONFLICT (key) DO UPDATE
                        SET value = EXCLUDED.value,
                            updated_at = NOW()
                        """
                    ),
                    {"key": item.key, "value": item.value or ""},
                )
            session.commit()

        return {"status": "ok", "message": "Paramètres sauvegardés"}
    except AuthorizationError as exc:
        raise get_http_exception_for_error(exc) from exc
    except Exception as exc:  # pragma: no cover - defensive fallback
        raise get_http_exception_for_error(Exception(str(exc))) from exc


site_content_router = APIRouter(prefix="/api/site-content", tags=["site-content"])
v1_site_content_router = APIRouter(prefix="/api/v1/site-content", tags=["site-content"])


@site_content_router.get("", response_model=list[SiteContentRow])
def list_site_content() -> list[SiteContentRow]:
    try:
        with SessionLocal() as session:
            rows = session.execute(
                text("SELECT section, key, value FROM site_content ORDER BY section, key")
            ).fetchall()
        return [SiteContentRow(section=row[0], key=row[1], value=row[2] or "") for row in rows]
    except Exception:
        return []


router.include_router(site_content_router)

v1_settings_router.add_api_route(
    "",
    list_settings,
    methods=["GET"],
    response_model=list[SettingsRow],
)
v1_settings_router.add_api_route(
    "",
    upsert_settings,
    methods=["POST"],
    response_model=dict[str, str],
)
v1_site_content_router.add_api_route(
    "",
    list_site_content,
    methods=["GET"],
    response_model=list[SiteContentRow],
)

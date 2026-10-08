from __future__ import annotations

from typing import Any
# import json  # Not needed - value is stored as plain text

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text

from app.api.deps import require_admin_user
from app.core.database import SessionLocal
from app.core.security import AuthorizationError, get_http_exception_for_error

router = APIRouter(
    prefix="/api/v1/site-content",
    tags=["site-content"],
)


class SiteContentRow(BaseModel):
    section: str
    key: str
    value: str | None = None


@router.get("", response_model=list[SiteContentRow])
def list_site_content() -> list[SiteContentRow]:
    try:
        with SessionLocal() as session:
            rows = session.execute(
                text("SELECT section, key, value FROM site_content ORDER BY section, key")
            ).fetchall()
        return [SiteContentRow(section=row[0], key=row[1], value=row[2] or "") for row in rows]
    except Exception:
        return []


@router.get("/{section}", response_model=list[SiteContentRow])
def list_site_content_section(section: str) -> list[SiteContentRow]:
    try:
        with SessionLocal() as session:
            rows = session.execute(
                text("SELECT section, key, value FROM site_content WHERE section = :section ORDER BY key"),
                {"section": section},
            ).fetchall()
        return [SiteContentRow(section=row[0], key=row[1], value=row[2] or "") for row in rows]
    except Exception:
        return []


@router.get("/{section}/{key}", response_model=SiteContentRow)
def get_site_content(section: str, key: str) -> SiteContentRow:
    try:
        with SessionLocal() as session:
            row = session.execute(
                text("SELECT section, key, value FROM site_content WHERE section = :section AND key = :key"),
                {"section": section, "key": key},
            ).fetchone()
        if row:
            return SiteContentRow(section=row[0], key=row[1], value=row[2] or "")
        raise HTTPException(status_code=404, detail="Content not found")
    except Exception:
        raise HTTPException(status_code=404, detail="Content not found")


@router.post("", response_model=dict[str, str])
def upsert_site_content(
    payload: SiteContentRow,
    _admin: dict[str, Any] = Depends(require_admin_user),
) -> dict[str, str]:
    try:
        with SessionLocal() as session:
            session.execute(
                text(
                    """
                    INSERT INTO site_content (section, key, value, updated_at)
                    VALUES (:section, :key, :value, CURRENT_TIMESTAMP)
                    ON CONFLICT (section, key) DO UPDATE
                    SET value = EXCLUDED.value,
                        updated_at = CURRENT_TIMESTAMP
                    """
                ),
                {"section": payload.section, "key": payload.key, "value": payload.value or ""},
            )
            session.commit()

        return {"status": "ok", "message": "Contenu sauvegardé"}
    except Exception as exc:
        raise get_http_exception_for_error(Exception(str(exc))) from exc


@router.patch("/{content_id}", response_model=dict[str, str])
def patch_site_content(
    content_id: str,
    payload: SiteContentRow,
    _admin: dict[str, Any] = Depends(require_admin_user),
) -> dict[str, str]:
    try:
        with SessionLocal() as session:
            session.execute(
                text(
                    "UPDATE site_content SET section = :section, key = :key, value = :value, updated_at = CURRENT_TIMESTAMP WHERE id = :id"
                ),
                {"section": payload.section, "key": payload.key, "value": payload.value or "", "id": content_id},
            )
            session.commit()

        return {"status": "ok", "message": "Contenu mis à jour"}
    except Exception as exc:
        raise get_http_exception_for_error(Exception(str(exc))) from exc


@router.delete("/{content_id}", response_model=dict[str, str])
def delete_site_content(
    content_id: str,
    _admin: dict[str, Any] = Depends(require_admin_user),
) -> dict[str, str]:
    try:
        with SessionLocal() as session:
            session.execute(text("DELETE FROM site_content WHERE id = :id"), {"id": content_id})
            session.commit()
        return {"status": "ok", "message": "Contenu supprimé"}
    except Exception as exc:
        raise get_http_exception_for_error(Exception(str(exc))) from exc

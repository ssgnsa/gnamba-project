from __future__ import annotations

import mimetypes
from pathlib import Path
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.deps import enforce_permission, get_db, get_optional_current_user, require_permission
from app.services.storage_provider import LocalStorageProvider, get_storage_provider


router = APIRouter(tags=["storage"])


def is_public_storage_key(db: Session, storage_key: str) -> bool:
    """Allow anonymous reads only for assets referenced by public EGS content."""
    result = db.execute(
        text(
            """
            SELECT (
                EXISTS (
                    SELECT 1
                    FROM media_files m
                    WHERE (m.storage_key = :storage_key OR m.filename = :storage_key)
                      AND m.deleted_at IS NULL
                      AND (
                          m.is_brand_asset IS TRUE
                          OR EXISTS (
                              SELECT 1 FROM media_usage u
                              WHERE CAST(u.media_id AS TEXT) = CAST(m.id AS TEXT)
                                AND u.entity_type = 'brand'
                          )
                          OR EXISTS (
                              SELECT 1 FROM page_layouts p
                              WHERE p.is_published IS TRUE
                                AND CAST(p.og_image_media_id AS TEXT) = CAST(m.id AS TEXT)
                          )
                      )
                )
                OR EXISTS (
                    SELECT 1 FROM page_layouts p
                    WHERE p.is_published IS TRUE
                      AND (
                          POSITION(:storage_key IN COALESCE(CAST(p.sections AS TEXT), '')) > 0
                          OR POSITION(:encoded_storage_key IN COALESCE(CAST(p.sections AS TEXT), '')) > 0
                          OR POSITION(:storage_key IN COALESCE(CAST(p.layout_json AS TEXT), '')) > 0
                          OR POSITION(:encoded_storage_key IN COALESCE(CAST(p.layout_json AS TEXT), '')) > 0
                          OR POSITION(:storage_key IN COALESCE(CAST(p.layout AS TEXT), '')) > 0
                          OR POSITION(:encoded_storage_key IN COALESCE(CAST(p.layout AS TEXT), '')) > 0
                      )
                )
                OR EXISTS (
                    SELECT 1 FROM site_realisations s
                    WHERE s.publier_vitrine IS TRUE
                      AND (
                          POSITION(:storage_key IN COALESCE(CAST(s.image_url AS TEXT), '')) > 0
                          OR POSITION(:encoded_storage_key IN COALESCE(CAST(s.image_url AS TEXT), '')) > 0
                          OR POSITION(:storage_key IN COALESCE(CAST(s.photos AS TEXT), '')) > 0
                          OR POSITION(:encoded_storage_key IN COALESCE(CAST(s.photos AS TEXT), '')) > 0
                      )
                )
                OR EXISTS (
                    SELECT 1 FROM vitrine_lots v
                    WHERE (v.publier IS TRUE OR v.publier_sur_vitrine IS TRUE)
                      AND (
                          POSITION(:storage_key IN COALESCE(CAST(v.image_url AS TEXT), '')) > 0
                          OR POSITION(:encoded_storage_key IN COALESCE(CAST(v.image_url AS TEXT), '')) > 0
                          OR POSITION(:storage_key IN COALESCE(CAST(v.photos AS TEXT), '')) > 0
                          OR POSITION(:encoded_storage_key IN COALESCE(CAST(v.photos AS TEXT), '')) > 0
                      )
                )
                OR EXISTS (
                    SELECT 1 FROM site_content c
                    WHERE POSITION(:storage_key IN COALESCE(CAST(c.value AS TEXT), '')) > 0
                       OR POSITION(:encoded_storage_key IN COALESCE(CAST(c.value AS TEXT), '')) > 0
                       OR POSITION(:storage_key IN COALESCE(CAST(c.translations AS TEXT), '')) > 0
                       OR POSITION(:encoded_storage_key IN COALESCE(CAST(c.translations AS TEXT), '')) > 0
                )
                OR EXISTS (
                    SELECT 1 FROM app_settings a
                    WHERE a.is_public IS TRUE
                      AND (
                          POSITION(:storage_key IN COALESCE(CAST(a.value AS TEXT), '')) > 0
                          OR POSITION(:encoded_storage_key IN COALESCE(CAST(a.value AS TEXT), '')) > 0
                      )
                )
            )
            """
        ),
        {
            "storage_key": storage_key,
            "encoded_storage_key": quote(storage_key, safe="/"),
        },
    )
    return bool(result.scalar())


@router.get("/storage/{storage_key:path}")
def serve_storage_file(
    storage_key: str,
    db: Session = Depends(get_db),
    current_user: dict | None = Depends(get_optional_current_user),
    storage: LocalStorageProvider = Depends(get_storage_provider),
) -> FileResponse:
    try:
        file_path = storage.resolve_path(storage_key)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Chemin de fichier invalide") from exc

    is_public = is_public_storage_key(db, storage_key)
    if not is_public:
        if current_user is None:
            raise HTTPException(status_code=401, detail="Authentification requise")
        enforce_permission(current_user, "media", "read_private")

    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="Fichier introuvable")

    media_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
    headers = {
        "Cache-Control": "public, max-age=300" if is_public else "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
    }
    if media_type in {"text/html", "application/xhtml+xml"}:
        media_type = "application/octet-stream"
        headers["Content-Disposition"] = f"attachment; filename*=UTF-8''{quote(file_path.name)}"
    elif media_type == "image/svg+xml":
        headers["Content-Security-Policy"] = "default-src 'none'; style-src 'unsafe-inline'; sandbox"

    return FileResponse(file_path, media_type=media_type, headers=headers)


@router.get("/api/v1/storage/files/{storage_key:path}")
def serve_private_storage_file(
    storage_key: str,
    _user: dict = Depends(require_permission("media", "read_private")),
    storage: LocalStorageProvider = Depends(get_storage_provider),
) -> FileResponse:
    """Authenticated file endpoint for frontend requests that can send a bearer token."""
    try:
        file_path = storage.resolve_path(storage_key)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Chemin de fichier invalide") from exc

    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="Fichier introuvable")

    media_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
    headers = {
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
    }
    if media_type in {"text/html", "application/xhtml+xml"}:
        media_type = "application/octet-stream"
        headers["Content-Disposition"] = f"attachment; filename*=UTF-8''{quote(file_path.name)}"
    elif media_type == "image/svg+xml":
        headers["Content-Security-Policy"] = "default-src 'none'; style-src 'unsafe-inline'; sandbox"

    return FileResponse(file_path, media_type=media_type, headers=headers)

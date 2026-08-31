from __future__ import annotations

from typing import Any
import json
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text

from app.api.deps import get_current_user
from app.core.database import SessionLocal
from app.core.security import AuthorizationError, get_http_exception_for_error

router = APIRouter(prefix="/api/v1/page-layouts", tags=["page-layouts"])


class PageLayoutRow(BaseModel):
    page_slug: str
    layout_json: list[dict[str, Any]] | None = None
    is_published: bool = False
    page_name: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    seo_keywords: list[str] | None = None
    og_image_media_id: str | None = None


@router.get("", response_model=list[PageLayoutRow])
def list_page_layouts() -> list[PageLayoutRow]:
    with SessionLocal() as session:
        rows = session.execute(
            text("""
                WITH ranked AS (
                    SELECT id,
                           COALESCE(page_slug, page_key) AS page_slug,
                           COALESCE(page_name, page) AS page_name,
                           layout_json,
                           is_published,
                           seo_title,
                           seo_description,
                           seo_keywords,
                           og_image_media_id,
                           ROW_NUMBER() OVER (
                               PARTITION BY COALESCE(page_slug, page_key)
                               ORDER BY updated_at DESC NULLS LAST,
                                        created_at DESC NULLS LAST,
                                        id DESC
                           ) AS rn
                    FROM page_layouts
                    WHERE COALESCE(page_slug, page_key) IS NOT NULL
                      AND COALESCE(page_slug, page_key) <> ''
                )
                SELECT page_slug,
                       page_name,
                       layout_json,
                       is_published,
                       seo_title,
                       seo_description,
                       seo_keywords,
                       og_image_media_id
                FROM ranked
                WHERE rn = 1
                ORDER BY page_slug
            """)
        ).fetchall()
    return [
        PageLayoutRow(
            page_slug=row[0] or "",
            page_name=row[1],
            layout_json=row[2] or [],
            is_published=bool(row[3]),
            seo_title=row[4],
            seo_description=row[5],
            seo_keywords=list(row[6]) if row[6] else [],
            og_image_media_id=str(row[7]) if row[7] else None,
        )
        for row in rows
    ]


@router.get("/{page_slug}", response_model=PageLayoutRow)
def get_page_layout(page_slug: str) -> PageLayoutRow:
    with SessionLocal() as session:
        row = session.execute(
            text("""
                SELECT COALESCE(page_slug, page_key) AS page_slug,
                       COALESCE(page_name, page) AS page_name,
                       layout_json,
                       is_published,
                       seo_title,
                       seo_description,
                       seo_keywords,
                       og_image_media_id
                FROM page_layouts
                WHERE COALESCE(page_slug, page_key) = :page_slug
                ORDER BY updated_at DESC NULLS LAST,
                         created_at DESC NULLS LAST
                LIMIT 1
            """),
            {"page_slug": page_slug},
        ).fetchone()
    if row:
        return PageLayoutRow(
            page_slug=row[0] or "",
            page_name=row[1],
            layout_json=row[2] or [],
            is_published=bool(row[3]),
            seo_title=row[4],
            seo_description=row[5],
            seo_keywords=list(row[6]) if row[6] else [],
            og_image_media_id=str(row[7]) if row[7] else None,
        )
    raise HTTPException(status_code=404, detail="Page layout not found")


@router.post("", response_model=PageLayoutRow)
def upsert_page_layout(
    payload: PageLayoutRow,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> PageLayoutRow:
    try:
        if current_user.get("role") != "admin":
            raise AuthorizationError("Accès refusé")

        if not payload.page_slug or not payload.page_slug.strip():
            raise HTTPException(status_code=422, detail="page_slug requis")

        page_name = payload.page_name or payload.page_slug
        layout_json = json.dumps(payload.layout_json or [])
        seo_keywords = payload.seo_keywords or []

        with SessionLocal() as session:
            existing = session.execute(
                text("""
                    SELECT id
                    FROM page_layouts
                    WHERE page_slug = :page_slug
                       OR page_key = :page_slug
                    ORDER BY CASE WHEN page_slug = :page_slug THEN 0 ELSE 1 END,
                             updated_at DESC NULLS LAST
                    LIMIT 1
                """),
                {"page_slug": payload.page_slug},
            ).fetchone()

            if existing:
                session.execute(
                    text("""
                        UPDATE page_layouts
                        SET page_slug = :page_slug,
                            page_key = :page_slug,
                            page_name = :page_name,
                            page = :page_name,
                            layout_json = CAST(:layout_json AS jsonb),
                            is_published = :is_published,
                            seo_title = :seo_title,
                            seo_description = :seo_description,
                            seo_keywords = CAST(:seo_keywords AS varchar[]),
                            og_image_media_id = :og_image_media_id,
                            updated_at = NOW(),
                            updated_by = :user_id
                        WHERE id = :id
                    """),
                    {
                        "id": existing[0],
                        "page_slug": payload.page_slug,
                        "page_name": page_name,
                        "layout_json": layout_json,
                        "is_published": payload.is_published,
                        "seo_title": payload.seo_title,
                        "seo_description": payload.seo_description,
                        "seo_keywords": seo_keywords,
                        "og_image_media_id": payload.og_image_media_id,
                        "user_id": current_user.get("id"),
                    },
                )
            else:
                row_id = str(uuid.uuid4())
                session.execute(
                    text("""
                        INSERT INTO page_layouts
                        (id, page_slug, page_key, page_name, page, layout_json,
                         is_published, seo_title, seo_description, seo_keywords,
                         og_image_media_id, created_at, updated_at, created_by, updated_by,
                         is_active)
                        VALUES
                        (:id, :page_slug, :page_slug, :page_name, :page_name,
                         CAST(:layout_json AS jsonb), :is_published, :seo_title,
                         :seo_description, CAST(:seo_keywords AS varchar[]),
                         :og_image_media_id, NOW(), NOW(), :user_id, :user_id, TRUE)
                    """),
                    {
                        "id": row_id,
                        "page_slug": payload.page_slug,
                        "page_name": page_name,
                        "layout_json": layout_json,
                        "is_published": payload.is_published,
                        "seo_title": payload.seo_title,
                        "seo_description": payload.seo_description,
                        "seo_keywords": seo_keywords,
                        "og_image_media_id": payload.og_image_media_id,
                        "user_id": current_user.get("id"),
                    },
                )

            session.commit()

            row = session.execute(
                text("""
                    SELECT COALESCE(page_slug, page_key) AS page_slug,
                           COALESCE(page_name, page) AS page_name,
                           layout_json,
                           is_published,
                           seo_title,
                           seo_description,
                           seo_keywords,
                           og_image_media_id
                    FROM page_layouts
                    WHERE page_slug = :page_slug
                       OR page_key = :page_slug
                    ORDER BY CASE WHEN page_slug = :page_slug THEN 0 ELSE 1 END,
                             updated_at DESC NULLS LAST,
                             created_at DESC NULLS LAST
                    LIMIT 1
                """),
                {"page_slug": payload.page_slug},
            ).fetchone()

        if row:
            return PageLayoutRow(
                page_slug=row[0] or "",
                page_name=row[1],
                layout_json=row[2] or [],
                is_published=bool(row[3]),
                seo_title=row[4],
                seo_description=row[5],
                seo_keywords=list(row[6]) if row[6] else [],
                og_image_media_id=str(row[7]) if row[7] else None,
            )
        raise HTTPException(status_code=404, detail="Page layout not found after save")
    except AuthorizationError as exc:
        raise get_http_exception_for_error(exc) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.patch("/{page_slug}/publish", response_model=PageLayoutRow)
def publish_page_layout(
    page_slug: str,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> PageLayoutRow:
    try:
        if current_user.get("role") != "admin":
            raise AuthorizationError("Accès refusé")

        with SessionLocal() as session:
            session.execute(
                text(
                    """
                    UPDATE page_layouts
                    SET is_published = true, published_at = NOW(), updated_by = :user_id
                    WHERE page_key = :page_slug
                    """
                ),
                {"page_slug": page_slug, "user_id": current_user.get("id")},
            )
            session.commit()

            # Return the updated layout
            row = session.execute(
                text("""
                    SELECT page_key, page, layout_json, is_published,
                           seo_title, seo_description, seo_keywords, og_image_media_id
                    FROM page_layouts WHERE page_key = :page_slug
                """),
                {"page_slug": page_slug},
            ).fetchone()

        if row:
            return PageLayoutRow(
                page_slug=row[0] or "",
                page_name=row[1],
                layout_json=row[2] or [],
                is_published=bool(row[3]),
                seo_title=row[4],
                seo_description=row[5],
                seo_keywords=list(row[6]) if row[6] else [],
                og_image_media_id=str(row[7]) if row[7] else None,
            )
        raise HTTPException(status_code=404, detail="Page layout not found after publish")
    except AuthorizationError as exc:
        raise get_http_exception_for_error(exc) from exc
    except Exception as exc:
        raise get_http_exception_for_error(Exception(str(exc))) from exc
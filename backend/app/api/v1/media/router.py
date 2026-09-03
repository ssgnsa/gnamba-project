from __future__ import annotations

from typing import Any

import json

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from app.api.deps import get_media_service, get_optional_current_user
from app.services.media_service import MediaService

router = APIRouter(prefix="/api/v1/media", tags=["media"])


def _normalize_media_metadata(metadata_raw: str | None, category: str, alt_text: str, description: str, tags: str | None) -> tuple[str, str, str, list[str]]:
    parsed: dict[str, Any] = {}
    if metadata_raw:
        try:
            parsed = json.loads(metadata_raw)
        except (TypeError, ValueError):
            parsed = {}
    if not isinstance(parsed, dict):
        parsed = {}

    category_value = category if category and category != "autre" else str(parsed.get("category") or category or "autre")
    alt_text_value = alt_text if alt_text else str(parsed.get("alt_text") or parsed.get("altText") or "")
    description_value = description if description else str(parsed.get("description") or "")

    raw_tags = tags if tags is not None else parsed.get("tags")
    if isinstance(raw_tags, str):
        normalized_tags = [item.strip() for item in raw_tags.split(",") if item.strip()]
    elif isinstance(raw_tags, list):
        normalized_tags = [str(item).strip() for item in raw_tags if str(item).strip()]
    else:
        normalized_tags = []

    return category_value, alt_text_value, description_value, normalized_tags


class BrandAssetResponse(BaseModel):
    brand_asset_type: str | None = None
    url: str | None = None


class MediaUploadRequest(BaseModel):
    category: str = "autre"
    alt_text: str = ""
    description: str = ""
    tags: list[str] | None = None


class MediaResponse(BaseModel):
    id: str
    filename: str
    original_name: str
    url: str
    thumbnail_url: str | None = None
    category: str
    uploaded_by: str | None = None
    upload_date: Any | None = None
    size: int
    type: str
    alt_text: str
    description: str
    tags: list[str]
    is_brand_asset: bool
    brand_asset_type: str | None = None
    content_hash: str | None = None
    taxonomy_id: str | None = None
    created_at: Any | None = None
    updated_at: Any | None = None
    deleted_at: Any | None = None
    deleted_by: str | None = None
    width: int | None = None
    height: int | None = None


class MediaDeleteResponse(BaseModel):
    status: str
    deleted_at: Any | None = None
    media_id: str


class MediaPurgeResponse(BaseModel):
    status: str
    media_id: str


class MediaUsageCreateRequest(BaseModel):
    media_id: str
    entity_type: str
    entity_id: str | None = None
    usage_type: str
    label: str = ""


class MediaUsageResponse(BaseModel):
    id: str
    media_id: str
    entity_type: str
    entity_id: str | None = None
    usage_type: str
    label: str = ""
    created_at: Any | None = None


class MediaAuditLogCreateRequest(BaseModel):
    media_id: str | None = None
    action: str
    actor_id: str | None = None
    metadata: dict[str, Any] = {}


class MediaAuditLogResponse(BaseModel):
    id: str | None = None
    media_id: str | None = None
    action: str
    actor_id: str | None = None
    metadata: dict[str, Any] = {}
    created_at: Any | None = None


@router.get("/brand-assets", response_model=list[MediaResponse])
def list_brand_assets() -> list[MediaResponse]:
    try:
        service = get_media_service()
        rows = service.list_media(include_deleted=False)
        return [MediaResponse(**row) for row in rows if row.get("is_brand_asset")]
    except Exception:
        return []


@router.post("", response_model=MediaResponse)
def upload_media(
    file: UploadFile = File(...),
    category: str = Form("autre"),
    alt_text: str = Form(""),
    description: str = Form(""),
    tags: str | None = Form(None),
    metadata: str | None = Form(None),
    current_user: dict[str, Any] | None = Depends(get_optional_current_user),
    service: MediaService = Depends(get_media_service),
) -> MediaResponse:
    category, alt_text, description, parsed_tags = _normalize_media_metadata(metadata, category, alt_text, description, tags)
    media = service.upload_media(file, category, current_user.get("id") if current_user else None, alt_text, description, parsed_tags)
    return MediaResponse(**media)


@router.get("", response_model=list[MediaResponse])
def list_media(
    include_deleted: bool = False,
    service: MediaService = Depends(get_media_service),
) -> list[MediaResponse]:
    return [MediaResponse(**item) for item in service.list_media(include_deleted=include_deleted)]


@router.get("/usage", response_model=list[MediaResponse | MediaUsageResponse])
def list_media_usage(
    media_id: str | None = None,
    entity_type: str | None = None,
    entity_id: str | None = None,
    usage_type: str | None = None,
    service: MediaService = Depends(get_media_service),
) -> list[MediaResponse | MediaUsageResponse]:
    if media_id:
        return [MediaUsageResponse(**item) for item in service.list_media_usages(media_id=media_id)]
    if entity_type and usage_type:
        return [MediaResponse(**item) for item in service.list_media_for_usage(entity_type=entity_type, entity_id=entity_id, usage_type=usage_type)]
    return []


@router.get("/audit", response_model=list[MediaAuditLogResponse])
def list_media_audit_logs(
    media_id: str | None = None,
    service: MediaService = Depends(get_media_service),
):
    return [MediaAuditLogResponse(**item) for item in service.list_media_audit_logs(media_id)]


@router.post("/audit", response_model=MediaAuditLogResponse)
def create_media_audit_log(
    payload: MediaAuditLogCreateRequest,
    service: MediaService = Depends(get_media_service),
) -> MediaAuditLogResponse:
    created = service.create_media_audit_log(payload.model_dump())
    return MediaAuditLogResponse(**created)


@router.post("/usage", response_model=MediaUsageResponse)
def create_media_usage(
    payload: MediaUsageCreateRequest,
    service: MediaService = Depends(get_media_service),
) -> MediaUsageResponse:
    usage = service.create_media_usage(payload.model_dump())
    return MediaUsageResponse(**usage)


@router.delete("/usage/{usage_id}", response_model=dict[str, str])
def delete_media_usage(usage_id: str, service: MediaService = Depends(get_media_service)) -> dict[str, str]:
    deleted = service.delete_media_usage(usage_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Usage introuvable")
    return {"status": "deleted", "media_id": usage_id}


@router.get("/{media_id}", response_model=MediaResponse)
def get_media(media_id: str, service: MediaService = Depends(get_media_service)) -> MediaResponse:
    media = service.get_media(media_id)
    if not media:
        raise HTTPException(status_code=404, detail="Media introuvable")
    return MediaResponse(**media)


@router.patch("/{media_id}", response_model=MediaResponse)
def update_media(
    media_id: str,
    payload: dict[str, Any],
    service: MediaService = Depends(get_media_service),
) -> MediaResponse:
    updated = service.update_media(media_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Media introuvable")
    return MediaResponse(**updated)


@router.delete("/{media_id}", response_model=MediaDeleteResponse)
def delete_media(
    media_id: str,
    current_user: dict[str, Any] | None = Depends(get_optional_current_user),
    service: MediaService = Depends(get_media_service),
) -> MediaDeleteResponse:
    deleted = service.soft_delete(media_id, current_user.get("id") if current_user else None)
    if not deleted:
        raise HTTPException(status_code=404, detail="Media introuvable")
    return MediaDeleteResponse(status="deleted", deleted_at=deleted.get("deleted_at"), media_id=media_id)


@router.post("/{media_id}/restore", response_model=MediaResponse)
def restore_media(media_id: str, service: MediaService = Depends(get_media_service)) -> MediaResponse:
    restored = service.restore(media_id)
    if not restored:
        raise HTTPException(status_code=404, detail="Media introuvable")
    return MediaResponse(**restored)


@router.delete("/{media_id}/purge", response_model=MediaPurgeResponse)
def purge_media(media_id: str, service: MediaService = Depends(get_media_service)) -> MediaPurgeResponse:
    purged = service.purge(media_id)
    if not purged:
        raise HTTPException(status_code=404, detail="Media introuvable")
    return MediaPurgeResponse(status="purged", media_id=media_id)


@router.post("/{media_id}/replace", response_model=MediaResponse)
def replace_media(
    media_id: str,
    file: UploadFile = File(...),
    category: str = Form("autre"),
    alt_text: str = Form(""),
    description: str = Form(""),
    tags: str | None = Form(None),
    metadata: str | None = Form(None),
    current_user: dict[str, Any] | None = Depends(get_optional_current_user),
    service: MediaService = Depends(get_media_service),
) -> MediaResponse:
    category, alt_text, description, parsed_tags = _normalize_media_metadata(metadata, category, alt_text, description, tags)
    replaced = service.replace(media_id, file, current_user.get("id") if current_user else None)
    if not replaced:
        raise HTTPException(status_code=404, detail="Media introuvable")
    if category != "autre" or alt_text or description or parsed_tags:
        updated = service.update_media(media_id, {
            "category": category,
            "alt_text": alt_text,
            "description": description,
            "tags": parsed_tags,
        })
        if updated:
            replaced = updated
    return MediaResponse(**replaced)


@router.get("/{media_id}/versions")
def list_media_versions(
    media_id: str,
    service: MediaService = Depends(get_media_service),
):
    return service.list_media_versions(media_id)
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from app.api.deps import get_media_service, get_optional_current_user
from app.services.media_service import MediaService

router = APIRouter(prefix="/api/v1/media", tags=["media"])


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
    current_user: dict[str, Any] | None = Depends(get_optional_current_user),
    service: MediaService = Depends(get_media_service),
) -> MediaResponse:
    parsed_tags = [item.strip() for item in (tags or "").split(",") if item.strip()]
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
    current_user: dict[str, Any] | None = Depends(get_optional_current_user),
    service: MediaService = Depends(get_media_service),
) -> MediaResponse:
    replaced = service.replace(media_id, file, current_user.get("id") if current_user else None)
    if not replaced:
        raise HTTPException(status_code=404, detail="Media introuvable")
    return MediaResponse(**replaced)


@router.get("/{media_id}/versions")
def list_media_versions(
    media_id: str,
    service: MediaService = Depends(get_media_service),
):
    return service.list_media_versions(media_id)


@router.get("/audit")
def list_media_audit_logs(
    media_id: str | None = None,
    service: MediaService = Depends(get_media_service),
):
    return service.list_media_audit_logs(media_id)
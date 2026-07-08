from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass(slots=True)
class MediaAsset:
    id: str
    filename: str
    original_name: str
    url: str
    thumbnail_url: Optional[str] = None
    category: str = "autre"
    uploaded_by: Optional[str] = None
    upload_date: Optional[object] = None
    size: int = 0
    type: str = ""
    alt_text: str = ""
    description: str = ""
    tags: list[str] | None = None
    is_brand_asset: bool = False
    brand_asset_type: Optional[str] = None
    created_at: Optional[object] = None
    updated_at: Optional[object] = None
    deleted_at: Optional[object] = None
    deleted_by: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None

    def to_payload(self) -> dict[str, object]:
        return {
            "id": self.id,
            "filename": self.filename,
            "original_name": self.original_name,
            "url": self.url,
            "thumbnail_url": self.thumbnail_url,
            "category": self.category,
            "uploaded_by": self.uploaded_by,
            "upload_date": self.upload_date,
            "size": self.size,
            "type": self.type,
            "alt_text": self.alt_text,
            "description": self.description,
            "tags": self.tags or [],
            "is_brand_asset": self.is_brand_asset,
            "brand_asset_type": self.brand_asset_type,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "deleted_at": self.deleted_at,
            "deleted_by": self.deleted_by,
            "width": self.width,
            "height": self.height,
        }

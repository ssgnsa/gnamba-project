from __future__ import annotations

from typing import Any

from fastapi import UploadFile

from app.domain.media import MediaAsset
from app.repositories.media_repository import MediaRepositoryPort
from app.services.storage_provider import StorageProvider


class MediaApplicationService:
    def __init__(self, media_repository: MediaRepositoryPort, storage_provider: StorageProvider) -> None:
        self.media_repository = media_repository
        self.storage_provider = storage_provider

    def list_media(self, include_deleted: bool = False) -> list[dict[str, Any]]:
        return [asset.to_payload() for asset in self.media_repository.list_media(include_deleted=include_deleted)]

    def get_media(self, media_id: str) -> dict[str, Any] | None:
        asset = self.media_repository.get_media(media_id)
        return asset.to_payload() if asset else None

    def upload_media(
        self,
        upload_file: UploadFile,
        category: str,
        user_id: str | None,
        alt_text: str = "",
        description: str = "",
        tags: list[str] | None = None,
    ) -> dict[str, Any]:
        return self.media_repository.create_media(upload_file, category, user_id, alt_text, description, tags, self.storage_provider)

    def update_media(self, media_id: str, payload: dict[str, Any]) -> dict[str, Any] | None:
        asset = self.media_repository.update_media(media_id, payload)
        return asset.to_payload() if asset else None

    def soft_delete(self, media_id: str, user_id: str | None) -> dict[str, Any] | None:
        asset = self.media_repository.soft_delete(media_id, user_id)
        return asset.to_payload() if asset else None

    def restore(self, media_id: str) -> dict[str, Any] | None:
        asset = self.media_repository.restore(media_id)
        return asset.to_payload() if asset else None

    def purge(self, media_id: str) -> bool:
        return self.media_repository.purge(media_id, self.storage_provider)

    def replace(self, media_id: str, upload_file: UploadFile, user_id: str | None) -> dict[str, Any] | None:
        asset = self.media_repository.replace(media_id, upload_file, user_id, self.storage_provider)
        return asset.to_payload() if asset else None

    def list_media_usages(self, media_id: str) -> list[dict[str, Any]]:
        return self.media_repository.list_media_usages(media_id)

    def list_media_for_usage(self, entity_type: str, usage_type: str, entity_id: str | None = None) -> list[dict[str, Any]]:
        return self.media_repository.list_media_for_usage(entity_type, usage_type, entity_id)

    def create_media_usage(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self.media_repository.create_media_usage(payload)

    def delete_media_usage(self, usage_id: str) -> bool:
        return self.media_repository.delete_media_usage(usage_id)

    def list_media_versions(self, media_id: str) -> list[dict[str, Any]]:
        return self.media_repository.list_media_versions(media_id)

    def list_media_audit_logs(self, media_id: str | None = None) -> list[dict[str, Any]]:
        return self.media_repository.list_media_audit_logs(media_id)

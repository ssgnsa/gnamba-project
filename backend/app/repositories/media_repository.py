from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from fastapi import UploadFile

from backend.app.domain.media import MediaAsset
from backend.app.services.storage_provider import StorageProvider


class MediaRepositoryPort(ABC):
    @abstractmethod
    def list_media(self, include_deleted: bool = False) -> list[MediaAsset]:
        raise NotImplementedError

    @abstractmethod
    def get_media(self, media_id: str) -> MediaAsset | None:
        raise NotImplementedError

    @abstractmethod
    def create_media(
        self,
        upload_file: UploadFile,
        category: str,
        user_id: str | None,
        alt_text: str = "",
        description: str = "",
        tags: list[str] | None = None,
        storage_provider: StorageProvider | None = None,
    ) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    def update_media(self, media_id: str, payload: dict[str, Any]) -> MediaAsset | None:
        raise NotImplementedError

    @abstractmethod
    def soft_delete(self, media_id: str, user_id: str | None) -> MediaAsset | None:
        raise NotImplementedError

    @abstractmethod
    def restore(self, media_id: str) -> MediaAsset | None:
        raise NotImplementedError

    @abstractmethod
    def purge(self, media_id: str, storage_provider: StorageProvider | None = None) -> bool:
        raise NotImplementedError

    @abstractmethod
    def replace(self, media_id: str, upload_file: UploadFile, user_id: str | None, storage_provider: StorageProvider | None = None) -> MediaAsset | None:
        raise NotImplementedError

    @abstractmethod
    def list_media_usages(self, media_id: str) -> list[dict[str, Any]]:
        raise NotImplementedError

    @abstractmethod
    def list_media_for_usage(self, entity_type: str, usage_type: str, entity_id: str | None = None) -> list[dict[str, Any]]:
        raise NotImplementedError

    @abstractmethod
    def create_media_usage(self, payload: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    def delete_media_usage(self, usage_id: str) -> bool:
        raise NotImplementedError

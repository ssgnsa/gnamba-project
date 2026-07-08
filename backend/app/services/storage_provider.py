from __future__ import annotations

import os
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any
from urllib.parse import quote


class StorageProvider(ABC):
    name: str = "storage"

    @abstractmethod
    def upload_bytes(
        self,
        storage_key: str,
        content: bytes,
        content_type: str,
        original_name: str | None = None,
    ) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    def delete(self, storage_key: str) -> None:
        raise NotImplementedError

    @abstractmethod
    def delete_many(self, storage_keys: list[str]) -> None:
        raise NotImplementedError

    @abstractmethod
    def public_url(self, storage_key: str) -> str:
        raise NotImplementedError

    def signed_url(self, storage_key: str, ttl_seconds: int = 3600) -> str:
        return self.public_url(storage_key)


class LocalStorageProvider(StorageProvider):
    name = "local"

    def __init__(self, storage_root: str | None = None):
        self.storage_root = Path(storage_root or os.getenv("LOCAL_STORAGE_ROOT", "backend/storage/uploads")).resolve()
        self.storage_root.mkdir(parents=True, exist_ok=True)
        self.base_url = os.getenv("LOCAL_STORAGE_BASE_URL", "http://localhost:8000/storage").rstrip("/")

    def _resolve_path(self, storage_key: str) -> Path:
        safe_key = storage_key.replace("\\", "/")
        if safe_key.startswith("/") or safe_key.startswith("../") or "/../" in safe_key:
            raise ValueError("storage_key invalide")
        candidate = (self.storage_root / safe_key).resolve()
        if not str(candidate).startswith(str(self.storage_root)):
            raise ValueError("storage_key invalide")
        return candidate

    def upload_bytes(
        self,
        storage_key: str,
        content: bytes,
        content_type: str,
        original_name: str | None = None,
    ) -> dict[str, Any]:
        path = self._resolve_path(storage_key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
        return {
            "storage_key": storage_key,
            "path": str(path),
            "content_type": content_type,
            "size": len(content),
            "original_name": original_name,
        }

    def delete(self, storage_key: str) -> None:
        path = self._resolve_path(storage_key)
        if path.exists():
            path.unlink()

    def delete_many(self, storage_keys: list[str]) -> None:
        for storage_key in storage_keys:
            self.delete(storage_key)

    def public_url(self, storage_key: str) -> str:
        return f"{self.base_url}/{quote(storage_key, safe='/')}"


def get_storage_provider() -> StorageProvider:
    provider_name = os.getenv("STORAGE_PROVIDER", "local").strip().lower()
    if provider_name == "local":
        return LocalStorageProvider()
    raise NotImplementedError(f"Provider storage non supporté: {provider_name}")

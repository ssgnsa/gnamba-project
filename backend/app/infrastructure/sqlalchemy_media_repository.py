from __future__ import annotations

import json
import uuid
import hashlib
from datetime import datetime, timezone
from typing import Any

from fastapi import UploadFile
from sqlalchemy import text

from app.core.database import DATABASE_URL, SessionLocal
from app.domain.media import MediaAsset
from app.repositories.media_repository import MediaRepositoryPort
from app.services.storage_provider import StorageProvider


class SqlAlchemyMediaRepository(MediaRepositoryPort):
    def __init__(self) -> None:
        self.ensure_schema()

    def _is_sqlite(self) -> bool:
        database_url = DATABASE_URL or ""
        return str(database_url).startswith("sqlite")

    def ensure_schema(self) -> None:
        sqlite_mode = self._is_sqlite()

        if sqlite_mode:
            ddl = {
                "media_files": """
                    CREATE TABLE IF NOT EXISTS media_files (
                        id TEXT PRIMARY KEY,
                        filename TEXT NOT NULL,
                        storage_key TEXT,
                        original_name TEXT NOT NULL DEFAULT '',
                        url TEXT NOT NULL DEFAULT '',
                        thumbnail_url TEXT,
                        category TEXT NOT NULL DEFAULT 'autre',
                        uploaded_by TEXT,
                        upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                        size INTEGER NOT NULL DEFAULT 0,
                        type TEXT NOT NULL DEFAULT '',
                        alt_text TEXT NOT NULL DEFAULT '',
                        description TEXT NOT NULL DEFAULT '',
                        tags TEXT NOT NULL DEFAULT '[]',
                        is_brand_asset BOOLEAN NOT NULL DEFAULT 0,
                        brand_asset_type TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        deleted_at DATETIME,
                        deleted_by TEXT,
                        width INTEGER,
                        height INTEGER
                    )
                """,
                "media_usage": """
                    CREATE TABLE IF NOT EXISTS media_usage (
                        id TEXT PRIMARY KEY,
                        media_id TEXT NOT NULL,
                        entity_type TEXT NOT NULL,
                        entity_id TEXT,
                        usage_type TEXT NOT NULL,
                        label TEXT NOT NULL DEFAULT '',
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                """,
                "media_versions": """
                    CREATE TABLE IF NOT EXISTS media_versions (
                        id TEXT PRIMARY KEY,
                        media_id TEXT NOT NULL,
                        version_number INTEGER NOT NULL DEFAULT 1,
                        old_url TEXT NOT NULL DEFAULT '',
                        old_filename TEXT NOT NULL DEFAULT '',
                        replaced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        replaced_by TEXT
                    )
                """,
                "media_audit_logs": """
                    CREATE TABLE IF NOT EXISTS media_audit_logs (
                        id TEXT PRIMARY KEY,
                        media_id TEXT,
                        action TEXT NOT NULL,
                        actor_id TEXT,
                        metadata TEXT DEFAULT '{}',
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                """,
                "media_taxonomy": """
                    CREATE TABLE IF NOT EXISTS media_taxonomy (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        slug TEXT NOT NULL,
                        parent_id TEXT
                    )
                """,
            }
        else:
            ddl = {
                "media_files": """
                    CREATE TABLE IF NOT EXISTS media_files (
                        id UUID PRIMARY KEY,
                        filename TEXT NOT NULL,
                        storage_key TEXT,
                        original_name TEXT NOT NULL DEFAULT '',
                        url TEXT NOT NULL DEFAULT '',
                        thumbnail_url TEXT,
                        category TEXT NOT NULL DEFAULT 'autre',
                        uploaded_by TEXT,
                        upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        size BIGINT NOT NULL DEFAULT 0,
                        type TEXT NOT NULL DEFAULT '',
                        alt_text TEXT NOT NULL DEFAULT '',
                        description TEXT NOT NULL DEFAULT '',
                        tags TEXT[] NOT NULL DEFAULT '{}',
                        is_brand_asset BOOLEAN NOT NULL DEFAULT FALSE,
                        brand_asset_type TEXT,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        deleted_at TIMESTAMP WITH TIME ZONE,
                        deleted_by TEXT,
                        width INTEGER,
                        height INTEGER
                    )
                    """,
                "media_usage": """
                    CREATE TABLE IF NOT EXISTS media_usage (
                        id UUID PRIMARY KEY,
                        media_id UUID NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
                        entity_type TEXT NOT NULL,
                        entity_id TEXT,
                        usage_type TEXT NOT NULL,
                        label TEXT NOT NULL DEFAULT '',
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    )
                    """,
                "media_versions": """
                    CREATE TABLE IF NOT EXISTS media_versions (
                        id UUID PRIMARY KEY,
                        media_id UUID NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
                        version_number INTEGER NOT NULL DEFAULT 1,
                        old_url TEXT NOT NULL DEFAULT '',
                        old_filename TEXT NOT NULL DEFAULT '',
                        replaced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        replaced_by UUID
                    )
                    """,
                "media_audit_logs": """
                    CREATE TABLE IF NOT EXISTS media_audit_logs (
                        id UUID PRIMARY KEY,
                        media_id UUID,
                        action TEXT NOT NULL,
                        actor_id UUID,
                        metadata JSONB DEFAULT '{}'::jsonb,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    )
                    """,
                "media_taxonomy": """
                    CREATE TABLE IF NOT EXISTS media_taxonomy (
                        id UUID PRIMARY KEY,
                        name TEXT NOT NULL,
                        slug TEXT NOT NULL,
                        parent_id UUID
                    )
                """,
            }

        with SessionLocal() as session:
            for sql in ddl.values():
                session.execute(text(sql))

            if sqlite_mode:
                media_files_columns = session.execute(text("PRAGMA table_info(media_files)")).fetchall()
                existing_column_names = {row[1] for row in media_files_columns}
                if "storage_key" not in existing_column_names:
                    session.execute(text("ALTER TABLE media_files ADD COLUMN storage_key TEXT"))
                if "content_hash" not in existing_column_names:
                    session.execute(text("ALTER TABLE media_files ADD COLUMN content_hash TEXT"))
                if "taxonomy_id" not in existing_column_names:
                    session.execute(text("ALTER TABLE media_files ADD COLUMN taxonomy_id TEXT"))
            else:
                session.execute(text("ALTER TABLE media_files ADD COLUMN IF NOT EXISTS storage_key TEXT"))

                session.execute(text("ALTER TABLE media_files ADD COLUMN IF NOT EXISTS content_hash TEXT"))
                session.execute(text("ALTER TABLE media_files ADD COLUMN IF NOT EXISTS taxonomy_id UUID"))

                column_names_by_table = {
                    "media_files": {"uploaded_by", "deleted_by"},
                    "media_versions": {"replaced_by"},
                    "media_audit_logs": {"actor_id"},
                }

                for table_name, columns in column_names_by_table.items():
                    existing_columns = session.execute(
                        text(
                            """
                            SELECT column_name
                            FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = :table_name
                            """
                        ),
                        {"table_name": table_name},
                    ).fetchall()
                    existing_names = {row[0] for row in existing_columns}
                    for column_name in sorted(columns):
                        if column_name not in existing_names:
                            continue

                        if table_name == "media_files" and column_name in {"uploaded_by", "deleted_by"}:
                            session.execute(
                                text(
                                    f"ALTER TABLE media_files ALTER COLUMN {column_name} TYPE TEXT USING {column_name}::text"
                                )
                            )
                        elif table_name == "media_versions" and column_name == "replaced_by":
                            session.execute(
                                text(
                                    "ALTER TABLE media_versions ALTER COLUMN replaced_by TYPE TEXT USING replaced_by::text"
                                )
                            )
                        elif table_name == "media_audit_logs" and column_name == "actor_id":
                            session.execute(
                                text(
                                    "ALTER TABLE media_audit_logs ALTER COLUMN actor_id TYPE TEXT USING actor_id::text"
                                )
                            )
            session.commit()

    def _uuid(self) -> str:
        return str(uuid.uuid4())

    def _now(self) -> datetime:
        return datetime.now(timezone.utc)

    def _row_to_domain(self, row: Any) -> MediaAsset | None:
        if not row:
            return None
        tags_value = row[12]
        if isinstance(tags_value, str):
            try:
                tags_value = json.loads(tags_value)
            except (TypeError, ValueError):
                tags_value = []
        if not isinstance(tags_value, list):
            tags_value = []
        return MediaAsset(
            id=str(row[0]) if row[0] is not None else None,
            filename=row[1],
            original_name=row[2] or "",
            url=row[3] or "",
            thumbnail_url=row[4],
            category=row[5] or "autre",
            uploaded_by=str(row[6]) if row[6] is not None else None,
            upload_date=row[7],
            size=row[8] or 0,
            type=row[9] or "",
            alt_text=row[10] or "",
            description=row[11] or "",
            tags=tags_value,
            is_brand_asset=bool(row[13]),
            brand_asset_type=row[14],
            created_at=row[15],
            updated_at=row[16],
            deleted_at=row[17],
            deleted_by=str(row[18]) if row[18] is not None else None,
            width=row[19],
            height=row[20],
            content_hash=row[21] if len(row) > 21 else None,
            taxonomy_id=str(row[22]) if len(row) > 22 and row[22] is not None else None,
        )

    def list_media(self, include_deleted: bool = False) -> list[MediaAsset]:
        with SessionLocal() as session:
            clause = "" if include_deleted else "AND deleted_at IS NULL"
            rows = session.execute(
                text(
                    f"""
                          SELECT id, filename, original_name, url, thumbnail_url, category,
                              uploaded_by, upload_date, size, type, alt_text, description,
                              tags, is_brand_asset, brand_asset_type, created_at, updated_at,
                              deleted_at, deleted_by, width, height, content_hash, taxonomy_id
                    FROM media_files
                    WHERE 1=1 {clause}
                    ORDER BY upload_date DESC, created_at DESC
                    """
                )
            ).fetchall()
        return [asset for asset in (self._row_to_domain(row) for row in rows) if asset]

    def get_media(self, media_id: str) -> MediaAsset | None:
        with SessionLocal() as session:
            row = session.execute(
                text(
                    """
                          SELECT id, filename, original_name, url, thumbnail_url, category,
                              uploaded_by, upload_date, size, type, alt_text, description,
                             tags, is_brand_asset, brand_asset_type, created_at, updated_at,
                             deleted_at, deleted_by, width, height, content_hash, taxonomy_id
                    FROM media_files
                    WHERE id = :media_id
                    """
                ),
                {"media_id": media_id},
            ).fetchone()
        return self._row_to_domain(row)

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
        if storage_provider is None:
            from app.services.storage_provider import get_storage_provider
            storage_provider = get_storage_provider()
        filename = f"{category}/{self._now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8]}_{upload_file.filename or 'file'}"
        storage_key = filename.replace("//", "/")
        content = upload_file.file.read()
        # compute content hash for deduplication
        content_hash = hashlib.sha256(content).hexdigest() if content is not None else None

        # if identical file already exists (not deleted), return existing entry to avoid duplicate storage
        with SessionLocal() as session:
            existing_row = session.execute(
                text(
                    """
                    SELECT id, filename, original_name, url, thumbnail_url, category,
                           uploaded_by, upload_date, size, type, alt_text, description,
                           tags, is_brand_asset, brand_asset_type, created_at, updated_at,
                           deleted_at, deleted_by, width, height, content_hash, taxonomy_id
                    FROM media_files
                    WHERE content_hash = :content_hash AND deleted_at IS NULL
                    LIMIT 1
                    """
                ),
                {"content_hash": content_hash},
            ).fetchone()
            if existing_row:
                return self._row_to_domain(existing_row).to_payload()

        storage_provider.upload_bytes(storage_key, content, upload_file.content_type or "application/octet-stream", upload_file.filename)
        public_url = storage_provider.public_url(storage_key)
        tags_value = tags or []
        sqlite_tags_value = json.dumps(tags_value) if self._is_sqlite() else tags_value
        with SessionLocal() as session:
            row = session.execute(
                text(
                    """
                    INSERT INTO media_files (
                        id, filename, storage_key, original_name, url, category, uploaded_by, size, type,
                        alt_text, description, tags, is_brand_asset, brand_asset_type, upload_date,
                        created_at, updated_at, deleted_at, width, height, content_hash, taxonomy_id
                    )
                    VALUES (
                        :id, :filename, :storage_key, :original_name, :url, :category, :uploaded_by, :size,
                        :type, :alt_text, :description, :tags, :is_brand_asset, :brand_asset_type,
                        :upload_date, :created_at, :updated_at, :deleted_at, :width, :height, :content_hash, :taxonomy_id
                    )
                    RETURNING id, filename, original_name, url, thumbnail_url, category,
                              uploaded_by, upload_date, size, type, alt_text, description,
                              tags, is_brand_asset, brand_asset_type, created_at, updated_at,
                              deleted_at, deleted_by, width, height, content_hash, taxonomy_id
                    """
                ),
                {
                    "id": self._uuid(),
                    "filename": storage_key,
                    "storage_key": storage_key,
                    "original_name": upload_file.filename or "",
                    "url": public_url,
                    "category": category,
                    "uploaded_by": user_id,
                    "size": len(content),
                    "type": upload_file.content_type or "application/octet-stream",
                    "alt_text": alt_text,
                    "description": description,
                    "tags": sqlite_tags_value,
                    "is_brand_asset": False,
                    "brand_asset_type": None,
                    "upload_date": self._now(),
                    "created_at": self._now(),
                    "updated_at": self._now(),
                    "deleted_at": None,
                    "width": None,
                    "height": None,
                    "content_hash": content_hash,
                    "taxonomy_id": None,
                },
            ).fetchone()
            session.commit()
        return self._row_to_domain(row).to_payload() if row else {}

    def update_media(self, media_id: str, payload: dict[str, Any]) -> MediaAsset | None:
        with SessionLocal() as session:
            updates: list[str] = []
            values: dict[str, Any] = {"media_id": media_id, "updated_at": self._now()}
            for key, value in payload.items():
                if key in {"id", "created_at", "upload_date", "deleted_at", "deleted_by", "uploaded_by"}:
                    continue
                updates.append(f"{key} = :{key}")
                values[key] = value
            if not updates:
                return self.get_media(media_id)
            updates.append("updated_at = :updated_at")
            statement = text(f"UPDATE media_files SET {', '.join(updates)} WHERE id = :media_id RETURNING id, filename, original_name, url, thumbnail_url, category, uploaded_by, upload_date, size, type, alt_text, description, tags, is_brand_asset, brand_asset_type, created_at, updated_at, deleted_at, deleted_by, width, height, content_hash, taxonomy_id")
            row = session.execute(statement, values).fetchone()
            session.commit()
        return self._row_to_domain(row)

    def soft_delete(self, media_id: str, user_id: str | None) -> MediaAsset | None:
        with SessionLocal() as session:
            row = session.execute(
                text(
                    """
                    UPDATE media_files
                    SET deleted_at = :deleted_at, deleted_by = :deleted_by, updated_at = :updated_at
                    WHERE id = :media_id
                    RETURNING id, filename, original_name, url, thumbnail_url, category,
                              uploaded_by, upload_date, size, type, alt_text, description,
                              tags, is_brand_asset, brand_asset_type, created_at, updated_at,
                              deleted_at, deleted_by, width, height, content_hash, taxonomy_id
                    """
                ),
                {"media_id": media_id, "deleted_at": self._now(), "deleted_by": user_id, "updated_at": self._now()},
            ).fetchone()
            session.commit()
        return self._row_to_domain(row)

    def restore(self, media_id: str) -> MediaAsset | None:
        with SessionLocal() as session:
            row = session.execute(
                text(
                    """
                    UPDATE media_files
                    SET deleted_at = NULL, updated_at = :updated_at
                    WHERE id = :media_id
                    RETURNING id, filename, original_name, url, thumbnail_url, category,
                              uploaded_by, upload_date, size, type, alt_text, description,
                              tags, is_brand_asset, brand_asset_type, created_at, updated_at,
                              deleted_at, deleted_by, width, height, content_hash, taxonomy_id
                    """
                ),
                {"media_id": media_id, "updated_at": self._now()},
            ).fetchone()
            session.commit()
        return self._row_to_domain(row)

    def purge(self, media_id: str, storage_provider: StorageProvider | None = None) -> bool:
        if storage_provider is None:
            from app.services.storage_provider import get_storage_provider
            storage_provider = get_storage_provider()
        with SessionLocal() as session:
            row = session.execute(text("SELECT filename FROM media_files WHERE id = :media_id"), {"media_id": media_id}).fetchone()
            if not row:
                return False
            storage_key = row[0]
            session.execute(text("DELETE FROM media_files WHERE id = :media_id"), {"media_id": media_id})
            session.commit()
        storage_provider.delete(storage_key)
        return True

    def replace(self, media_id: str, upload_file: UploadFile, user_id: str | None, storage_provider: StorageProvider | None = None) -> MediaAsset | None:
        if storage_provider is None:
            from app.services.storage_provider import get_storage_provider
            storage_provider = get_storage_provider()
        existing = self.get_media(media_id)
        if not existing:
            return None
        storage_key = existing.filename
        content = upload_file.file.read()
        storage_provider.upload_bytes(storage_key, content, upload_file.content_type or "application/octet-stream", upload_file.filename)
        with SessionLocal() as session:
            row = session.execute(
                text(
                    """
                    UPDATE media_files
                    SET size = :size, type = :type, original_name = :original_name, url = :url,
                        updated_at = :updated_at
                    WHERE id = :media_id
                    RETURNING id, filename, original_name, url, thumbnail_url, category,
                              uploaded_by, upload_date, size, type, alt_text, description,
                              tags, is_brand_asset, brand_asset_type, created_at, updated_at,
                              deleted_at, deleted_by, width, height, content_hash, taxonomy_id
                    """
                ),
                {
                    "media_id": media_id,
                    "size": len(content),
                    "type": upload_file.content_type or "application/octet-stream",
                    "original_name": upload_file.filename or existing.original_name,
                    "url": storage_provider.public_url(storage_key),
                    "updated_at": self._now(),
                },
            ).fetchone()
            session.commit()
        return self._row_to_domain(row)

    def list_media_usages(self, media_id: str) -> list[dict[str, Any]]:
        with SessionLocal() as session:
            rows = session.execute(
                text(
                    """
                    SELECT id, media_id, entity_type, entity_id, usage_type, label, created_at
                    FROM media_usage
                    WHERE media_id = :media_id
                    ORDER BY created_at DESC
                    """
                ),
                {"media_id": media_id},
            ).fetchall()
        return [
            {
                "id": str(row[0]) if row[0] is not None else None,
                "media_id": str(row[1]) if row[1] is not None else None,
                "entity_type": row[2],
                "entity_id": row[3],
                "usage_type": row[4],
                "label": row[5],
                "created_at": row[6],
            }
            for row in rows
        ]

    def list_media_for_usage(self, entity_type: str, usage_type: str, entity_id: str | None = None) -> list[dict[str, Any]]:
        with SessionLocal() as session:
            query = text(
                """
                  SELECT mf.id, mf.filename, mf.original_name, mf.url, mf.thumbnail_url, mf.category,
                      mf.uploaded_by, mf.upload_date, mf.size, mf.type, mf.alt_text, mf.description,
                      mf.tags, mf.is_brand_asset, mf.brand_asset_type, mf.created_at, mf.updated_at,
                      mf.deleted_at, mf.deleted_by, mf.width, mf.height, mf.content_hash, mf.taxonomy_id
                FROM media_usage mu
                JOIN media_files mf ON mf.id = mu.media_id
                WHERE mu.entity_type = :entity_type
                  AND mu.usage_type = :usage_type
                  AND mf.deleted_at IS NULL
                """
            )
            params: dict[str, Any] = {"entity_type": entity_type, "usage_type": usage_type}
            if entity_id is not None:
                query = text(
                    """
                          SELECT mf.id, mf.filename, mf.original_name, mf.url, mf.thumbnail_url, mf.category,
                              mf.uploaded_by, mf.upload_date, mf.size, mf.type, mf.alt_text, mf.description,
                              mf.tags, mf.is_brand_asset, mf.brand_asset_type, mf.created_at, mf.updated_at,
                              mf.deleted_at, mf.deleted_by, mf.width, mf.height, mf.content_hash, mf.taxonomy_id
                    FROM media_usage mu
                    JOIN media_files mf ON mf.id = mu.media_id
                    WHERE mu.entity_type = :entity_type
                      AND mu.usage_type = :usage_type
                      AND mu.entity_id = :entity_id
                      AND mf.deleted_at IS NULL
                    """
                )
                params["entity_id"] = entity_id
            elif entity_id is None:
                query = text(
                    """
                          SELECT mf.id, mf.filename, mf.original_name, mf.url, mf.thumbnail_url, mf.category,
                              mf.uploaded_by, mf.upload_date, mf.size, mf.type, mf.alt_text, mf.description,
                              mf.tags, mf.is_brand_asset, mf.brand_asset_type, mf.created_at, mf.updated_at,
                              mf.deleted_at, mf.deleted_by, mf.width, mf.height, mf.content_hash, mf.taxonomy_id
                    FROM media_usage mu
                    JOIN media_files mf ON mf.id = mu.media_id
                    WHERE mu.entity_type = :entity_type
                      AND mu.usage_type = :usage_type
                      AND mu.entity_id IS NULL
                      AND mf.deleted_at IS NULL
                    """
                )
            rows = session.execute(query, params).fetchall()
        return [self._row_to_domain(row).to_payload() for row in rows if self._row_to_domain(row)]

    def create_media_usage(self, payload: dict[str, Any]) -> dict[str, Any]:
        usage_id = self._uuid()
        created_at = self._now()
        with SessionLocal() as session:
            row = session.execute(
                text(
                    """
                    INSERT INTO media_usage (id, media_id, entity_type, entity_id, usage_type, label, created_at)
                    VALUES (:id, :media_id, :entity_type, :entity_id, :usage_type, :label, :created_at)
                    RETURNING id, media_id, entity_type, entity_id, usage_type, label, created_at
                    """
                ),
                {
                    "id": usage_id,
                    "media_id": payload["media_id"],
                    "entity_type": payload["entity_type"],
                    "entity_id": payload.get("entity_id"),
                    "usage_type": payload["usage_type"],
                    "label": payload.get("label", ""),
                    "created_at": created_at,
                },
            ).fetchone()
            session.commit()
        return {
            "id": str(row[0]) if row[0] is not None else None,
            "media_id": str(row[1]) if row[1] is not None else None,
            "entity_type": row[2],
            "entity_id": row[3],
            "usage_type": row[4],
            "label": row[5],
            "created_at": row[6],
        }

    def delete_media_usage(self, usage_id: str) -> bool:
        with SessionLocal() as session:
            result = session.execute(text("DELETE FROM media_usage WHERE id = :usage_id"), {"usage_id": usage_id})
            session.commit()
        return result.rowcount > 0

    def list_media_versions(self, media_id: str) -> list[dict[str, Any]]:
        with SessionLocal() as session:
            rows = session.execute(
                text(
                    """
                    SELECT id, media_id, version_number, old_url, old_filename, replaced_at, replaced_by
                    FROM media_versions
                    WHERE media_id = :media_id
                    ORDER BY version_number DESC
                    """
                ),
                {"media_id": media_id},
            ).fetchall()
        return [
            {
                "id": str(row[0]) if row[0] is not None else None,
                "media_id": str(row[1]) if row[1] is not None else None,
                "version_number": row[2],
                "old_url": row[3],
                "old_filename": row[4],
                "replaced_at": row[5],
                "replaced_by": str(row[6]) if row[6] is not None else None,
            }
            for row in rows
        ]

    def list_media_audit_logs(self, media_id: str | None = None) -> list[dict[str, Any]]:
        with SessionLocal() as session:
            if media_id:
                rows = session.execute(
                    text(
                        """
                        SELECT id, media_id, action, actor_id, metadata, created_at
                        FROM media_audit_logs
                        WHERE media_id = :media_id
                        ORDER BY created_at DESC
                        """
                    ),
                    {"media_id": media_id},
                ).fetchall()
            else:
                rows = session.execute(
                    text(
                        """
                        SELECT id, media_id, action, actor_id, metadata, created_at
                        FROM media_audit_logs
                        ORDER BY created_at DESC
                        LIMIT 100
                        """
                    )
                ).fetchall()
        return [
            {
                "id": str(row[0]) if row[0] is not None else None,
                "media_id": str(row[1]) if row[1] is not None else None,
                "action": row[2],
                "actor_id": str(row[3]) if row[3] is not None else None,
                "metadata": row[4],
                "created_at": row[5],
            }
            for row in rows
        ]

#!/usr/bin/env python3
"""
Migration script: replace media_files.url when it points to localhost (or http) with the storage provider public URL.

Usage:
  PYTHONPATH=. .venv/bin/python3 scripts/migrate_media_urls.py

This script updates rows in-place. Make a DB backup before running in production.
"""
from __future__ import annotations

from backend.app.services.storage_provider import get_storage_provider
from backend.app.core.database import SessionLocal
from sqlalchemy import text


def main() -> None:
    provider = get_storage_provider()
    with SessionLocal() as session:
        rows = session.execute(
            text(
                "SELECT id, storage_key, url FROM media_files WHERE url LIKE '%localhost%' OR url LIKE 'http://%';"
            )
        ).fetchall()
        print(f"Found {len(rows)} candidate rows")
        updated = 0
        for r in rows:
            _id = r[0]
            storage_key = r[1]
            old_url = r[2]
            if not storage_key:
                print(f"Skipping {_id}: no storage_key")
                continue
            try:
                new_url = provider.public_url(storage_key)
            except Exception as exc:
                print(f"Provider failed for {_id}: {exc}")
                continue
            if new_url and new_url != old_url:
                session.execute(
                    text("UPDATE media_files SET url = :url, updated_at = NOW() WHERE id = :id"),
                    {"url": new_url, "id": _id},
                )
                updated += 1
                print(f"Updated {_id}")
        session.commit()
    print(f"Completed. Updated {updated} rows")


if __name__ == "__main__":
    main()

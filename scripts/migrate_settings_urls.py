#!/usr/bin/env python3
"""
Migration: replace settings values that contain localhost storage URLs
with the storage provider public URL when possible.

Usage:
  PYTHONPATH=. .venv/bin/python3 scripts/migrate_settings_urls.py

Make a DB backup before running in production.
"""
from __future__ import annotations

from backend.app.core.database import SessionLocal
from backend.app.services.storage_provider import get_storage_provider
from sqlalchemy import text


def main() -> None:
    provider = get_storage_provider()
    with SessionLocal() as session:
        rows = session.execute(text("SELECT key, value FROM app_settings WHERE value LIKE '%localhost:%' OR value LIKE 'http://%';"))
        rows = rows.fetchall()
        print(f"Found {len(rows)} settings rows to inspect")
        updated = 0
        for key, value in rows:
            if not value:
                continue
            # Heuristic: if value contains '/storage/' and we can find a storage_key fragment after it, use it
            if "/storage/" in value:
                parts = value.split('/storage/', 1)
                storage_key = parts[1].lstrip('/')
                try:
                    new_url = provider.public_url(storage_key)
                except Exception as exc:
                    print(f"Provider failed for {key}: {exc}")
                    continue
                if new_url and new_url != value:
                    session.execute(text("UPDATE app_settings SET value = :value, updated_at = NOW() WHERE key = :key"), {"value": new_url, "key": key})
                    updated += 1
                    print(f"Updated setting {key}")
        session.commit()
    print(f"Completed. Updated {updated} settings rows")


if __name__ == '__main__':
    main()

from __future__ import annotations

import json
from pathlib import Path

from fastapi import FastAPI, Query, Request
from fastapi.responses import JSONResponse

from backend.app.api import v1_router
from backend.app.core.bootstrap import initialize_system_seed
from backend.app.core.config import settings
from backend.app.core.database import SessionLocal

ROOT_DIR = Path(__file__).resolve().parents[2]
VERSION_FILE_PATHS = [ROOT_DIR / "VERSION.json", ROOT_DIR / "dist" / "VERSION.json"]


def read_release_info() -> dict[str, object]:
    for version_path in VERSION_FILE_PATHS:
        if version_path.exists():
            try:
                return json.loads(version_path.read_text(encoding="utf-8"))
            except (json.JSONDecodeError, OSError):
                continue

    return {
        "application": settings.APP_NAME,
        "git_commit": "unknown",
        "branch": "unknown",
        "build_date": "unknown",
        "build_hash": "unknown",
        "environment": "local",
    }


app = FastAPI(title=settings.APP_NAME, version="0.2.0")

# Include versioned API routers
app.include_router(v1_router)


@app.middleware("http")
async def startup_seed_middleware(request: Request, call_next):
    if request.url.path in {"/health", "/docs", "/openapi.json"}:
        return await call_next(request)

    db = SessionLocal()
    try:
        initialize_system_seed(db)
    finally:
        db.close()
    return await call_next(request)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "egs-local-api"}


@app.get("/api/v1/version")
def version_info() -> dict[str, object]:
    return read_release_info()


@app.get("/api/attestations/verify")
def verify_attestation(
    ref: str | None = Query(default=None),
    control: str | None = Query(default=None),
    hash: str | None = Query(default=None),
) -> dict[str, object]:
    lookup = ref or control or hash
    if not lookup:
        return JSONResponse(
            status_code=400,
            content={"error": "Référence, numéro de contrôle ou hash requis."},
        )

    return {
        "reference": lookup,
        "statut": "ok",
        "document_authentic": True,
        "attestation_type": "local",
        "source": "self-hosted",
    }

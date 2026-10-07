from fastapi import FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from pathlib import Path
import os
import json
import logging
from starlette.middleware.base import BaseHTTPMiddleware

from app.api import v1_router
from app.api.storage_files import router as storage_files_router
from app.core.bootstrap import initialize_system_seed
from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import AuthenticationError, AuthorizationError, RateLimitError

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

# Ensure .webp MIME type is registered
import mimetypes
mimetypes.add_type("image/webp", ".webp")

# Serve storage files through an authorization-aware route.
app.include_router(storage_files_router)

# CORS middleware - uses the shared configuration so local dev ports are allowed
# without requiring each environment file to be manually updated.
cors_origins = settings.cors_origins()

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "PUT", "PATCH", "DELETE"],
    allow_headers=["*"],
    expose_headers=["*"],
)


class AuthTransportSecurityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        auth_path = request.url.path.startswith(("/api/v1/auth/", "/api/auth/"))
        if auth_path and settings.AUTH_REQUIRE_HTTPS:
            host = (request.url.hostname or "").lower()
            local = host in {"localhost", "127.0.0.1", "::1", "testserver"}
            forwarded_proto = request.headers.get("x-forwarded-proto", "").split(",", 1)[0].strip().lower()
            if forwarded_proto != "https":
                try:
                    forwarded_proto = json.loads(request.headers.get("cf-visitor", "{}")).get("scheme", "").lower()
                except (TypeError, json.JSONDecodeError):
                    forwarded_proto = ""
            if not local and request.url.scheme != "https" and forwarded_proto != "https":
                return JSONResponse(
                    status_code=426,
                    content={"detail": "HTTPS est obligatoire pour les parcours d’authentification."},
                )
        return await call_next(request)


class LegacyAPIPrefixMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        path = request.scope.get("path", "")
        # Rewrite legacy /api/... paths to /api/v1/... for compatibility in tests
        if path.startswith("/api/") and not path.startswith("/api/v1/") and not path.startswith("/api/attestations"):
            new_path = "/api/v1" + path[4:]
            request.scope["path"] = new_path
            request.scope["raw_path"] = new_path.encode("utf-8")
        return await call_next(request)


app.add_middleware(LegacyAPIPrefixMiddleware)
app.add_middleware(AuthTransportSecurityMiddleware)

# Custom exception handlers for authentication/authorization errors to return structured format
@app.exception_handler(AuthenticationError)
async def authentication_error_handler(request: Request, exc: AuthenticationError):
    return JSONResponse(
        status_code=401,
        content={"detail": str(exc), "code": "invalid_credentials"},
    )

@app.exception_handler(AuthorizationError)
async def authorization_error_handler(request: Request, exc: AuthorizationError):
    return JSONResponse(
        status_code=401,
        content={"detail": str(exc), "code": "invalid_or_missing_token"},
    )


@app.exception_handler(RateLimitError)
async def rate_limit_error_handler(request: Request, exc: RateLimitError):
    return JSONResponse(
        status_code=429,
        content={"detail": "Trop de tentatives. Réessayez plus tard.", "code": "rate_limited"},
        headers={"Retry-After": str(settings.AUTH_RATE_LIMIT_WINDOW_SECONDS)},
    )

# Include versioned API routers
app.include_router(v1_router)


@app.on_event("startup")
def run_system_seed() -> None:
    """Seed ne s'exécute qu'une seule fois au démarrage (et non à chaque requête).
    Un seed replané dans un middleware HTTP transformait toute erreur en 500 global."""
    db = SessionLocal()
    try:
        initialize_system_seed(db)
    finally:
        db.close()


@app.on_event("startup")
def check_whatsapp_configuration() -> None:
    """Vérifie rapidement la configuration WhatsApp et log des warnings non bloquants."""
    provider = os.getenv("WHATSAPP_PROVIDER")
    if not provider:
        return

    missing = []
    if provider == "callmebot":
        if not os.getenv("CALLMEBOT_API_KEY"):
            missing.append("CALLMEBOT_API_KEY")
    if provider == "twilio":
        for v in ("TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_WHATSAPP_FROM"):
            if not os.getenv(v):
                missing.append(v)
    if provider == "messagebird":
        if not os.getenv("MESSAGEBIRD_API_KEY"):
            missing.append("MESSAGEBIRD_API_KEY")
    if provider == "whatsapp_business_api":
        for v in ("WHATSAPP_BUSINESS_TOKEN", "WHATSAPP_BUSINESS_NUMBER"):
            if not os.getenv(v):
                missing.append(v)

    if missing:
        import logging
        logging.warning("WhatsApp provider %s configured but missing env vars: %s", provider, ",".join(missing))


@app.on_event("startup")
def check_password_reset_configuration() -> None:
    if not (settings.SMTP_HOST and settings.SMTP_FROM):
        logging.getLogger(__name__).warning(
            "Password reset email is not configured; forgot-password requests will not deliver email"
        )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "egs-local-api"}


@app.get("/ready")
def readiness() -> dict[str, str]:
    with SessionLocal() as db:
        db.execute(text("SELECT version_num FROM alembic_version LIMIT 1")).scalar_one()
    return {"status": "ready", "service": "egs-local-api"}


@app.get("/api/v1/health")
def health_v1() -> dict[str, str]:
    return {"status": "ok", "service": "egs-local-api", "version": "v1"}


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

import os
from pathlib import Path
import logging

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env", override=False)


_CONFIG_BACKEND_DIR = Path(__file__).resolve().parents[2]
if _CONFIG_BACKEND_DIR.name != "backend":
    # In the Docker image the package is copied to /app/app, while the
    # persistent storage volume is mounted at /app/backend/storage.
    _CONFIG_BACKEND_DIR = _CONFIG_BACKEND_DIR / "backend"

_storage_root_env = os.getenv("LOCAL_STORAGE_ROOT")
_storage_root = Path(_storage_root_env).expanduser() if _storage_root_env else (
    _CONFIG_BACKEND_DIR / "storage" / "uploads"
)
if not _storage_root.is_absolute():
    _storage_root = _CONFIG_BACKEND_DIR / _storage_root
_DEFAULT_STORAGE_ROOT = _storage_root.resolve()


class Settings:
    APP_NAME = os.getenv("APP_NAME", "EGS Local API")
    STORAGE_ROOT = _DEFAULT_STORAGE_ROOT
    SECRET_KEY = os.getenv("LOCAL_AUTH_SECRET")
    if not SECRET_KEY:
        raise RuntimeError(
            "LOCAL_AUTH_SECRET doit être défini explicitement; aucune clé "
            "JWT éphémère n'est autorisée"
        )
    AUTH_SECRET_CONFIGURED = True
    # Dedicated local gate fixture. Never set in production environments.
    TEST_TOTP_SECRET = os.getenv("EGS_TEST_TOTP_SECRET", "")
    TEST_TOTP_USER_ID = os.getenv("EGS_TEST_TOTP_USER_ID", "")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_TTL_SECONDS = int(os.getenv("LOCAL_AUTH_ACCESS_TOKEN_TTL_SECONDS", "600"))
    REFRESH_TOKEN_TTL_SECONDS = int(os.getenv("LOCAL_AUTH_REFRESH_TOKEN_TTL_SECONDS", "604800"))
    AUTH_REFRESH_COOKIE_NAME = os.getenv("AUTH_REFRESH_COOKIE_NAME", "egs_refresh")
    AUTH_REQUIRE_HTTPS = os.getenv("AUTH_REQUIRE_HTTPS", "true").strip().lower() == "true"
    AUTH_COOKIE_SECURE = os.getenv("AUTH_COOKIE_SECURE", "true").strip().lower() == "true"
    AUTH_COOKIE_SAMESITE = os.getenv("AUTH_COOKIE_SAMESITE", "lax").strip().lower()
    AUTH_LOGIN_RATE_LIMIT = int(os.getenv("AUTH_LOGIN_RATE_LIMIT", "10"))
    AUTH_RESET_RATE_LIMIT = int(os.getenv("AUTH_RESET_RATE_LIMIT", "5"))
    AUTH_RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("AUTH_RATE_LIMIT_WINDOW_SECONDS", "900"))
    PASSWORD_RESET_TTL_SECONDS = int(os.getenv("PASSWORD_RESET_TTL_SECONDS", "1800"))
    PUBLIC_APP_URL = os.getenv("PUBLIC_APP_URL", "https://gnambaservices.ci").rstrip("/")
    SMTP_HOST = os.getenv("SMTP_HOST", "")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM = os.getenv("SMTP_FROM", "")

    DEFAULT_CORS_ORIGINS = [
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://gnambaservices.ci",
        "https://www.gnambaservices.ci",
        "https://api.gnambaservices.ci",
    ]

    def cors_origins(self) -> list[str]:
        """Return a cleaned list of CORS origins from attribute or env var.

        Accepts a comma-separated string optionally containing quotes and
        whitespace (as used in tests). The default local frontend origins are
        always kept so local dev works even when explicit environment values are
        provided for production. Duplicates are removed while preserving order.
        """
        raw = getattr(self, "CORS_ORIGINS", None)
        if raw is None or raw == "":
            raw = os.getenv("CORS_ORIGINS", "")

        defaults = list(self.DEFAULT_CORS_ORIGINS)
        if not raw:
            return defaults

        env_origins = [
            p.strip().strip("'\"")
            for p in raw.split(",")
            if p.strip()
        ]

        merged = defaults[:]
        for origin in env_origins:
            if origin and origin not in merged:
                merged.append(origin)
        return merged


settings = Settings()

logger = logging.getLogger(__name__)
if len(settings.SECRET_KEY) < 32:
    raise RuntimeError("LOCAL_AUTH_SECRET must contain at least 32 characters")

import os
from pathlib import Path
import logging

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env", override=False)


class Settings:
    APP_NAME = os.getenv("APP_NAME", "EGS Local API")
    SECRET_KEY = os.getenv("LOCAL_AUTH_SECRET", "egs-local-dev-secret-change-me")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_TTL_SECONDS = int(os.getenv("LOCAL_AUTH_ACCESS_TOKEN_TTL_SECONDS", "3600"))
    REFRESH_TOKEN_TTL_SECONDS = int(os.getenv("LOCAL_AUTH_REFRESH_TOKEN_TTL_SECONDS", "2592000"))

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
        whitespace (as used in tests). Includes the local Vite frontend by
        default so the dev server can talk to the API without manual env edits.
        """
        raw = getattr(self, "CORS_ORIGINS", None)
        if raw is None or raw == "":
            raw = os.getenv("CORS_ORIGINS", "")

        if not raw:
            return list(self.DEFAULT_CORS_ORIGINS)

        env_origins = [
            p.strip().strip("'\"")
            for p in raw.split(",")
            if p.strip()
        ]
        return env_origins


settings = Settings()

# Warn at startup if using the insecure default secret. This helps catch
# cases where the operator forgot to provide a proper secret in production.
logger = logging.getLogger(__name__)
if settings.SECRET_KEY == "egs-local-dev-secret-change-me":
    logger.warning(
        "LOCAL_AUTH_SECRET is set to the default insecure value. "
        "Set LOCAL_AUTH_SECRET in .env.server or environment for production."
    )

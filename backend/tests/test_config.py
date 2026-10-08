import os
import subprocess
import sys

from app.core.config import Settings


def test_cors_origins_strips_quotes_from_comma_separated_values() -> None:
    settings = Settings()
    settings.CORS_ORIGINS = "'http://localhost:8080', 'http://localhost:8000'"

    origins = settings.cors_origins()

    assert "http://localhost:8080" in origins
    assert "http://localhost:8000" in origins
    assert "http://localhost:5173" in origins


def test_cors_origins_include_local_dev_frontend_ports() -> None:
    settings = Settings()
    settings.CORS_ORIGINS = ""

    origins = settings.cors_origins()

    assert "http://localhost:5173" in origins
    assert "http://127.0.0.1:5173" in origins


def test_cors_origins_merge_env_values_with_default_local_dev_ports() -> None:
    settings = Settings()
    settings.CORS_ORIGINS = "https://gnambaservices.ci,https://www.gnambaservices.ci"

    origins = settings.cors_origins()

    assert "https://gnambaservices.ci" in origins
    assert "http://localhost:5173" in origins
    assert "http://127.0.0.1:5173" in origins


def test_database_requires_explicit_database_url() -> None:
    environment = os.environ.copy()
    environment["DATABASE_URL"] = ""
    result = subprocess.run(
        [sys.executable, "-c", "import app.core.database"],
        cwd="backend",
        env=environment,
        capture_output=True,
        text=True,
    )

    assert result.returncode != 0
    assert "DATABASE_URL doit être défini explicitement" in result.stderr


def test_auth_secret_requires_explicit_stable_value() -> None:
    environment = os.environ.copy()
    environment["DATABASE_URL"] = "sqlite:///./_test_sqlite.db"
    environment["LOCAL_AUTH_SECRET"] = ""
    result = subprocess.run(
        [sys.executable, "-c", "import app.core.config"],
        cwd="backend",
        env=environment,
        capture_output=True,
        text=True,
    )

    assert result.returncode != 0
    assert "LOCAL_AUTH_SECRET doit être défini explicitement" in result.stderr

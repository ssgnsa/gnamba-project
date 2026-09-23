from app.core.config import Settings


def test_cors_origins_strips_quotes_from_comma_separated_values() -> None:
    settings = Settings()
    settings.CORS_ORIGINS = "'http://localhost:8080', 'http://localhost:8000'"

    assert settings.cors_origins() == [
        "http://localhost:8080",
        "http://localhost:8000",
    ]


def test_cors_origins_include_local_dev_frontend_ports() -> None:
    settings = Settings()
    settings.CORS_ORIGINS = ""

    origins = settings.cors_origins()

    assert "http://localhost:5173" in origins
    assert "http://127.0.0.1:5173" in origins

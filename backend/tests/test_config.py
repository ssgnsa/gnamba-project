from app.core.config import Settings


def test_cors_origins_strips_quotes_from_comma_separated_values() -> None:
    settings = Settings()
    settings.CORS_ORIGINS = "'http://localhost:8080', 'http://localhost:8000'"

    assert settings.cors_origins() == [
        "http://localhost:8080",
        "http://localhost:8000",
    ]

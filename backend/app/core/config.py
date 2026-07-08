import os


class Settings:
    APP_NAME = os.getenv("APP_NAME", "EGS Local API")
    SECRET_KEY = os.getenv("LOCAL_AUTH_SECRET", "egs-local-dev-secret-change-me")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_TTL_SECONDS = int(os.getenv("LOCAL_AUTH_ACCESS_TOKEN_TTL_SECONDS", "3600"))
    REFRESH_TOKEN_TTL_SECONDS = int(os.getenv("LOCAL_AUTH_REFRESH_TOKEN_TTL_SECONDS", "2592000"))


settings = Settings()

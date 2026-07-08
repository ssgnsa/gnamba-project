from __future__ import annotations

from typing import Any

from backend.app.application.user_service import UserApplicationService
from backend.app.repositories.user_repository import UserRepositoryPort


class AuthService(UserApplicationService):
    def __init__(self, user_repository: UserRepositoryPort) -> None:
        super().__init__(user_repository)

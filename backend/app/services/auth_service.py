from __future__ import annotations

from typing import Any

from app.application.user_service import UserApplicationService
from app.infrastructure.auth_state_repository import AuthStateRepository
from app.repositories.user_repository import UserRepositoryPort


class AuthService(UserApplicationService):
    def __init__(
        self,
        user_repository: UserRepositoryPort,
        auth_state_repository: AuthStateRepository | None = None,
    ) -> None:
        super().__init__(user_repository, auth_state_repository)

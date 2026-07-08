from __future__ import annotations

from sqlalchemy.orm import Session

from backend.app.repositories.sqlalchemy_user_repository import seed_system


def initialize_system_seed(db: Session) -> None:
    """Seed the local PostgreSQL-backed system once at startup."""
    seed_system(db)

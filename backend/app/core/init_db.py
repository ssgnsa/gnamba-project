from __future__ import annotations

from sqlalchemy import text

from backend.app.core.database import Base, engine
from backend.app.models.user import User


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


def reset_db() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

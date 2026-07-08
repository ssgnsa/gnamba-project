from __future__ import annotations

from sqlalchemy import Column, DateTime, String
from sqlalchemy.sql import func

from backend.app.core.database import Base


class ProjectModel(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, index=True)
    nom = Column(String, nullable=False)
    description = Column(String, nullable=True)
    statut = Column(String, nullable=False, default="planifie")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


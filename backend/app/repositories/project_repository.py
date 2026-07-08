from __future__ import annotations

from uuid import uuid4

from sqlalchemy.orm import Session

from backend.app.domain.project import Project
from backend.app.models.project import ProjectModel


class SqlAlchemyProjectRepository:
    def __init__(self, db: Session) -> None:
        self.db = db
        ProjectModel.__table__.create(bind=self.db.get_bind(), checkfirst=True)

    def create(self, payload: dict[str, object]) -> Project:
        project = ProjectModel(
            id=str(uuid4()),
            nom=str(payload["nom"]),
            description=payload.get("description") if payload.get("description") is not None else None,
            statut=str(payload.get("statut") or "planifie"),
        )
        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)
        return self._to_domain(project)

    def list(self) -> list[Project]:
        rows = self.db.query(ProjectModel).order_by(ProjectModel.created_at.desc()).all()
        return [self._to_domain(row) for row in rows]

    def _to_domain(self, row: ProjectModel) -> Project:
        return Project(
            id=row.id,
            nom=row.nom,
            description=row.description,
            statut=row.statut,
        )


from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.repositories.generic_table_repository import GenericTableRepository

router = APIRouter(prefix="/api/v1/projects", tags=["projects"])


class ProjectCreateRequest(BaseModel):
    nom: str
    client_id: str | None = None
    localisation: str | None = None
    type_projet: str | None = None
    budget: float | None = None
    date_debut: str | None = None
    date_fin: str | None = None
    description: str | None = None
    statut: str = "devis"
    notes: str | None = None
    cover_image_url: str | None = None


class ProjectResponse(BaseModel):
    id: str
    nom: str
    client_id: str | None = None
    localisation: str | None = None
    type_projet: str | None = None
    budget: float | None = None
    date_debut: str | None = None
    date_fin: str | None = None
    description: str | None = None
    statut: str
    notes: str | None = None
    cover_image_url: str | None = None
    created_at: Any | None = None
    updated_at: Any | None = None


PROJECT_COLUMNS = {
    "nom": "TEXT NOT NULL",
    "client_id": "TEXT",
    "localisation": "TEXT",
    "type_projet": "TEXT",
    "budget": "REAL",
    "date_debut": "TEXT",
    "date_fin": "TEXT",
    "statut": "TEXT",
    "description": "TEXT",
    "notes": "TEXT",
    "cover_image_url": "TEXT",
}


def _repository(db: Session) -> GenericTableRepository:
    return GenericTableRepository(db, "projects", PROJECT_COLUMNS, {"statut": "devis", "budget": 0})


@router.post("", response_model=ProjectResponse)
def create_project(
    payload: ProjectCreateRequest,
    db: Session = Depends(get_db),
) -> ProjectResponse:
    project = _repository(db).create(payload.model_dump(exclude_unset=True))
    return ProjectResponse(**project)


@router.get("", response_model=list[ProjectResponse])
def list_projects(db: Session = Depends(get_db)) -> list[ProjectResponse]:
    return [ProjectResponse(**item) for item in _repository(db).list(order_by="created_at")]


@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: str, payload: dict[str, Any], db: Session = Depends(get_db)) -> ProjectResponse:
    updated = _repository(db).update(project_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Projet introuvable")
    return ProjectResponse(**updated)


@router.delete("/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db)) -> dict[str, str]:
    if not _repository(db).delete(project_id):
        raise HTTPException(status_code=404, detail="Projet introuvable")
    return {"status": "ok", "message": "Projet supprimé"}

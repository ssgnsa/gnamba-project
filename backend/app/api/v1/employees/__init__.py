from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.repositories.generic_table_repository import GenericTableRepository

router = APIRouter(prefix="/api/v1/employees", tags=["employees"])


class EmployeeCreateRequest(BaseModel):
    nom: str
    prenom: str
    poste: str | None = None
    email: str | None = None
    department: str | None = None
    telephone: str | None = None
    salaire: float | None = None
    date_embauche: str | None = None
    statut: str = "actif"
    notes: str | None = None
    photo_url: str | None = None


class EmployeeResponse(BaseModel):
    id: str
    nom: str
    prenom: str
    poste: str | None = None
    email: str | None = None
    department: str | None = None
    telephone: str | None = None
    salaire: float | None = None
    date_embauche: str | None = None
    statut: str = "actif"
    notes: str | None = None
    photo_url: str | None = None
    created_at: Any | None = None
    updated_at: Any | None = None


EMPLOYEE_COLUMNS = {
    "nom": "TEXT NOT NULL",
    "prenom": "TEXT NOT NULL",
    "poste": "TEXT",
    "department": "TEXT",
    "telephone": "TEXT",
    "email": "TEXT",
    "salaire": "REAL",
    "date_embauche": "TEXT",
    "statut": "TEXT",
    "notes": "TEXT",
    "photo_url": "TEXT",
}


def _repository(db: Session) -> GenericTableRepository:
    return GenericTableRepository(db, "employees", EMPLOYEE_COLUMNS, {"statut": "actif"})


@router.post("", response_model=EmployeeResponse)
def create_employee(payload: EmployeeCreateRequest, db: Session = Depends(get_db)) -> EmployeeResponse:
    employee = _repository(db).create(payload.model_dump(exclude_unset=True))
    return EmployeeResponse(**employee)


@router.get("", response_model=list[EmployeeResponse])
def list_employees(db: Session = Depends(get_db)) -> list[EmployeeResponse]:
    return [EmployeeResponse(**item) for item in _repository(db).list(order_by="nom", descending=False)]


@router.patch("/{employee_id}", response_model=EmployeeResponse)
def update_employee(employee_id: str, payload: dict[str, Any], db: Session = Depends(get_db)) -> EmployeeResponse:
    updated = _repository(db).update(employee_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Employé introuvable")
    return EmployeeResponse(**updated)


@router.delete("/{employee_id}")
def delete_employee(employee_id: str, db: Session = Depends(get_db)) -> dict[str, str]:
    if not _repository(db).delete(employee_id):
        raise HTTPException(status_code=404, detail="Employé introuvable")
    return {"status": "ok", "message": "Employé supprimé"}

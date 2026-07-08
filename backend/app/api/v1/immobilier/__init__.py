from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.repositories.generic_table_repository import GenericTableRepository

router = APIRouter(prefix="/api/v1/immobilier", tags=["immobilier"])


class ImmobilierCreateRequest(BaseModel):
    titre: str
    ville: str | None = None
    prix: float | None = None


class ImmobilierResponse(BaseModel):
    id: str
    titre: str
    ville: str | None = None
    prix: float | None = None
    created_at: Any | None = None
    updated_at: Any | None = None


IMMOBILIER_COLUMNS = {
    "titre": "TEXT NOT NULL",
    "ville": "TEXT",
    "prix": "REAL",
}


def _repository(db: Session) -> GenericTableRepository:
    return GenericTableRepository(db, "immobilier_items", IMMOBILIER_COLUMNS)


@router.post("", response_model=ImmobilierResponse)
def create_immobilier(payload: ImmobilierCreateRequest, db: Session = Depends(get_db)) -> ImmobilierResponse:
    item = _repository(db).create(payload.model_dump(exclude_unset=True))
    return ImmobilierResponse(**item)


@router.get("", response_model=list[ImmobilierResponse])
def list_immobilier(db: Session = Depends(get_db)) -> list[ImmobilierResponse]:
    return [ImmobilierResponse(**item) for item in _repository(db).list(order_by="created_at")]


@router.patch("/{item_id}", response_model=ImmobilierResponse)
def update_immobilier(item_id: str, payload: dict[str, Any], db: Session = Depends(get_db)) -> ImmobilierResponse:
    updated = _repository(db).update(item_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Bien immobilier introuvable")
    return ImmobilierResponse(**updated)


@router.delete("/{item_id}")
def delete_immobilier(item_id: str, db: Session = Depends(get_db)) -> dict[str, str]:
    if not _repository(db).delete(item_id):
        raise HTTPException(status_code=404, detail="Bien immobilier introuvable")
    return {"status": "ok", "message": "Bien immobilier supprimé"}

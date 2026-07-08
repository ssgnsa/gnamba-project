from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.repositories.generic_table_repository import GenericTableRepository

router = APIRouter(prefix="/api/v1/suppliers", tags=["suppliers"])


class SupplierCreateRequest(BaseModel):
    nom: str
    email: str | None = None
    telephone: str | None = None
    adresse: str | None = None
    produits_fournis: str | None = None
    statut: str = "actif"
    notes: str | None = None


class SupplierResponse(BaseModel):
    id: str
    nom: str
    email: str | None = None
    telephone: str | None = None
    adresse: str | None = None
    produits_fournis: str | None = None
    statut: str = "actif"
    notes: str | None = None
    created_at: Any | None = None
    updated_at: Any | None = None


SUPPLIER_COLUMNS = {
    "nom": "TEXT NOT NULL",
    "telephone": "TEXT",
    "email": "TEXT",
    "adresse": "TEXT",
    "produits_fournis": "TEXT",
    "statut": "TEXT",
    "notes": "TEXT",
}


def _repository(db: Session) -> GenericTableRepository:
    return GenericTableRepository(db, "suppliers", SUPPLIER_COLUMNS, {"statut": "actif"})


@router.post("", response_model=SupplierResponse)
def create_supplier(payload: SupplierCreateRequest, db: Session = Depends(get_db)) -> SupplierResponse:
    supplier = _repository(db).create(payload.model_dump(exclude_unset=True))
    return SupplierResponse(**supplier)


@router.get("", response_model=list[SupplierResponse])
def list_suppliers(db: Session = Depends(get_db)) -> list[SupplierResponse]:
    return [SupplierResponse(**item) for item in _repository(db).list(order_by="nom", descending=False)]


@router.patch("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(supplier_id: str, payload: dict[str, Any], db: Session = Depends(get_db)) -> SupplierResponse:
    updated = _repository(db).update(supplier_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Fournisseur introuvable")
    return SupplierResponse(**updated)


@router.delete("/{supplier_id}")
def delete_supplier(supplier_id: str, db: Session = Depends(get_db)) -> dict[str, str]:
    if not _repository(db).delete(supplier_id):
        raise HTTPException(status_code=404, detail="Fournisseur introuvable")
    return {"status": "ok", "message": "Fournisseur supprimé"}

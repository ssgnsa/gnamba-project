from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.repositories.generic_table_repository import GenericTableRepository

router = APIRouter(prefix="/api/v1/finance", tags=["finance"])


class FinanceCreateRequest(BaseModel):
    reference: str
    montant: float
    type: str | None = None
    type_transaction: str | None = None
    categorie: str | None = None
    date_transaction: str | None = None
    mode_paiement: str | None = None
    description: str | None = None
    client_id: str | None = None
    project_id: str | None = None
    statut: str = "en_attente"


class FinanceResponse(BaseModel):
    id: str
    reference: str
    montant: float
    type: str | None = None
    type_transaction: str | None = None
    categorie: str | None = None
    date_transaction: str | None = None
    mode_paiement: str | None = None
    description: str | None = None
    client_id: str | None = None
    project_id: str | None = None
    statut: str | None = None
    created_at: Any | None = None
    updated_at: Any | None = None


FINANCE_COLUMNS = {
    "reference": "TEXT NOT NULL",
    "montant": "REAL NOT NULL",
    "type": "TEXT",
    "type_transaction": "TEXT",
    "categorie": "TEXT",
    "date_transaction": "TEXT",
    "mode_paiement": "TEXT",
    "description": "TEXT",
    "client_id": "TEXT",
    "project_id": "TEXT",
    "statut": "TEXT",
}


def _repository(db: Session) -> GenericTableRepository:
    return GenericTableRepository(
        db,
        "finances",
        FINANCE_COLUMNS,
        {"statut": "en_attente", "mode_paiement": "especes"},
    )


def _normalize(payload: dict[str, Any]) -> dict[str, Any]:
    if payload.get("type") and not payload.get("type_transaction"):
        payload["type_transaction"] = "recette" if payload["type"] in {"entree", "recette"} else "depense"
    if payload.get("type_transaction") and not payload.get("type"):
        payload["type"] = "entree" if payload["type_transaction"] == "recette" else "sortie"
    if not payload.get("categorie"):
        payload["categorie"] = payload.get("type") or payload.get("type_transaction") or "Transaction"
    return payload


@router.post("", response_model=FinanceResponse)
def create_finance_entry(payload: FinanceCreateRequest, db: Session = Depends(get_db)) -> FinanceResponse:
    entry = _repository(db).create(_normalize(payload.model_dump(exclude_unset=True)))
    return FinanceResponse(**entry)


@router.get("", response_model=list[FinanceResponse])
def list_finance_entries(db: Session = Depends(get_db)) -> list[FinanceResponse]:
    return [FinanceResponse(**item) for item in _repository(db).list(order_by="date_transaction")]


@router.patch("/{finance_id}", response_model=FinanceResponse)
def update_finance_entry(finance_id: str, payload: dict[str, Any], db: Session = Depends(get_db)) -> FinanceResponse:
    updated = _repository(db).update(finance_id, _normalize(payload))
    if not updated:
        raise HTTPException(status_code=404, detail="Transaction introuvable")
    return FinanceResponse(**updated)


@router.delete("/{finance_id}")
def delete_finance_entry(finance_id: str, db: Session = Depends(get_db)) -> dict[str, str]:
    if not _repository(db).delete(finance_id):
        raise HTTPException(status_code=404, detail="Transaction introuvable")
    return {"status": "ok", "message": "Transaction supprimée"}

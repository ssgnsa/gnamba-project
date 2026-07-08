from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.repositories.generic_table_repository import GenericTableRepository

router = APIRouter(prefix="/api/v1/tables", tags=["tables"])


TABLES: dict[str, tuple[str, dict[str, str], dict[str, Any]]] = {
    "tasks": (
        "tasks",
        {
            "titre": "TEXT",
            "description": "TEXT",
            "statut": "TEXT",
            "priorite": "TEXT",
            "date_debut": "TEXT",
            "date_echeance": "TEXT",
            "employee_id": "TEXT",
            "project_id": "TEXT",
        },
        {"statut": "a_faire", "priorite": "moyenne"},
    ),
    "taches": (
        "tasks",
        {
            "titre": "TEXT",
            "description": "TEXT",
            "statut": "TEXT",
            "priorite": "TEXT",
            "date_debut": "TEXT",
            "date_echeance": "TEXT",
            "employee_id": "TEXT",
            "project_id": "TEXT",
        },
        {"statut": "a_faire", "priorite": "moyenne"},
    ),
    "properties": (
        "properties",
        {
            "type_bien": "TEXT",
            "adresse": "TEXT",
            "proprietaire": "TEXT",
            "valeur": "REAL",
            "loyer_mensuel": "REAL",
            "statut": "TEXT",
            "description": "TEXT",
            "cover_image_url": "TEXT",
        },
        {"statut": "disponible", "valeur": 0, "loyer_mensuel": 0},
    ),
    "rent_payments": (
        "rent_payments",
        {
            "locataire_id": "TEXT",
            "property_id": "TEXT",
            "contract_id": "TEXT",
            "montant": "REAL",
            "date_paiement": "TEXT",
            "date_echeance": "TEXT",
            "mois_concerne": "TEXT",
            "mode_paiement": "TEXT",
            "statut": "TEXT",
            "notes": "TEXT",
            "reference": "TEXT",
        },
        {"statut": "en_attente", "montant": 0},
    ),
    "documents": (
        "documents",
        {
            "nom": "TEXT",
            "type_document": "TEXT",
            "url": "TEXT",
            "project_id": "TEXT",
            "description": "TEXT",
            "taille": "REAL",
            "mime_type": "TEXT",
        },
        {},
    ),
    "contact_messages": (
        "contact_messages",
        {
            "nom": "TEXT",
            "email": "TEXT",
            "telephone": "TEXT",
            "sujet": "TEXT",
            "message": "TEXT",
            "statut": "TEXT",
        },
        {"statut": "nouveau"},
    ),
    "page_layouts": (
        "page_layouts",
        {
            "page": "TEXT",
            "layout": "TEXT",
            "sections": "TEXT",
            "is_published": "BOOLEAN",
        },
        {"is_published": True},
    ),
    "site_realisations": (
        "site_realisations",
        {
            "titre": "TEXT",
            "description": "TEXT",
            "image_url": "TEXT",
            "categorie": "TEXT",
            "statut": "TEXT",
        },
        {"statut": "publie"},
    ),
    "vitrine_lots": (
        "vitrine_lots",
        {
            "reference": "TEXT",
            "localisation": "TEXT",
            "superficie": "REAL",
            "prix": "REAL",
            "statut": "TEXT",
        },
        {"statut": "disponible"},
    ),
}


def _repository(table: str, db: Session) -> GenericTableRepository:
    config = TABLES.get(table)
    if not config:
        raise HTTPException(status_code=404, detail="Table non exposée par l'API locale")
    table_name, columns, defaults = config
    return GenericTableRepository(db, table_name, columns, defaults)


@router.get("/{table}")
def list_rows(table: str, request: Request, db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    repository = _repository(table, db)
    rows = repository.list(
        order_by=request.query_params.get("order_by") or "created_at",
        descending=request.query_params.get("ascending") != "true",
    )
    for key, value in request.query_params.items():
        if key in {"order_by", "ascending"}:
            continue
        rows = [row for row in rows if str(row.get(key)) == value]
    return rows


@router.post("/{table}")
async def create_row(table: str, request: Request, db: Session = Depends(get_db)) -> dict[str, Any]:
    payload = await request.json()
    return _repository(table, db).create(payload)


@router.patch("/{table}/{row_id}")
async def update_row(table: str, row_id: str, request: Request, db: Session = Depends(get_db)) -> dict[str, Any]:
    payload = await request.json()
    updated = _repository(table, db).update(row_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Ligne introuvable")
    return updated


@router.delete("/{table}/{row_id}")
def delete_row(table: str, row_id: str, db: Session = Depends(get_db)) -> dict[str, str]:
    if not _repository(table, db).delete(row_id):
        raise HTTPException(status_code=404, detail="Ligne introuvable")
    return {"status": "ok", "message": "Ligne supprimée"}

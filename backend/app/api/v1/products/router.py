from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.generic_table_repository import GenericTableRepository

router = APIRouter(prefix="/api/v1/products", tags=["products"])


class ProductCreateRequest(BaseModel):
    designation: str | None = None
    nom: str | None = None
    categorie: str | None = None
    prix_unitaire: float | None = None
    stock_actuel: float | None = None
    stock_minimum: float | None = None
    unite: str | None = None
    description: str | None = None
    image_url: str | None = None


class ProductResponse(BaseModel):
    id: str
    designation: str | None = None
    nom: str | None = None
    categorie: str | None = None
    prix_unitaire: float | None = None
    stock_actuel: float | None = None
    stock_minimum: float | None = None
    unite: str | None = None
    description: str | None = None
    image_url: str | None = None
    created_at: Any | None = None
    updated_at: Any | None = None


PRODUCT_COLUMNS = {
    "designation": "TEXT",
    "nom": "TEXT",
    "categorie": "TEXT",
    "prix_unitaire": "REAL",
    "stock_actuel": "REAL",
    "stock_minimum": "REAL",
    "unite": "TEXT",
    "description": "TEXT",
    "image_url": "TEXT",
}


def _repository(db: Session) -> GenericTableRepository:
    return GenericTableRepository(
        db,
        "products",
        PRODUCT_COLUMNS,
        {"stock_actuel": 0, "stock_minimum": 0, "unite": "unité"},
    )


@router.post("", response_model=ProductResponse)
def create_product(payload: ProductCreateRequest, db: Session = Depends(get_db)) -> ProductResponse:
    values = payload.model_dump(exclude_unset=True)
    if not values.get("nom") and values.get("designation"):
        values["nom"] = values["designation"]
    if not values.get("designation") and values.get("nom"):
        values["designation"] = values["nom"]
    product = _repository(db).create(values)
    return ProductResponse(**product)


@router.get("", response_model=list[ProductResponse])
def list_products(db: Session = Depends(get_db)) -> list[ProductResponse]:
    return [ProductResponse(**item) for item in _repository(db).list(order_by="nom", descending=False)]


@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(product_id: str, payload: dict[str, Any], db: Session = Depends(get_db)) -> ProductResponse:
    if not payload.get("nom") and payload.get("designation"):
        payload["nom"] = payload["designation"]
    if not payload.get("designation") and payload.get("nom"):
        payload["designation"] = payload["nom"]
    updated = _repository(db).update(product_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Produit introuvable")
    return ProductResponse(**updated)


@router.delete("/{product_id}")
def delete_product(product_id: str, db: Session = Depends(get_db)) -> dict[str, str]:
    if not _repository(db).delete(product_id):
        raise HTTPException(status_code=404, detail="Produit introuvable")
    return {"status": "ok", "message": "Produit supprimé"}
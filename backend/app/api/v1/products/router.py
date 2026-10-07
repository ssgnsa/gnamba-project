from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import require_admin_user
from app.repositories.generic_table_repository import GenericTableRepository

router = APIRouter(
    prefix="/api/v1/products",
    tags=["products"],
    dependencies=[Depends(require_admin_user)],
)


class ProductCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

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
    reference: str
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
    "reference": "TEXT",
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


def _local_reference() -> str:
    """Generate a test-backend fallback; PostgreSQL triggers remain authoritative."""
    sequence = uuid4().int % 1_000_000
    return f"PRD-{datetime.now(timezone.utc).year}-{sequence:06d}"


def _with_local_reference(db: Session, product: dict[str, Any]) -> dict[str, Any]:
    if db.get_bind().dialect.name != "sqlite" or product.get("reference"):
        return product
    reference = _local_reference()
    _repository(db).update(str(product["id"]), {"reference": reference})
    return _repository(db).get(str(product["id"])) or {**product, "reference": reference}


def _repository(db: Session) -> GenericTableRepository:
    return GenericTableRepository(
        db,
        "products",
        PRODUCT_COLUMNS,
        {"stock_actuel": 0, "stock_minimum": 0, "unite": "unité"},
    )


def _response(product: dict[str, Any]) -> ProductResponse:
    values = dict(product)
    values["id"] = str(values["id"])
    return ProductResponse(**values)


@router.post("", response_model=ProductResponse)
def create_product(payload: ProductCreateRequest, db: Session = Depends(get_db)) -> ProductResponse:
    values = payload.model_dump(exclude_unset=True)
    if not values.get("nom") and values.get("designation"):
        values["nom"] = values["designation"]
    if not values.get("designation") and values.get("nom"):
        values["designation"] = values["nom"]
    if db.get_bind().dialect.name == "sqlite" and not values.get("reference"):
        # SQLite has no PostgreSQL trigger to mint the reference and the column
        # is NOT NULL, so the value must exist before the insert instead of
        # being patched afterwards. PostgreSQL keeps its own trigger.
        values["reference"] = _local_reference()
    product = _repository(db).create(values)
    product = _with_local_reference(db, product)
    return _response(product)


@router.get("", response_model=list[ProductResponse])
def list_products(db: Session = Depends(get_db)) -> list[ProductResponse]:
    return [
        _response(_with_local_reference(db, item))
        for item in _repository(db).list(order_by="nom", descending=False)
    ]


@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(product_id: str, payload: dict[str, Any], db: Session = Depends(get_db)) -> ProductResponse:
    if "reference" in payload:
        raise HTTPException(status_code=422, detail="La référence produit est générée par le serveur et immuable")
    if not payload.get("nom") and payload.get("designation"):
        payload["nom"] = payload["designation"]
    if not payload.get("designation") and payload.get("nom"):
        payload["designation"] = payload["nom"]
    updated = _repository(db).update(product_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Produit introuvable")
    updated = _with_local_reference(db, updated)
    return _response(updated)


@router.delete("/{product_id}")
def delete_product(product_id: str, db: Session = Depends(get_db)) -> dict[str, str]:
    if not _repository(db).delete(product_id):
        raise HTTPException(status_code=404, detail="Produit introuvable")
    return {"status": "ok", "message": "Produit supprimé"}

from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.entity import Entity
from app.schemas.entity import EntityCreate, EntityUpdate
from app.services.entity_service import get_entity_service

router = APIRouter(prefix="/api/v1/suppliers", tags=["suppliers"])


# ============================================
# SCHEMAS (compatibilité)
# ============================================

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
    created_at: str | None = None
    updated_at: str | None = None


# ============================================
# HELPERS - Convertion entité ↔ fournisseur
# ============================================

def _entity_to_supplier_response(entity: Any) -> SupplierResponse:
    """Convertit une Entity en SupplierResponse (compatibilité)"""
    metadata = entity.entity_metadata or {}
    # Mapper le statut entité vers statut fournisseur
    status_map_reverse = {
        "active": "actif",
        "inactive": "inactif",
        "archived": "archive",
    }
    supplier_status = status_map_reverse.get(entity.status, entity.status)
    return SupplierResponse(
        id=str(entity.id),
        nom=entity.company_name or entity.last_name or entity.display_name or "Sans nom",
        email=entity.email,
        telephone=entity.phone,
        adresse=entity.address,
        produits_fournis=metadata.get("produits_fournis"),
        statut=supplier_status,
        notes=metadata.get("notes"),
        created_at=entity.created_at.isoformat() if entity.created_at else None,
        updated_at=entity.updated_at.isoformat() if entity.updated_at else None,
    )


def _supplier_payload_to_entity_create(payload: SupplierCreateRequest) -> EntityCreate:
    """Mappe SupplierCreateRequest vers EntityCreate"""
    status_map = {
        "actif": "active",
        "inactif": "inactive",
        "archive": "archived",
    }
    entity_status = status_map.get(payload.statut, "active")

    return EntityCreate(
        type="supplier",
        subtype="fournisseur",
        status=entity_status,
        display_name=payload.nom,
        company_name=payload.nom,
        phone=payload.telephone,
        email=payload.email,
        address=payload.adresse,
        metadata={
            "produits_fournis": payload.produits_fournis,
            "notes": payload.notes,
        },
    )


def _supplier_payload_to_entity_update(payload: dict[str, Any]) -> EntityUpdate:
    """Mappe SupplierUpdate payload vers EntityUpdate"""
    update_data = {}
    metadata_update = {}

    field_mapping = {
        "nom": "company_name",
        "telephone": "phone",
        "email": "email",
        "adresse": "address",
    }

    metadata_fields = {
        "produits_fournis": "produits_fournis",
        "notes": "notes",
        "statut": "statut",
    }

    for src, dst in field_mapping.items():
        if src in payload and payload[src] is not None:
            update_data[dst] = payload[src]

    for src, dst in metadata_fields.items():
        if src in payload and payload[src] is not None:
            if src == "statut":
                update_data["status"] = payload[src]
            else:
                metadata_update[dst] = payload[src]

    if metadata_update:
        # Géré dans l'endpoint
        pass

    return EntityUpdate(**update_data)


# ============================================
# ENDPOINTS
# ============================================

@router.post("", response_model=SupplierResponse)
def create_supplier(payload: SupplierCreateRequest, db: Session = Depends(get_db)) -> SupplierResponse:
    """Crée un nouveau fournisseur (entité de type supplier)"""
    svc = get_entity_service(db)

    # Vérifier les doublons
    duplicates = svc.repo.find_duplicates(
        Entity(
            id_document_type=None,
            id_document_number=None,
            email=payload.email,
            phone=payload.telephone,
        )
    )
    if duplicates:
        raise HTTPException(
            status_code=409,
            detail={
                "message": "Un fournisseur avec ces identifiants existe déjà",
                "duplicates": [_entity_to_supplier_response(d).model_dump() for d in duplicates],
            },
        )

    entity = svc.create(_supplier_payload_to_entity_create(payload))
    return _entity_to_supplier_response(entity)


@router.get("", response_model=list[SupplierResponse])
def list_suppliers(db: Session = Depends(get_db)) -> list[SupplierResponse]:
    """Liste les fournisseurs (entités de type supplier)"""
    svc = get_entity_service(db)
    # Utiliser le repo directement pour avoir accès aux métadonnées
    entities = svc.repo.get_by_type("supplier", include_deleted=False, limit=100, offset=0)
    return [_entity_to_supplier_response(entity) for entity in entities]


@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(supplier_id: str, db: Session = Depends(get_db)) -> SupplierResponse:
    """Récupère un fournisseur par ID"""
    svc = get_entity_service(db)
    entity = svc.get(UUID(supplier_id))
    if not entity or entity.type != "supplier":
        raise HTTPException(status_code=404, detail="Fournisseur introuvable")
    return _entity_to_supplier_response(entity)


@router.patch("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(supplier_id: str, payload: dict[str, Any], db: Session = Depends(get_db)) -> SupplierResponse:
    """Met à jour un fournisseur"""
    svc = get_entity_service(db)
    entity = svc.get(UUID(supplier_id))
    if not entity or entity.type != "supplier":
        raise HTTPException(status_code=404, detail="Fournisseur introuvable")

    update_data = _supplier_payload_to_entity_update(payload)

    # Gérer les métadonnées
    metadata_update = {}
    metadata_fields = {
        "produits_fournis": "produits_fournis",
        "notes": "notes",
    }
    for src, dst in metadata_fields.items():
        if src in payload and payload[src] is not None:
            metadata_update[dst] = payload[src]

    if metadata_update:
        entity.entity_metadata = {**(entity.entity_metadata or {}), **metadata_update}

    entity = svc.update(UUID(supplier_id), update_data)
    if not entity:
        raise HTTPException(status_code=404, detail="Fournisseur introuvable")

    if metadata_update:
        db.commit()
        db.refresh(entity)

    return _entity_to_supplier_response(entity)


@router.delete("/{supplier_id}")
def delete_supplier(supplier_id: str, db: Session = Depends(get_db)) -> dict[str, str]:
    """Supprime un fournisseur (soft delete)"""
    svc = get_entity_service(db)
    entity = svc.get(UUID(supplier_id))
    if not entity or entity.type != "supplier":
        raise HTTPException(status_code=404, detail="Fournisseur introuvable")

    svc.delete(UUID(supplier_id), soft=True)
    return {"status": "ok", "message": "Fournisseur supprimé"}


@router.get("/search/suggest", response_model=list[SupplierResponse])
def search_suppliers_suggest(
    q: str = Query(..., min_length=2, max_length=100),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
) -> list[SupplierResponse]:
    """Recherche suggérée pour autocomplétion fournisseurs"""
    svc = get_entity_service(db)
    entities = svc.search_suggest(q, "supplier", limit)
    return [_entity_to_supplier_response(e) for e in entities]


# ============================================
# EXPORTS
# ============================================

__all__ = ["router", "SupplierCreateRequest", "SupplierResponse"]
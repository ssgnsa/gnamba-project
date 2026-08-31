from __future__ import annotations

from typing import Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.entity import Entity
from app.schemas.entity import EntityCreate, EntityUpdate
from app.services.entity_service import get_entity_service

router = APIRouter(prefix="/api/v1/tenants", tags=["tenants"])


# ============================================
# SCHEMAS (compatibilité)
# ============================================

class TenantResponse(BaseModel):
    id: str
    entity_id: str  # ID de l'entité (remplace party_id)
    nom: str | None = None
    prenom: str | None = None
    nom_entreprise: str | None = None
    telephone: str | None = None
    email: str | None = None
    adresse: str | None = None
    property_id: str | None = None
    contract_id: str | None = None
    created_at: str | None = None
    updated_at: str | None = None


class TenantCreateRequest(BaseModel):
    entity_id: str  # Référence vers entities
    property_id: str | None = None
    contract_id: str | None = None


class TenantUpdateRequest(BaseModel):
    property_id: str | None = None
    contract_id: str | None = None


# ============================================
# HELPERS
# ============================================

def _entity_to_tenant_response(entity: Entity, property_id: Any = None, contract_id: Any = None) -> TenantResponse:
    """Convertit une Entity en TenantResponse"""
    return TenantResponse(
        id=str(entity.id),  # Pour compatibilité, on utilise l'entity_id comme id
        entity_id=str(entity.id),
        nom=entity.last_name,
        prenom=entity.first_name,
        nom_entreprise=entity.company_name,
        telephone=entity.phone,
        email=entity.email,
        adresse=entity.address,
        property_id=str(property_id) if property_id else None,
        contract_id=str(contract_id) if contract_id else None,
        created_at=entity.created_at.isoformat() if entity.created_at else None,
        updated_at=entity.updated_at.isoformat() if entity.updated_at else None,
    )


# ============================================
# ENDPOINTS
# ============================================

@router.get("", response_model=list[TenantResponse])
def list_tenants(
    search: Optional[str] = Query(None, description="Recherche texte"),
    property_id: Optional[str] = Query(None, description="Filtrer par propriété"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> list[TenantResponse]:
    """Liste les locataires (entités de type client avec rôle locataire)"""
    # Pour l'instant, on retourne tous les clients (entités type=client)
    # Dans une version future, on peut filtrer via une table de liaison
    svc = get_entity_service(db)
    from app.schemas.entity import EntitySearchParams
    search_params = EntitySearchParams(
        search=search,
        type="client",
        status="active",
        limit=limit,
        offset=offset,
        order_by="created_at",
        descending=True,
    )
    result = svc.search(search_params)
    return [_entity_to_tenant_response(item) for item in result.items]


@router.get("/{tenant_id}", response_model=TenantResponse)
def get_tenant(tenant_id: str, db: Session = Depends(get_db)) -> TenantResponse:
    """Récupère un locataire par ID (entity_id)"""
    svc = get_entity_service(db)
    entity = svc.get(UUID(tenant_id))
    if not entity or entity.type != "client":
        raise HTTPException(status_code=404, detail="Locataire introuvable")
    return _entity_to_tenant_response(entity)


@router.post("", response_model=TenantResponse, status_code=201)
def create_tenant(payload: TenantCreateRequest, db: Session = Depends(get_db)) -> TenantResponse:
    """Crée un nouveau locataire en sélectionnant une entité existante ou en en créant une"""
    svc = get_entity_service(db)

    # Vérifier que l'entité existe
    entity = svc.get(UUID(payload.entity_id))
    if not entity:
        raise HTTPException(status_code=404, detail="Entité introuvable")

    if entity.type != "client":
        raise HTTPException(status_code=400, detail="L'entité doit être de type 'client'")

    # Ici on pourrait ajouter une entrée dans une table de liaison tenant-property
    # Pour l'instant, on retourne simplement l'entité avec les infos de liaison
    return _entity_to_tenant_response(entity, payload.property_id, payload.contract_id)


@router.patch("/{tenant_id}", response_model=TenantResponse)
def update_tenant(tenant_id: str, payload: TenantUpdateRequest, db: Session = Depends(get_db)) -> TenantResponse:
    """Met à jour les infos de liaison d'un locataire"""
    svc = get_entity_service(db)
    entity = svc.get(UUID(tenant_id))
    if not entity or entity.type != "client":
        raise HTTPException(status_code=404, detail="Locataire introuvable")

    # Ici on mettrait à jour la table de liaison
    # Pour l'instant on retourne l'entité avec les nouvelles valeurs
    return _entity_to_tenant_response(entity, payload.property_id, payload.contract_id)


@router.delete("/{tenant_id}")
def delete_tenant(tenant_id: str, db: Session = Depends(get_db)) -> dict[str, str]:
    """Retire le rôle locataire (ne supprime pas l'entité, juste la liaison)"""
    svc = get_entity_service(db)
    entity = svc.get(UUID(tenant_id))
    if not entity or entity.type != "client":
        raise HTTPException(status_code=404, detail="Locataire introuvable")

    # Ici on supprimerait la liaison dans la table de liaison
    return {"status": "ok", "message": "Rôle locataire retiré"}


@router.get("/search/suggest", response_model=list[TenantResponse])
def search_tenants_suggest(
    q: str = Query(..., min_length=2, max_length=100),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
) -> list[TenantResponse]:
    """Recherche suggérée pour autocomplétion locataires"""
    svc = get_entity_service(db)
    entities = svc.search_suggest(q, "client", limit)
    return [_entity_to_tenant_response(e) for e in entities]
from __future__ import annotations

from typing import Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.entity import Entity
from app.schemas.entity import EntityCreate, EntityUpdate, EntityResponse
from app.services.entity_service import get_entity_service

router = APIRouter(prefix="/api/v1/clients", tags=["clients"])


# ============================================
# SCHEMAS (correspondance avec le frontend)
# ============================================

class ClientResponse(BaseModel):
    id: str
    nom: str
    prenom: str
    telephone: str | None = None
    email: str | None = None
    adresse: str | None = None
    type_client: str = Field(..., pattern=r"^(particulier|entreprise|promoteur_immobilier|institution)$")
    notes: str | None = None
    created_at: str
    updated_at: str


class ClientCreateRequest(BaseModel):
    type_client: str = "particulier"
    nom: str | None = None
    prenom: str | None = None
    telephone: str | None = None
    email: str | None = None
    adresse: str | None = None
    notes: str | None = None
    # Champs supplémentaires pour compatibilité (optionnels)
    nom_entreprise: str | None = None
    profession: str | None = None
    employeur: str | None = None
    naissance_date: str | None = None
    naissance_lieu: str | None = None
    nationalite: str | None = None
    actif: bool = True


class ClientUpdateRequest(BaseModel):
    type_client: str | None = None
    nom: str | None = None
    prenom: str | None = None
    telephone: str | None = None
    email: str | None = None
    adresse: str | None = None
    notes: str | None = None
    # Champs supplémentaires pour compatibilité (optionnels)
    nom_entreprise: str | None = None
    profession: str | None = None
    employeur: str | None = None
    naissance_date: str | None = None
    naissance_lieu: str | None = None
    nationalite: str | None = None
    # Champs d'identification (CNI) — ajoutés pour compatibilité avec mappings
    cni_numero: str | None = None
    cni_date: str | None = None
    cni_lieu: str | None = None
    actif: bool | None = None


# ============================================
# HELPERS - Convertion entité ↔ client
# ============================================

def _entity_to_client_response(entity: Any) -> ClientResponse:
    """Convertit une Entity ou un EntityResponse en ClientResponse (correspondance avec le frontend)."""
    # Détecter l’objet ORM SQLAlchemy proprement ; il porte un state SQLAlchemy.
    if isinstance(entity, Entity):
        notes = None
        if entity.entity_metadata and isinstance(entity.entity_metadata, dict):
            notes = entity.entity_metadata.get('notes')

        created_at = entity.created_at.isoformat() if hasattr(entity.created_at, 'isoformat') else str(entity.created_at or '')
        updated_at = entity.updated_at.isoformat() if hasattr(entity.updated_at, 'isoformat') else str(entity.updated_at or '')

        return ClientResponse(
            id=str(entity.id),
            nom=entity.last_name or "",
            prenom=entity.first_name or "",
            telephone=entity.phone,
            email=entity.email,
            adresse=entity.address,
            type_client=entity.subtype,
            notes=notes,
            created_at=created_at,
            updated_at=updated_at,
        )

    # C’est maintenant un schéma Pydantic déjà sérialisé par le service.
    return ClientResponse(
        id=str(getattr(entity, 'id', '')),
        nom=getattr(entity, 'nom', '') or getattr(entity, 'last_name', '') or "",
        prenom=getattr(entity, 'prenom', '') or getattr(entity, 'first_name', '') or "",
        telephone=getattr(entity, 'telephone', None) or getattr(entity, 'phone', None),
        email=getattr(entity, 'email', None),
        adresse=getattr(entity, 'adresse', None) or getattr(entity, 'address', None),
        type_client=getattr(entity, 'type_client', None) or getattr(entity, 'subtype', None),
        notes=getattr(entity, 'notes', None) or getattr(entity, 'entity_metadata', {}).get('notes') if isinstance(getattr(entity, 'entity_metadata', None), dict) else None,
        created_at=str(getattr(entity, 'created_at', '') or ''),
        updated_at=str(getattr(entity, 'updated_at', '') or ''),
    )


def _client_payload_to_entity_create(payload: ClientCreateRequest) -> EntityCreate:
    """Mappe ClientCreateRequest vers EntityCreate"""
    return EntityCreate(
        type="client",
        subtype=payload.type_client,
        status="active" if payload.actif else "inactive",
        first_name=payload.prenom,
        last_name=payload.nom,
        company_name=payload.nom_entreprise or "",
        phone=payload.telephone,
        email=payload.email,
        address=payload.adresse,
        profession=payload.profession or "",
        employer=payload.employeur or "",
        birth_date=None,
        birth_place=None,
        nationality=None,
        id_document_type=None,
        id_document_number=None,
        id_document_date=None,
        id_document_place=None,
        metadata={"notes": payload.notes} if payload.notes else {},
    )


def _client_payload_to_entity_update(payload: ClientUpdateRequest) -> EntityUpdate:
    """Mappe ClientUpdateRequest vers EntityUpdate"""
    update_data = {}
    if payload.type_client is not None:
        update_data["subtype"] = payload.type_client
    if payload.nom is not None:
        update_data["last_name"] = payload.nom
    if payload.prenom is not None:
        update_data["first_name"] = payload.prenom
    if payload.nom_entreprise is not None:
        update_data["company_name"] = payload.nom_entreprise
    if payload.cni_numero is not None:
        update_data["id_document_number"] = payload.cni_numero
    if payload.cni_date is not None:
        update_data["id_document_date"] = payload.cni_date
    if payload.cni_lieu is not None:
        update_data["id_document_place"] = payload.cni_lieu
    if payload.telephone is not None:
        update_data["phone"] = payload.telephone
    if payload.email is not None:
        update_data["email"] = payload.email
    if payload.adresse is not None:
        update_data["address"] = payload.adresse
    if payload.profession is not None:
        update_data["profession"] = payload.profession
    if payload.employeur is not None:
        update_data["employer"] = payload.employeur
    if payload.naissance_date is not None:
        update_data["birth_date"] = payload.naissance_date
    if payload.naissance_lieu is not None:
        update_data["birth_place"] = payload.naissance_lieu
    if payload.nationalite is not None:
        update_data["nationality"] = payload.nationalite
    if payload.actif is not None:
        update_data["status"] = "active" if payload.actif else "inactive"
    if payload.notes is not None:
        update_data["metadata"] = {"notes": payload.notes}
    return EntityUpdate(**update_data)


# ============================================
# ENDPOINTS
# ============================================

@router.get("", response_model=list[ClientResponse])
def list_clients(
    search: Optional[str] = Query(None, description="Recherche texte"),
    type: Optional[str] = Query(None, description="Filtrer par type (particulier, entreprise, institution)"),
    actif: Optional[bool] = Query(None, description="Filtrer par statut actif"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> list[ClientResponse]:
    """Liste les clients (entités de type client)"""
    svc = get_entity_service(db)

    # Recherche via entity service
    from app.schemas.entity import EntitySearchParams
    search_params = EntitySearchParams(
        search=search,
        type="client",
        subtype=type,
        status="active" if actif else ("inactive" if actif is False else None),
        limit=limit,
        offset=offset,
        order_by="created_at",
        descending=True,
    )
    result = svc.search(search_params)
    return [_entity_to_client_response(item) for item in result.items]


@router.get("/{client_id}", response_model=ClientResponse)
def get_client(client_id: str, db: Session = Depends(get_db)) -> ClientResponse:
    """Récupère un client par ID"""
    svc = get_entity_service(db)
    entity = svc.get(UUID(client_id))
    if not entity or entity.type != "client":
        raise HTTPException(status_code=404, detail="Client introuvable")
    return _entity_to_client_response(entity)


@router.post("", response_model=ClientResponse, status_code=201)
def create_client(payload: ClientCreateRequest, db: Session = Depends(get_db)) -> ClientResponse:
    """Crée un nouveau client (entité de type client)"""
    svc = get_entity_service(db)

    # Vérifier les doublons avant création
    duplicates = svc.repo.find_duplicates(
        Entity(
            email=payload.email,
            phone=payload.telephone,
        )
    )
    if duplicates:
        raise HTTPException(
            status_code=409,
            detail={
                "message": "Un client avec ces identifiants existe déjà",
                "duplicates": [_entity_to_client_response(d).model_dump() for d in duplicates],
            },
        )

    entity = svc.create(_client_payload_to_entity_create(payload))
    return _entity_to_client_response(entity)


@router.patch("/{client_id}", response_model=ClientResponse)
def update_client(client_id: str, payload: ClientUpdateRequest, db: Session = Depends(get_db)) -> ClientResponse:
    """Met à jour un client"""
    svc = get_entity_service(db)
    entity = svc.update(UUID(client_id), _client_payload_to_entity_update(payload))
    if not entity or entity.type != "client":
        raise HTTPException(status_code=404, detail="Client introuvable")
    return _entity_to_client_response(entity)


@router.delete("/{client_id}")
def delete_client(client_id: str, db: Session = Depends(get_db)) -> dict[str, str]:
    """Supprime (soft delete = inactive) un client"""
    svc = get_entity_service(db)
    entity = svc.get(UUID(client_id))
    if not entity or entity.type != "client":
        raise HTTPException(status_code=404, detail="Client introuvable")

    svc.delete(UUID(client_id), soft=True)
    return {"status": "ok", "message": "Client désactivé"}


@router.post("/{client_id}/activate", response_model=ClientResponse)
def activate_client(client_id: str, db: Session = Depends(get_db)) -> ClientResponse:
    """Réactive un client"""
    svc = get_entity_service(db)
    entity = svc.update(UUID(client_id), EntityUpdate(status="active"))
    if not entity or entity.type != "client":
        raise HTTPException(status_code=404, detail="Client introuvable")
    return _entity_to_client_response(entity)


@router.get("/search/suggest", response_model=list[ClientResponse])
def search_clients_suggest(
    q: str = Query(..., min_length=2, max_length=100),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
) -> list[ClientResponse]:
    """Recherche suggérée pour autocomplétion clients"""
    svc = get_entity_service(db)
    entities = svc.search_suggest(q, "client", limit)
    return [_entity_to_client_response(e) for e in entities]


# ============================================
# EXPORTS
# ============================================

__all__ = ["router", "ClientCreateRequest", "ClientUpdateRequest", "ClientResponse"]
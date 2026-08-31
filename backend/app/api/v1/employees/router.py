from __future__ import annotations

from typing import Any
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.entity import Entity
from app.schemas.entity import EntityCreate, EntityUpdate, EntityResponse
from app.services.entity_service import get_entity_service

router = APIRouter(prefix="/api/v1/employees", tags=["employees"])


# ============================================
# SCHEMAS (compatibilité)
# ============================================

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
    created_at: str | None = None
    updated_at: str | None = None


# ============================================
# HELPERS - Convertion entité ↔ employé
# ============================================

def _entity_to_employee_response(entity: Any) -> EmployeeResponse:
    """Convertit une Entity en EmployeeResponse (compatibilité)"""
    metadata = entity.entity_metadata or {}
    # Mapper le statut entité vers statut employé
    status_map_reverse = {
        "active": "actif",
        "inactive": "inactif",
        "archived": "archive",
    }
    employee_status = status_map_reverse.get(entity.status, entity.status)
    return EmployeeResponse(
        id=str(entity.id),
        nom=entity.last_name or "",
        prenom=entity.first_name or "",
        poste=metadata.get("poste") or entity.profession,
        email=entity.email,
        department=metadata.get("department"),
        telephone=entity.phone,
        salaire=metadata.get("salaire"),
        date_embauche=metadata.get("date_embauche"),
        statut=employee_status,
        notes=metadata.get("notes"),
        photo_url=metadata.get("photo_url"),
        created_at=entity.created_at.isoformat() if entity.created_at else None,
        updated_at=entity.updated_at.isoformat() if entity.updated_at else None,
    )


def _employee_payload_to_entity_create(payload: EmployeeCreateRequest) -> EntityCreate:
    """Mappe EmployeeCreateRequest vers EntityCreate"""
    # Mapper le statut employé vers statut entité
    status_map = {
        "actif": "active",
        "inactif": "inactive",
        "archive": "archived",
    }
    entity_status = status_map.get(payload.statut, "active")

    return EntityCreate(
        type="employee",
        subtype="particulier",
        status=entity_status,
        display_name=f"{payload.prenom} {payload.nom.upper()}",
        first_name=payload.prenom,
        last_name=payload.nom,
        phone=payload.telephone,
        email=payload.email,
        profession=payload.poste,
        metadata={
            "poste": payload.poste,
            "department": payload.department,
            "salaire": payload.salaire,
            "date_embauche": payload.date_embauche,
            "statut": payload.statut,
            "notes": payload.notes,
            "photo_url": payload.photo_url,
        },
    )


def _employee_payload_to_entity_update(payload: dict[str, Any]) -> EntityUpdate:
    """Mappe EmployeeUpdate payload vers EntityUpdate"""
    update_data = {}
    metadata_update = {}

    field_mapping = {
        "nom": "last_name",
        "prenom": "first_name",
        "poste": "profession",
        "telephone": "phone",
        "email": "email",
    }

    metadata_fields = {
        "department": "department",
        "salaire": "salaire",
        "date_embauche": "date_embauche",
        "statut": "statut",
        "notes": "notes",
        "photo_url": "photo_url",
    }

    for src, dst in field_mapping.items():
        if src in payload and payload[src] is not None:
            update_data[dst] = payload[src]

    for src, dst in metadata_fields.items():
        if src in payload and payload[src] is not None:
            metadata_update[dst] = payload[src]

    if metadata_update:
        # On ne peut pas faire de merge partiel via EntityUpdate facilement,
        # on va le gérer dans l'endpoint
        pass

    if "statut" in payload and payload["statut"] is not None:
        update_data["status"] = payload["statut"]

    return EntityUpdate(**update_data)


# ============================================
# ENDPOINTS
# ============================================

@router.post("", response_model=EmployeeResponse)
def create_employee(payload: EmployeeCreateRequest, db: Session = Depends(get_db)) -> EmployeeResponse:
    """Crée un nouvel employé (entité de type employee)"""
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
                "message": "Un employé avec ces identifiants existe déjà",
                "duplicates": [_entity_to_employee_response(d).model_dump() for d in duplicates],
            },
        )

    entity = svc.create(_employee_payload_to_entity_create(payload))
    return _entity_to_employee_response(entity)


@router.get("", response_model=list[EmployeeResponse])
def list_employees(db: Session = Depends(get_db)) -> list[EmployeeResponse]:
    """Liste les employés (entités de type employee)"""
    svc = get_entity_service(db)
    # Utiliser le repo directement pour avoir accès aux métadonnées
    entities = svc.repo.get_by_type("employee", include_deleted=False, limit=100, offset=0)
    return [_entity_to_employee_response(entity) for entity in entities]


@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(employee_id: str, db: Session = Depends(get_db)) -> EmployeeResponse:
    """Récupère un employé par ID"""
    svc = get_entity_service(db)
    entity = svc.get(UUID(employee_id))
    if not entity or entity.type != "employee":
        raise HTTPException(status_code=404, detail="Employé introuvable")
    return _entity_to_employee_response(entity)


@router.patch("/{employee_id}", response_model=EmployeeResponse)
def update_employee(employee_id: str, payload: dict[str, Any], db: Session = Depends(get_db)) -> EmployeeResponse:
    """Met à jour un employé"""
    svc = get_entity_service(db)
    entity = svc.get(UUID(employee_id))
    if not entity or entity.type != "employee":
        raise HTTPException(status_code=404, detail="Employé introuvable")

    # Mise à jour des champs principaux
    update_data = _employee_payload_to_entity_update(payload)

    # Gérer les métadonnées
    metadata_update = {}
    metadata_fields = {
        "department": "department",
        "salaire": "salaire",
        "date_embauche": "date_embauche",
        "statut": "statut",
        "notes": "notes",
        "photo_url": "photo_url",
        "poste": "poste",
    }
    for src, dst in metadata_fields.items():
        if src in payload and payload[src] is not None:
            metadata_update[dst] = payload[src]

    if metadata_update:
        entity.entity_metadata = {**(entity.entity_metadata or {}), **metadata_update}

    entity = svc.update(UUID(employee_id), update_data)
    if not entity:
        raise HTTPException(status_code=404, detail="Employé introuvable")

    # Si metadata a été modifiée, la sauvegarder
    if metadata_update:
        db.commit()
        db.refresh(entity)

    return _entity_to_employee_response(entity)


@router.delete("/{employee_id}")
def delete_employee(employee_id: str, db: Session = Depends(get_db)) -> dict[str, str]:
    """Supprime un employé (soft delete)"""
    svc = get_entity_service(db)
    entity = svc.get(UUID(employee_id))
    if not entity or entity.type != "employee":
        raise HTTPException(status_code=404, detail="Employé introuvable")

    svc.delete(UUID(employee_id), soft=True)
    return {"status": "ok", "message": "Employé supprimé"}


@router.get("/search/suggest", response_model=list[EmployeeResponse])
def search_employees_suggest(
    q: str = Query(..., min_length=2, max_length=100),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
) -> list[EmployeeResponse]:
    """Recherche suggérée pour autocomplétion employés"""
    svc = get_entity_service(db)
    entities = svc.search_suggest(q, "employee", limit)
    return [_entity_to_employee_response(e) for e in entities]


# ============================================
# EXPORTS
# ============================================

__all__ = ["router", "EmployeeCreateRequest", "EmployeeResponse"]
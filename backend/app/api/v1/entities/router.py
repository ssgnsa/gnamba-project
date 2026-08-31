from __future__ import annotations

from typing import Any, Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field
from sqlalchemy import select, func, or_, and_, text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.entity import Entity
from app.schemas.entity import (
    EntityCreate,
    EntityUpdate,
    EntityResponse,
    EntitySummary,
    EntitySearchParams,
    PaginatedEntityResponse,
    EntityBulkCreate,
    PartyToEntityMapping,
)

router = APIRouter(prefix="/api/v1/entities", tags=["entities"])


# ============================================
# ENDPOINTS
# ============================================

@router.get("", response_model=PaginatedEntityResponse)
def list_entities(
    search: Optional[str] = Query(None, description="Recherche texte (nom, prénom, entreprise, téléphone, email, CNI)"),
    type: Optional[str] = Query(None, pattern=r"^(client|employee|supplier|partner|lead|visitor|user)$", description="Filtrer par type"),
    subtype: Optional[str] = Query(None, description="Filtrer par sous-type"),
    status: Optional[str] = Query(None, pattern=r"^(active|inactive|archived|pending|onboarding)$", description="Filtrer par statut"),
    has_phone: Optional[bool] = Query(None, description="A un téléphone"),
    has_email: Optional[bool] = Query(None, description="A un email"),
    has_company: Optional[bool] = Query(None, description="Est une entreprise"),
    id_document_type: Optional[str] = Query(None, description="Type document (cni, passport, rc, nif, rcs, autre)"),
    id_document_number: Optional[str] = Query(None, description="Numéro document"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    order_by: str = Query("created_at", pattern=r"^(created_at|updated_at|last_name|first_name|company_name|display_name)$"),
    descending: bool = Query(True),
    db: Session = Depends(get_db),
) -> PaginatedEntityResponse:
    """Liste paginée des entités avec filtres et recherche"""
    params = EntitySearchParams(
        search=search,
        type=type,
        subtype=subtype,
        status=status,
        has_phone=has_phone,
        has_email=has_email,
        has_company=has_company,
        id_document_type=id_document_type,
        id_document_number=id_document_number,
        limit=limit,
        offset=offset,
        order_by=order_by,
        descending=descending,
    )
    entities, total = _search_entities(db, params)

    page = (params.offset // params.limit) + 1 if params.limit > 0 else 1
    total_pages = (total + params.limit - 1) // params.limit if params.limit > 0 else 1

    return PaginatedEntityResponse(
        items=[_entity_to_response(e) for e in entities],
        total=total,
        page=page,
        page_size=params.limit,
        total_pages=total_pages,
    )


@router.get("/types/stats", response_model=dict[str, int])
def get_entity_type_stats(db: Session = Depends(get_db)) -> dict[str, int]:
    """Retourne le comptage d'entités par type et statut"""
    return _get_entity_stats(db)


@router.get("/search/suggest", response_model=list[EntitySummary])
def search_entities_suggest(
    q: str = Query(..., min_length=2, max_length=100, description="Terme de recherche"),
    type: Optional[str] = Query(None, pattern=r"^(client|employee|supplier|partner|lead|visitor|user)$"),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
) -> list[EntitySummary]:
    """Recherche suggérée pour autocomplétion (retour léger)"""
    entities = _search_entities_suggest(db, q, type, limit)
    return [_entity_to_summary(e) for e in entities]


@router.get("/check-duplicate", response_model=dict[str, Any])
def check_duplicate(
    id_document_type: Optional[str] = Query(None, description="Type document"),
    id_document_number: Optional[str] = Query(None, description="Numéro document"),
    email: Optional[str] = Query(None, description="Email"),
    phone: Optional[str] = Query(None, description="Téléphone"),
    exclude_id: Optional[UUID] = Query(None, description="ID à exclure de la vérification"),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Vérifie les doublons potentiels avant création"""
    duplicates = _find_duplicates(db, id_document_type, id_document_number, email, phone, exclude_id)
    return {
        "has_duplicates": len(duplicates) > 0,
        "duplicates": [_entity_to_response(d) for d in duplicates],
    }


@router.get("/resolve/{entity_id}", response_model=EntityResponse)
def resolve_entity(
    entity_id: UUID,
    include_relations: bool = Query(False, description="Inclure les relations selon le type"),
    db: Session = Depends(get_db),
) -> EntityResponse:
    """Résout une entité par son ID avec toutes les infos utiles"""
    entity = _get_entity(db, entity_id)
    if not entity:
        raise HTTPException(status_code=404, detail="Entité introuvable")
    return _entity_to_response(entity)


@router.get("/{entity_id}", response_model=EntityResponse)
def get_entity(entity_id: UUID, db: Session = Depends(get_db)) -> EntityResponse:
    """Récupère une entité par ID"""
    entity = _get_entity(db, entity_id)
    if not entity:
        raise HTTPException(status_code=404, detail="Entité introuvable")
    return _entity_to_response(entity)


@router.post("", response_model=EntityResponse, status_code=status.HTTP_201_CREATED)
def create_entity(payload: EntityCreate, db: Session = Depends(get_db)) -> EntityResponse:
    """Crée une nouvelle entité avec détection de doublons"""
    # Vérifier les doublons
    duplicates = _find_duplicates(
        db,
        payload.id_document_type,
        payload.id_document_number,
        payload.email,
        payload.phone,
        None,
    )
    if duplicates:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=jsonable_encoder({
                "message": "Une entité avec ces identifiants existe déjà",
                "duplicates": [_entity_to_response(d) for d in duplicates],
            }),
        )

    # Calculer display_name si non fourni
    data = payload.model_dump(exclude_unset=True)
    if not data.get("display_name"):
        data["display_name"] = _compute_display_name(data)

    entity = Entity(**data)
    db.add(entity)
    db.commit()
    db.refresh(entity)
    return _entity_to_response(entity)


@router.post("/bulk", response_model=dict[str, Any], status_code=status.HTTP_201_CREATED)
def bulk_create_entities(payload: EntityBulkCreate, db: Session = Depends(get_db)) -> dict[str, Any]:
    """Création d'entités en lot"""
    created = []
    errors = []

    for idx, entity_data in enumerate(payload.entities):
        try:
            duplicates = _find_duplicates(
                db,
                entity_data.id_document_type,
                entity_data.id_document_number,
                entity_data.email,
                entity_data.phone,
                None,
            )
            if duplicates:
                errors.append({
                    "index": idx,
                    "error": "Doublon détecté",
                    "duplicates": [jsonable_encoder(_entity_to_response(d)) for d in duplicates],
                })
                continue

            data = entity_data.model_dump(exclude_unset=True)
            if not data.get("display_name"):
                data["display_name"] = _compute_display_name(data)

            entity = Entity(**data)
            db.add(entity)
            created.append(entity)

        except Exception as e:
            errors.append({"index": idx, "error": str(e)})

    if created:
        db.commit()
        for entity in created:
            db.refresh(entity)

    return {
        "created": len(created),
        "errors": len(errors),
        "entities": [_entity_to_response(e) for e in created],
        "error_details": errors,
    }


@router.patch("/{entity_id}", response_model=EntityResponse)
def update_entity(
    entity_id: UUID,
    payload: EntityUpdate,
    db: Session = Depends(get_db),
) -> EntityResponse:
    """Met à jour une entité"""
    entity = _get_entity(db, entity_id)
    if not entity:
        raise HTTPException(status_code=404, detail="Entité introuvable")

    update_data = payload.model_dump(exclude_unset=True)

    # Recalculer display_name si les champs d'identité changent
    identity_fields = {"first_name", "last_name", "company_name", "display_name"}
    if any(f in update_data for f in identity_fields) and not update_data.get("display_name"):
        current = {
            "first_name": entity.first_name,
            "last_name": entity.last_name,
            "company_name": entity.company_name,
            "display_name": entity.display_name,
        }
        current.update(update_data)
        update_data["display_name"] = _compute_display_name(current)

    for key, value in update_data.items():
        if hasattr(entity, key):
            setattr(entity, key, value)

    db.commit()
    db.refresh(entity)
    return _entity_to_response(entity)


@router.delete("/{entity_id}")
def delete_entity(
    entity_id: UUID,
    soft: bool = Query(True, description="Soft delete (défaut) ou hard delete"),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Supprime une entité (soft delete par défaut)"""
    entity = _get_entity(db, entity_id, include_deleted=True)
    if not entity:
        raise HTTPException(status_code=404, detail="Entité introuvable")

    if soft:
        entity.deleted_at = func.now()
        db.commit()
        return {"status": "ok", "message": "Entité désactivée (soft delete)"}
    else:
        db.delete(entity)
        db.commit()
        return {"status": "ok", "message": "Entité supprimée définitivement"}


@router.post("/{entity_id}/restore", response_model=EntityResponse)
def restore_entity(entity_id: UUID, db: Session = Depends(get_db)) -> EntityResponse:
    """Restaure une entité soft-deleted"""
    entity = _get_entity(db, entity_id, include_deleted=True)
    if not entity or not entity.deleted_at:
        raise HTTPException(status_code=404, detail="Entité introuvable ou non supprimée")

    entity.deleted_at = None
    entity.deleted_by = None
    db.commit()
    db.refresh(entity)
    return _entity_to_response(entity)


# ============================================
# MIGRATION HELPERS (Phase 2)
# ============================================

@router.post("/migrate/party", response_model=EntityResponse)
def migrate_party_to_entity(
    payload: PartyToEntityMapping,
    db: Session = Depends(get_db),
) -> EntityResponse:
    """Migre une partie vers une entité (conserve le même UUID)"""
    from app.models.party import Party

    # Vérifier si l'entité existe déjà
    entity = db.get(Entity, payload.party_id)
    if entity:
        return _entity_to_response(entity)

    # Récupérer la partie source
    party = db.get(Party, payload.party_id)
    if not party:
        raise HTTPException(status_code=404, detail="Partie source introuvable")

    # Créer l'entité
    entity_data = {
        "id": payload.party_id,
        "type": payload.type,
        "subtype": payload.subtype,
        "status": payload.status,
        "display_name": payload.display_name,
        "first_name": payload.first_name,
        "last_name": payload.last_name,
        "company_name": payload.company_name,
        "phone": payload.phone,
        "email": payload.email,
        "address": payload.address,
        "profession": payload.profession,
        "employer": payload.employer,
        "birth_date": payload.birth_date,
        "birth_place": payload.birth_place,
        "nationality": payload.nationality,
        "id_document_type": payload.id_document_type,
        "id_document_number": payload.id_document_number,
        "id_document_date": payload.id_document_date,
        "id_document_place": payload.id_document_place,
        "metadata": payload.metadata,
        "created_at": payload.created_at,
        "updated_at": payload.updated_at,
        "created_by": payload.created_by,
        "updated_by": payload.updated_by,
    }

    entity = Entity(**entity_data)
    db.add(entity)
    db.commit()
    db.refresh(entity)
    return _entity_to_response(entity)


# ============================================
# PRIVATE HELPERS
# ============================================

def _get_entity(db: Session, entity_id: UUID, include_deleted: bool = False) -> Optional[Entity]:
    """Récupère une entité par ID"""
    query = select(Entity).where(Entity.id == entity_id)
    if not include_deleted:
        query = query.where(Entity.deleted_at.is_(None))
    return db.execute(query).scalars().first()


def _search_entities(db: Session, params: EntitySearchParams) -> tuple[List[Entity], int]:
    """Recherche avancée avec filtres multiples"""
    query = select(Entity).where(Entity.deleted_at.is_(None))
    count_query = select(func.count(Entity.id)).where(Entity.deleted_at.is_(None))

    # Recherche textuelle
    if params.search:
        search_term = f"%{params.search.lower()}%"
        search_filter = or_(
            func.lower(Entity.first_name).like(search_term),
            func.lower(Entity.last_name).like(search_term),
            func.lower(Entity.company_name).like(search_term),
            func.lower(Entity.phone).like(search_term),
            func.lower(Entity.email).like(search_term),
            func.lower(Entity.id_document_number).like(search_term),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    # Filtres exacts
    if params.type:
        query = query.where(Entity.type == params.type)
        count_query = count_query.where(Entity.type == params.type)
    if params.subtype:
        query = query.where(Entity.subtype == params.subtype)
        count_query = count_query.where(Entity.subtype == params.subtype)
    if params.status:
        query = query.where(Entity.status == params.status)
        count_query = count_query.where(Entity.status == params.status)

    # Filtres booléens
    if params.has_phone is True:
        query = query.where(Entity.phone.isnot(None), Entity.phone != '')
        count_query = count_query.where(Entity.phone.isnot(None), Entity.phone != '')
    elif params.has_phone is False:
        query = query.where(or_(Entity.phone.is_(None), Entity.phone == ''))
        count_query = count_query.where(or_(Entity.phone.is_(None), Entity.phone == ''))

    if params.has_email is True:
        query = query.where(Entity.email.isnot(None), Entity.email != '')
        count_query = count_query.where(Entity.email.isnot(None), Entity.email != '')
    elif params.has_email is False:
        query = query.where(or_(Entity.email.is_(None), Entity.email == ''))
        count_query = count_query.where(or_(Entity.email.is_(None), Entity.email == ''))

    if params.has_company is True:
        query = query.where(Entity.company_name.isnot(None), Entity.company_name != '')
        count_query = count_query.where(Entity.company_name.isnot(None), Entity.company_name != '')
    elif params.has_company is False:
        query = query.where(or_(Entity.company_name.is_(None), Entity.company_name == ''))
        count_query = count_query.where(or_(Entity.company_name.is_(None), Entity.company_name == ''))

    if params.id_document_type:
        query = query.where(Entity.id_document_type == params.id_document_type)
        count_query = count_query.where(Entity.id_document_type == params.id_document_type)
    if params.id_document_number:
        query = query.where(Entity.id_document_number == params.id_document_number)
        count_query = count_query.where(Entity.id_document_number == params.id_document_number)

    # Tri
    order_col = getattr(Entity, params.order_by, Entity.created_at)
    if params.descending:
        query = query.order_by(desc(order_col))
    else:
        query = query.order_by(asc(order_col))

    total = db.execute(count_query).scalar()
    items = db.execute(query.offset(params.offset).limit(params.limit)).scalars().all()
    return list(items), total


def _search_entities_suggest(
    db: Session,
    search_term: str,
    entity_type: Optional[str],
    limit: int,
) -> List[Entity]:
    """Recherche légère pour suggestions"""
    q = f"%{search_term.lower()}%"
    query = (
        select(Entity)
        .where(Entity.deleted_at.is_(None))
        .where(
            or_(
                func.lower(Entity.first_name).like(q),
                func.lower(Entity.last_name).like(q),
                func.lower(Entity.company_name).like(q),
                func.lower(Entity.phone).like(q),
                func.lower(Entity.email).like(q),
            )
        )
    )
    if entity_type:
        query = query.where(Entity.type == entity_type)
    return db.execute(query.limit(limit)).scalars().all()


def _find_duplicates(
    db: Session,
    id_document_type: Optional[str],
    id_document_number: Optional[str],
    email: Optional[str],
    phone: Optional[str],
    exclude_id: Optional[UUID],
) -> List[Entity]:
    """Trouve les doublons potentiels"""
    conditions = []

    if id_document_type and id_document_number:
        conditions.append(
            and_(
                Entity.id_document_type == id_document_type,
                Entity.id_document_number == id_document_number,
            )
        )

    if email:
        conditions.append(Entity.email == email.lower())

    if phone:
        conditions.append(Entity.phone == phone)

    if not conditions:
        return []

    query = select(Entity).where(
        or_(*conditions),
        Entity.deleted_at.is_(None),
    )

    if exclude_id:
        query = query.where(Entity.id != exclude_id)

    return db.execute(query).scalars().all()


def _get_entity_stats(db: Session) -> dict[str, int]:
    """Retourne les statistiques par type et statut"""
    result = db.execute(text("""
        SELECT type, status, COUNT(*) as count
        FROM entities
        WHERE deleted_at IS NULL
        GROUP BY type, status
    """)).fetchall()

    stats = {}
    for row in result:
        key = f"{row.type}_{row.status}"
        stats[key] = row.count
    return stats


def _entity_to_response(entity: Entity) -> EntityResponse:
    """Convertit une entité en EntityResponse avec propriétés calculées"""
    return EntityResponse(
        id=entity.id,
        type=entity.type,
        subtype=entity.subtype,
        status=entity.status,
        display_name=entity.display_name,
        first_name=entity.first_name,
        last_name=entity.last_name,
        company_name=entity.company_name,
        phone=entity.phone,
        email=entity.email,
        address=entity.address,
        profession=entity.profession,
        employer=entity.employer,
        birth_date=entity.birth_date,
        birth_place=entity.birth_place,
        nationality=entity.nationality,
        id_document_type=entity.id_document_type,
        id_document_number=entity.id_document_number,
        id_document_date=entity.id_document_date,
        id_document_place=entity.id_document_place,
        metadata=entity.entity_metadata or {},
        created_at=entity.created_at,
        updated_at=entity.updated_at,
        created_by=entity.created_by,
        updated_by=entity.updated_by,
        deleted_at=entity.deleted_at,
        deleted_by=entity.deleted_by,
        computed_display_name=entity.computed_display_name,
        primary_contact=entity.primary_contact,
        identity_document=entity.identity_document,
    )


def _entity_to_summary(entity: Entity) -> EntitySummary:
    """Version légère pour listes et autocomplétion"""
    return EntitySummary(
        id=entity.id,
        type=entity.type,
        subtype=entity.subtype,
        status=entity.status,
        display_name=entity.display_name,
        first_name=entity.first_name,
        last_name=entity.last_name,
        company_name=entity.company_name,
        phone=entity.phone,
        email=entity.email,
    )


def _compute_display_name(data: dict) -> str:
    """Calcule le nom d'affichage standard"""
    if data.get("display_name"):
        return data["display_name"]
    if data.get("company_name"):
        return data["company_name"]
    parts = []
    if data.get("first_name"):
        parts.append(data["first_name"])
    if data.get("last_name"):
        parts.append(data["last_name"].upper())
    return " ".join(parts) if parts else "Sans nom"


def desc(col):
    from sqlalchemy import desc as sql_desc
    return sql_desc(col)


def asc(col):
    from sqlalchemy import asc as sql_asc
    return sql_asc(col)
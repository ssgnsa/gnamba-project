# Immobilier Properties API Router
# Endpoints pour la gestion des biens immobiliers (properties table)

from __future__ import annotations

from typing import Any, Optional
from uuid import UUID
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.property import Property
from app.models.entity import Entity
from app.schemas.immobilier import (
    PropertyCreate,
    PropertyUpdate,
    PropertyResponse,
    PropertySearchParams,
    PaginatedPropertyResponse,
    PropertyStatsResponse,
)

router = APIRouter(prefix="/properties", tags=["immobilier-properties"])


def _property_to_response(prop: Property, include_relations: bool = False) -> PropertyResponse:
    """Convertit un Property ORM en PropertyResponse"""
    data = {
        "id": prop.id,
        "type_bien": prop.type_bien,
        "adresse": prop.adresse,
        "proprietaire_name": prop.proprietaire,
        "valeur": float(prop.valeur) if prop.valeur else None,
        "loyer_mensuel": float(prop.loyer_mensuel) if prop.loyer_mensuel else None,
        "charges_mensuelles": float(prop.charges_mensuelles) if getattr(prop, "charges_mensuelles", None) else None,
        "statut": prop.statut,
        "description": prop.description,
        "cover_image_url": prop.cover_image_url,
        "created_at": prop.created_at.isoformat() if prop.created_at else None,
        "updated_at": prop.updated_at.isoformat() if prop.updated_at else None,
        "deleted_at": prop.deleted_at.isoformat() if getattr(prop, "deleted_at", None) else None,
    }
    
    if include_relations:
        # Add related data if available
        pass
    
    return PropertyResponse(**data)


@router.post("", response_model=PropertyResponse, status_code=201)
def create_property(payload: PropertyCreate, db: Session = Depends(get_db)) -> PropertyResponse:
    """Crée un nouveau bien immobilier"""
    # TODO: Add authorization check
    
    prop = Property(
        type_bien=payload.type_bien,
        adresse=payload.adresse,
        proprietaire=payload.proprietaire_name if hasattr(payload, 'proprietaire_name') else None,
        valeur=payload.valeur,
        loyer_mensuel=payload.loyer_mensuel,
        charges_mensuelles=payload.charges_mensuelles or 0,
        statut=payload.statut or "disponible",
        description=payload.description,
        cover_image_url=payload.cover_image_url,
    )
    
    db.add(prop)
    db.commit()
    db.refresh(prop)
    
    return _property_to_response(prop)


@router.get("", response_model=PaginatedPropertyResponse)
def list_properties(
    search: Optional[str] = Query(None, description="Recherche texte (adresse, type)"),
    type_bien: Optional[str] = Query(None, description="Filtrer par type de bien"),
    statut: Optional[str] = Query(None, description="Filtrer par statut"),
    properitaire_name: Optional[str] = Query(None, description="Filtrer par nom du propriétaire"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    order_by: str = Query("created_at", pattern=r"^(created_at|updated_at|adresse|type_bien|statut|loyer_mensuel)$"),
    descending: bool = Query(True),
    include_relations: bool = Query(False, description="Inclure les relations (propriétaire)"),
    db: Session = Depends(get_db),
) -> PaginatedPropertyResponse:
    """Liste les biens immobiliers avec pagination"""
    try:
        query = select(Property).where(Property.deleted_at.is_(None))

        if search:
            search_term = f"%{search}%"
            query = query.where(
                or_(
                    Property.adresse.ilike(search_term),
                    Property.type_bien.ilike(search_term),
                    Property.description.ilike(search_term),
                )
            )

        if type_bien:
            query = query.where(Property.type_bien == type_bien)

        if statut:
            query = query.where(Property.statut == statut)

        if properitaire_name:
            query = query.where(Property.proprietaire.ilike(f"%{properitaire_name}%"))

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = db.execute(count_query).scalar() or 0

        # Ordering
        order_col = getattr(Property, order_by, Property.created_at)
        if descending:
            query = query.order_by(order_col.desc())
        else:
            query = query.order_by(order_col.asc())

        # Pagination
        query = query.offset(offset).limit(limit)

        items = db.execute(query).scalars().all()

        return PaginatedPropertyResponse(
            items=[_property_to_response(p, include_relations) for p in items],
            total=total,
            page=(offset // limit) + 1,
            page_size=limit,
            total_pages=(total + limit - 1) // limit,
        )
    except Exception:
        import logging
        logging.exception("immobilier.properties.list_properties failed")
        return PaginatedPropertyResponse(items=[], total=0, page=1, page_size=limit, total_pages=0)


@router.get("/stats", response_model=PropertyStatsResponse)
def get_properties_stats(db: Session = Depends(get_db)) -> PropertyStatsResponse:
    """Statistiques des biens immobiliers"""
    # Total
    total = db.execute(select(func.count(Property.id)).where(Property.deleted_at.is_(None))).scalar() or 0
    
    # Par statut
    stats_query = (
        select(Property.statut, func.count(Property.id))
        .where(Property.deleted_at.is_(None))
        .group_by(Property.statut)
    )
    stat_results = db.execute(stats_query).all()
    stat_dict = {statut: count for statut, count in stat_results}
    
    # Total monthly rent
    rent_sum = db.execute(
        select(func.sum(Property.loyer_mensuel))
        .where(Property.deleted_at.is_(None))
        .where(Property.statut == "loue")
    ).scalar() or 0
    
    disponible = stat_dict.get("disponible", 0)
    loue = stat_dict.get("loue", 0)
    total_active = total - stat_dict.get("vendu", 0) - stat_dict.get("en_travaux", 0)
    occupancy_rate = (loue / total_active * 100) if total_active > 0 else 0
    
    return PropertyStatsResponse(
        total_properties=total,
        disponible=stat_dict.get("disponible", 0),
        loue=stat_dict.get("loue", 0),
        en_vente=stat_dict.get("en_vente", 0),
        vendu=stat_dict.get("vendu", 0),
        en_travaux=stat_dict.get("en_travaux", 0),
        total_monthly_rent=float(rent_sum),
        occupancy_rate=round(occupancy_rate, 2),
    )


@router.get("/{property_id}", response_model=PropertyResponse)
def get_property(
    property_id: UUID,
    include_relations: bool = Query(True),
    db: Session = Depends(get_db),
) -> PropertyResponse:
    """Récupère un bien immobilier par ID"""
    prop = db.execute(
        select(Property).where(Property.id == property_id).where(Property.deleted_at.is_(None))
    ).scalar_one_or_none()
    
    if not prop:
        raise HTTPException(status_code=404, detail="Bien immobilier introuvable")
    
    return _property_to_response(prop, include_relations)


@router.patch("/{property_id}", response_model=PropertyResponse)
def update_property(
    property_id: UUID,
    payload: PropertyUpdate,
    db: Session = Depends(get_db),
) -> PropertyResponse:
    """Met à jour un bien immobilier"""
    prop = db.execute(
        select(Property).where(Property.id == property_id).where(Property.deleted_at.is_(None))
    ).scalar_one_or_none()
    
    if not prop:
        raise HTTPException(status_code=404, detail="Bien immobilier introuvable")
    
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key == "properitaire_entity_id" and hasattr(payload, "proprietaire_name"):
            # Handle the rename for backward compatibility
            setattr(prop, "proprietaire", value)
        else:
            setattr(prop, key, value)
    
    prop.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(prop)

    return _property_to_response(prop)


@router.delete("/{property_id}")
def delete_property(
    property_id: UUID,
    soft: bool = Query(True, description="Soft delete (archiver) ou hard delete"),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Supprime un bien immobilier"""
    prop = db.execute(
        select(Property).where(Property.id == property_id)
    ).scalar_one_or_none()
    
    if not prop:
        raise HTTPException(status_code=404, detail="Bien immobilier introuvable")
    
    if soft:
        prop.deleted_at = datetime.utcnow()
        prop.deleted_by = None
        db.commit()
        return {"status": "ok", "message": "Bien immobilier archivé"}
    else:
        db.delete(prop)
        db.commit()
        return {"status": "ok", "message": "Bien immobilier supprimé définitivement"}


@router.post("/{property_id}/restore", response_model=PropertyResponse)
def restore_property(
    property_id: UUID,
    db: Session = Depends(get_db),
) -> PropertyResponse:
    """Restaure un bien immobilier archivé"""
    prop = db.execute(
        select(Property).where(Property.id == property_id).where(Property.deleted_at.is_not(None))
    ).scalar_one_or_none()
    
    if not prop:
        raise HTTPException(status_code=404, detail="Bien immobilier introuvable ou non archivé")
    
    prop.deleted_at = None
    prop.deleted_by = None
    prop.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(prop)
    
    return _property_to_response(prop)


# Health check for this module
@router.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "module": "immobilier-properties"}
# Immobilier Lease Contracts API Router
# Endpoints pour la gestion des baux (lease_contracts table)

from __future__ import annotations

from typing import Any, Optional
from uuid import UUID
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models.property import LeaseContract, Property
from app.models.entity import Entity
from app.schemas.immobilier import (
    LeaseContractCreate,
    LeaseContractUpdate,
    LeaseContractResponse,
    LeaseContractSearchParams,
    PaginatedLeaseContractResponse,
    LeaseContractStatsResponse,
)

router = APIRouter(prefix="/contracts", tags=["immobilier-contracts"])


def _contract_to_response(contract: LeaseContract, include_relations: bool = False) -> LeaseContractResponse:
    """Convertit un LeaseContract ORM en LeaseContractResponse"""
    data = {
        "id": contract.id,
        "property_id": contract.property_id,
        "locataire_entity_id": contract.locataire_entity_id,
        "date_debut": contract.date_debut.isoformat() if contract.date_debut else None,
        "date_fin": contract.date_fin.isoformat() if contract.date_fin else None,
        "loyer_mensuel": float(contract.loyer_mensuel) if contract.loyer_mensuel else None,
        "charges_mensuelles": float(contract.charges_mensuelles) if contract.charges_mensuelles else None,
        "depot_garantie": float(contract.depot_garantie) if contract.depot_garantie else None,
        "statut": contract.statut,
        "reference": contract.reference,
        "notes": contract.notes,
        "commission_rate": float(contract.commission_rate) if contract.commission_rate else 12.0,
        "jour_echeance": contract.jour_echeance or 10,
        "created_at": contract.created_at.isoformat() if contract.created_at else None,
        "updated_at": contract.updated_at.isoformat() if contract.updated_at else None,
        "deleted_at": contract.deleted_at.isoformat() if contract.deleted_at else None,
    }
    
    if include_relations:
        # Add related data if available
        pass
    
    return LeaseContractResponse(**data)


@router.post("", response_model=LeaseContractResponse, status_code=201)
def create_contract(payload: LeaseContractCreate, db: Session = Depends(get_db)) -> LeaseContractResponse:
    """Crée un nouveau bail"""
    # Verify property exists
    prop = db.execute(
        select(Property).where(Property.id == payload.property_id).where(Property.deleted_at.is_(None))
    ).scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Propriété introuvable")
    
    # Verify locataire entity exists
    locataire = db.execute(
        select(Entity).where(Entity.id == payload.locataire_entity_id).where(Entity.deleted_at.is_(None))
    ).scalar_one_or_none()
    if not locataire:
        raise HTTPException(status_code=404, detail="Locataire introuvable")
    
    # Generate reference if not provided
    reference = payload.reference
    if not reference:
        from app.utils.reference import generate_reference
        reference = generate_reference("BAIL")
    
    contract = LeaseContract(
        property_id=payload.property_id,
        locataire_entity_id=payload.locataire_entity_id,
        date_debut=payload.date_debut,
        date_fin=payload.date_fin,
        loyer_mensuel=payload.loyer_mensuel,
        charges_mensuelles=payload.charges_mensuelles or 0,
        depot_garantie=payload.depot_garantie or 0,
        statut=payload.statut or "actif",
        reference=reference,
        notes=payload.notes,
        commission_rate=payload.commission_rate,
        jour_echeance=payload.jour_echeance,
    )
    
    db.add(contract)
    
    # Update property status to "loue"
    prop.statut = "loue"
    prop.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(contract)
    
    return _contract_to_response(contract)


@router.get("", response_model=PaginatedLeaseContractResponse)
def list_contracts(
    search: Optional[str] = Query(None, description="Recherche texte (référence, notes)"),
    property_id: Optional[UUID] = Query(None, description="Filtrer par propriété"),
    locataire_entity_id: Optional[UUID] = Query(None, description="Filtrer par locataire"),
    statut: Optional[str] = Query(None, description="Filtrer par statut"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    order_by: str = Query("created_at", pattern=r"^(created_at|updated_at|date_debut|statut|reference|loyer_mensuel)$"),
    descending: bool = Query(True),
    include_relations: bool = Query(False),
    db: Session = Depends(get_db),
) -> PaginatedLeaseContractResponse:
    """Liste les baux avec pagination"""
    try:
        query = select(LeaseContract).where(LeaseContract.deleted_at.is_(None))

        if search:
            search_term = f"%{search}%"
            query = query.where(
                or_(
                    LeaseContract.reference.ilike(search_term),
                    LeaseContract.notes.ilike(search_term),
                )
            )

        if property_id:
            query = query.where(LeaseContract.property_id == property_id)

        if locataire_entity_id:
            query = query.where(LeaseContract.locataire_entity_id == locataire_entity_id)

        if statut:
            query = query.where(LeaseContract.statut == statut)

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = db.execute(count_query).scalar() or 0

        # Ordering
        order_col = getattr(LeaseContract, order_by, LeaseContract.created_at)
        if descending:
            query = query.order_by(order_col.desc())
        else:
            query = query.order_by(order_col.asc())

        # Pagination
        query = query.offset(offset).limit(limit)

        items = db.execute(query).scalars().all()

        return PaginatedLeaseContractResponse(
            items=[_contract_to_response(c, include_relations) for c in items],
            total=total,
            page=(offset // limit) + 1,
            page_size=limit,
            total_pages=(total + limit - 1) // limit,
        )
    except Exception:
        import logging
        logging.exception("immobilier.contracts.list_contracts failed")
        return PaginatedLeaseContractResponse(items=[], total=0, page=1, page_size=limit, total_pages=0)


@router.get("/stats", response_model=LeaseContractStatsResponse)
def get_contracts_stats(db: Session = Depends(get_db)) -> LeaseContractStatsResponse:
    """Statistiques des baux"""
    # Total
    total = db.execute(select(func.count(LeaseContract.id)).where(LeaseContract.deleted_at.is_(None))).scalar() or 0
    
    # Par statut
    stats_query = (
        select(LeaseContract.statut, func.count(LeaseContract.id))
        .where(LeaseContract.deleted_at.is_(None))
        .group_by(LeaseContract.statut)
    )
    stat_results = db.execute(stats_query).all()
    stat_dict = {statut: count for statut, count in stat_results}
    
    # Total monthly revenue
    revenue_sum = db.execute(
        select(func.sum(LeaseContract.loyer_mensuel + LeaseContract.charges_mensuelles))
        .where(LeaseContract.deleted_at.is_(None))
        .where(LeaseContract.statut == "actif")
    ).scalar() or 0
    
    # Total deposits held
    deposits_sum = db.execute(
        select(func.sum(LeaseContract.depot_garantie))
        .where(LeaseContract.deleted_at.is_(None))
        .where(LeaseContract.statut == "actif")
    ).scalar() or 0
    
    return LeaseContractStatsResponse(
        total_contracts=total,
        actif=stat_dict.get("actif", 0),
        termine=stat_dict.get("termine", 0),
        resilie=stat_dict.get("resilie", 0),
        renouvele=stat_dict.get("renouvele", 0),
        en_attente=stat_dict.get("en_attente", 0),
        total_monthly_revenue=float(revenue_sum),
        total_deposits_held=float(deposits_sum),
    )


@router.get("/{contract_id}", response_model=LeaseContractResponse)
def get_contract(
    contract_id: UUID,
    include_relations: bool = Query(True),
    db: Session = Depends(get_db),
) -> LeaseContractResponse:
    """Récupère un bail par ID"""
    contract = db.execute(
        select(LeaseContract)
        .where(LeaseContract.id == contract_id)
        .where(LeaseContract.deleted_at.is_(None))
    ).scalar_one_or_none()
    
    if not contract:
        raise HTTPException(status_code=404, detail="Bail introuvable")
    
    return _contract_to_response(contract, include_relations)


@router.patch("/{contract_id}", response_model=LeaseContractResponse)
def update_contract(
    contract_id: UUID,
    payload: LeaseContractUpdate,
    db: Session = Depends(get_db),
) -> LeaseContractResponse:
    """Met à jour un bail"""
    contract = db.execute(
        select(LeaseContract)
        .where(LeaseContract.id == contract_id)
        .where(LeaseContract.deleted_at.is_(None))
    ).scalar_one_or_none()
    
    if not contract:
        raise HTTPException(status_code=404, detail="Bail introuvable")
    
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(contract, key, value)
    
    contract.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(contract)
    
    return _contract_to_response(contract)


@router.delete("/{contract_id}")
def delete_contract(
    contract_id: UUID,
    soft: bool = Query(True, description="Soft delete (archiver) ou hard delete"),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Supprime un bail"""
    contract = db.execute(
        select(LeaseContract).where(LeaseContract.id == contract_id)
    ).scalar_one_or_none()
    
    if not contract:
        raise HTTPException(status_code=404, detail="Bail introuvable")
    
    if soft:
        contract.deleted_at = datetime.utcnow()
        contract.deleted_by = None  # TODO: get from auth
        db.commit()
        return {"status": "ok", "message": "Bail archivé"}
    else:
        db.delete(contract)
        db.commit()
        return {"status": "ok", "message": "Bail supprimé définitivement"}


@router.post("/{contract_id}/restore", response_model=LeaseContractResponse)
def restore_contract(
    contract_id: UUID,
    db: Session = Depends(get_db),
) -> LeaseContractResponse:
    """Restaure un bail archivé"""
    contract = db.execute(
        select(LeaseContract)
        .where(LeaseContract.id == contract_id)
        .where(LeaseContract.deleted_at.is_not(None))
    ).scalar_one_or_none()
    
    if not contract:
        raise HTTPException(status_code=404, detail="Bail introuvable ou non archivé")
    
    contract.deleted_at = None
    contract.deleted_by = None
    contract.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(contract)
    
    return _contract_to_response(contract)


@router.post("/{contract_id}/terminate", response_model=LeaseContractResponse)
def terminate_contract(
    contract_id: UUID,
    db: Session = Depends(get_db),
) -> LeaseContractResponse:
    """Termine un bail (passe à 'termine')"""
    contract = db.execute(
        select(LeaseContract)
        .where(LeaseContract.id == contract_id)
        .where(LeaseContract.deleted_at.is_(None))
    ).scalar_one_or_none()
    
    if not contract:
        raise HTTPException(status_code=404, detail="Bail introuvable")
    
    contract.statut = "termine"
    contract.date_fin = date.today()
    contract.updated_at = datetime.utcnow()

    # Update property status
    prop = db.execute(
        select(Property).where(Property.id == contract.property_id)
    ).scalar_one_or_none()
    if prop and prop.statut == "loue":
        prop.statut = "disponible"
        prop.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(contract)
    
    return _contract_to_response(contract)


# Health check
@router.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "module": "immobilier-contracts"}
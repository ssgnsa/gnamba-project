# Immobilier Rent Payments API Router
# Endpoints pour la gestion des paiements de loyer (rent_payments table)

from __future__ import annotations

from typing import Any, Optional
from uuid import UUID
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.property import RentPayment, Property, LeaseContract
from app.models.entity import Entity
from app.schemas.immobilier import (
    RentPaymentCreate,
    RentPaymentUpdate,
    RentPaymentResponse,
    RentPaymentSearchParams,
    PaginatedRentPaymentResponse,
    RentPaymentStatsResponse,
)

router = APIRouter(prefix="/payments", tags=["immobilier-payments"])


def _payment_to_response(payment: RentPayment, include_relations: bool = False) -> RentPaymentResponse:
    """Convertit un RentPayment ORM en RentPaymentResponse"""
    data = {
        "id": payment.id,
        "locataire_entity_id": payment.locataire_entity_id,
        "property_id": payment.property_id,
        "contract_id": payment.contract_id,
        "montant": float(payment.montant) if payment.montant else None,
        "date_paiement": payment.date_paiement.isoformat() if payment.date_paiement else None,
        "date_echeance": payment.date_echeance.isoformat() if payment.date_echeance else None,
        "mois_concerne": payment.mois_concerne,
        "mode_paiement": payment.mode_paiement,
        "statut": payment.statut,
        "notes": payment.notes,
        "reference": payment.reference,
        "last_document_type": payment.last_document_type,
        "last_document_at": payment.last_document_at.isoformat() if payment.last_document_at else None,
        "last_document_by": payment.last_document_by,
        "created_at": payment.created_at.isoformat() if payment.created_at else None,
        "updated_at": payment.updated_at.isoformat() if payment.updated_at else None,
        "deleted_at": payment.deleted_at.isoformat() if payment.deleted_at else None,
    }
    
    if include_relations:
        # Add related data if available
        pass
    
    return RentPaymentResponse(**data)


@router.post("", response_model=RentPaymentResponse, status_code=201)
def create_payment(payload: RentPaymentCreate, db: Session = Depends(get_db)) -> RentPaymentResponse:
    """Crée un nouveau paiement de loyer"""
    # Verify property exists
    prop = db.execute(
        select(Property).where(Property.id == payload.property_id).where(Property.deleted_at.is_(None))
    ).scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Propriété introuvable")
    
    # Verify contract exists
    contract = db.execute(
        select(LeaseContract).where(LeaseContract.id == payload.contract_id).where(LeaseContract.deleted_at.is_(None))
    ).scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail="Bail introuvable")
    
    # Verify locataire entity exists
    locataire = db.execute(
        select(Entity).where(Entity.id == payload.locataire_entity_id).where(Entity.deleted_at.is_(None))
    ).scalar_one_or_none()
    if not locataire:
        raise HTTPException(status_code=404, detail="Locataire introuvable")
    
    # Verify contract belongs to property
    if contract.property_id != payload.property_id:
        raise HTTPException(status_code=400, detail="Le bail n'appartient pas à cette propriété")
    
    # Verify contract locataire matches
    if contract.locataire_entity_id != payload.locataire_entity_id:
        raise HTTPException(status_code=400, detail="Le locataire ne correspond pas au bail")
    
    # Generate reference if not provided
    reference = payload.reference
    if not reference:
        from app.utils.reference import generate_reference
        reference = generate_reference("QUIT")
    
    payment = RentPayment(
        locataire_entity_id=payload.locataire_entity_id,
        property_id=payload.property_id,
        contract_id=payload.contract_id,
        montant=payload.montant,
        date_paiement=payload.date_paiement,
        date_echeance=payload.date_echeance,
        mois_concerne=payload.mois_concerne,
        mode_paiement=payload.mode_paiement or "especes",
        statut=payload.statut or "paye",
        notes=payload.notes,
        reference=reference,
    )
    
    db.add(payment)
    db.commit()
    db.refresh(payment)
    
    return _payment_to_response(payment)


@router.get("", response_model=PaginatedRentPaymentResponse)
def list_payments(
    search: Optional[str] = Query(None, description="Recherche texte (référence, notes, mois)"),
    property_id: Optional[UUID] = Query(None, description="Filtrer par propriété"),
    contract_id: Optional[UUID] = Query(None, description="Filtrer par bail"),
    locataire_entity_id: Optional[UUID] = Query(None, description="Filtrer par locataire"),
    statut: Optional[str] = Query(None, description="Filtrer par statut"),
    mois_concerne: Optional[str] = Query(None, description="Filtrer par mois concerné (YYYY-MM)"),
    date_from: Optional[date] = Query(None, description="Date de début"),
    date_to: Optional[date] = Query(None, description="Date de fin"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    order_by: str = Query("date_paiement", pattern=r"^(date_paiement|created_at|montant|statut|mois_concerne)$"),
    descending: bool = Query(True),
    include_relations: bool = Query(False),
    db: Session = Depends(get_db),
) -> PaginatedRentPaymentResponse:
    """Liste les paiements de loyer avec pagination"""
    try:
        query = select(RentPayment).where(RentPayment.deleted_at.is_(None))

        if search:
            search_term = f"%{search}%"
            query = query.where(
                or_(
                    RentPayment.reference.ilike(search_term),
                    RentPayment.notes.ilike(search_term),
                    RentPayment.mois_concerne.ilike(search_term),
                )
            )

        if property_id:
            query = query.where(RentPayment.property_id == property_id)

        if contract_id:
            query = query.where(RentPayment.contract_id == contract_id)

        if locataire_entity_id:
            query = query.where(RentPayment.locataire_entity_id == locataire_entity_id)

        if statut:
            query = query.where(RentPayment.statut == statut)

        if mois_concerne:
            query = query.where(RentPayment.mois_concerne == mois_concerne)

        if date_from:
            query = query.where(RentPayment.date_paiement >= date_from)

        if date_to:
            query = query.where(RentPayment.date_paiement <= date_to)

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = db.execute(count_query).scalar() or 0

        # Ordering
        order_col = getattr(RentPayment, order_by, RentPayment.date_paiement)
        if descending:
            query = query.order_by(order_col.desc())
        else:
            query = query.order_by(order_col.asc())

        # Pagination
        query = query.offset(offset).limit(limit)

        items = db.execute(query).scalars().all()

        return PaginatedRentPaymentResponse(
            items=[_payment_to_response(p, include_relations) for p in items],
            total=total,
            page=(offset // limit) + 1,
            page_size=limit,
            total_pages=(total + limit - 1) // limit,
        )
    except Exception:
        import logging
        logging.exception("immobilier.payments.list_payments failed")
        return PaginatedRentPaymentResponse(items=[], total=0, page=1, page_size=limit, total_pages=0)


@router.get("/stats", response_model=RentPaymentStatsResponse)
def get_payments_stats(
    property_id: Optional[UUID] = Query(None),
    contract_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
) -> RentPaymentStatsResponse:
    """Statistiques des paiements de loyer"""
    base_query = select(RentPayment).where(RentPayment.deleted_at.is_(None))
    
    if property_id:
        base_query = base_query.where(RentPayment.property_id == property_id)
    if contract_id:
        base_query = base_query.where(RentPayment.contract_id == contract_id)
    
    # Total
    total = db.execute(select(func.count()).select_from(base_query.subquery())).scalar() or 0
    
    # Par statut
    stats_query = (
        select(RentPayment.statut, func.count(RentPayment.id))
        .select_from(base_query.subquery())
        .group_by(RentPayment.statut)
    )
    stat_results = db.execute(stats_query).all()
    stat_dict = {statut: count for statut, count in stat_results}
    
    # Montants
    amount_query = (
        select(RentPayment.statut, func.sum(RentPayment.montant))
        .select_from(base_query.subquery())
        .group_by(RentPayment.statut)
    )
    amount_results = db.execute(amount_query).all()
    amount_dict = {statut: float(amount) if amount else 0 for statut, amount in amount_results}
    
    total_collected = amount_dict.get("paye", 0)
    total_pending = amount_dict.get("en_attente", 0)
    total_late = amount_dict.get("retard", 0)
    
    return RentPaymentStatsResponse(
        total_payments=total,
        paye=stat_dict.get("paye", 0),
        en_attente=stat_dict.get("en_attente", 0),
        retard=stat_dict.get("retard", 0),
        partiel=stat_dict.get("partiel", 0),
        total_amount_collected=total_collected,
        total_amount_pending=total_pending,
        total_amount_late=total_late,
    )


@router.get("/{payment_id}", response_model=RentPaymentResponse)
def get_payment(
    payment_id: UUID,
    include_relations: bool = Query(True),
    db: Session = Depends(get_db),
) -> RentPaymentResponse:
    """Récupère un paiement par ID"""
    payment = db.execute(
        select(RentPayment)
        .where(RentPayment.id == payment_id)
        .where(RentPayment.deleted_at.is_(None))
    ).scalar_one_or_none()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Paiement introuvable")
    
    return _payment_to_response(payment, include_relations)


@router.patch("/{payment_id}", response_model=RentPaymentResponse)
def update_payment(
    payment_id: UUID,
    payload: RentPaymentUpdate,
    db: Session = Depends(get_db),
) -> RentPaymentResponse:
    """Met à jour un paiement"""
    payment = db.execute(
        select(RentPayment)
        .where(RentPayment.id == payment_id)
        .where(RentPayment.deleted_at.is_(None))
    ).scalar_one_or_none()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Paiement introuvable")
    
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(payment, key, value)
    
    payment.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(payment)
    
    return _payment_to_response(payment)


@router.delete("/{payment_id}")
def delete_payment(
    payment_id: UUID,
    soft: bool = Query(True, description="Soft delete (archiver) ou hard delete"),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Supprime un paiement"""
    payment = db.execute(
        select(RentPayment).where(RentPayment.id == payment_id)
    ).scalar_one_or_none()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Paiement introuvable")
    
    if soft:
        payment.deleted_at = datetime.utcnow()
        payment.deleted_by = None
        db.commit()
        return {"status": "ok", "message": "Paiement archivé"}
    else:
        db.delete(payment)
        db.commit()
        return {"status": "ok", "message": "Paiement supprimé définitivement"}


@router.post("/{payment_id}/restore", response_model=RentPaymentResponse)
def restore_payment(
    payment_id: UUID,
    db: Session = Depends(get_db),
) -> RentPaymentResponse:
    """Restaure un paiement archivé"""
    payment = db.execute(
        select(RentPayment)
        .where(RentPayment.id == payment_id)
        .where(RentPayment.deleted_at.is_not(None))
    ).scalar_one_or_none()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Paiement introuvable ou non archivé")
    
    payment.deleted_at = None
    payment.deleted_by = None
    payment.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(payment)
    
    return _payment_to_response(payment)


# Health check
@router.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "module": "immobilier-payments"}
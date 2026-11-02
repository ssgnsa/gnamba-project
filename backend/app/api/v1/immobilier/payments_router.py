# Immobilier Rent Payments API Router
# Endpoints pour la gestion des paiements de loyer (rent_payments table)

from __future__ import annotations

from typing import Any, Optional
from uuid import UUID
from datetime import date, datetime

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import require_admin_user
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

router = APIRouter(
    prefix="/payments",
    tags=["immobilier-payments"],
    dependencies=[Depends(require_admin_user)],
)


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
    filters = [RentPayment.deleted_at.is_(None)]
    if property_id:
        filters.append(RentPayment.property_id == property_id)
    if contract_id:
        filters.append(RentPayment.contract_id == contract_id)

    stats = db.execute(
        select(
            func.count(RentPayment.id).label("total"),
            func.count(RentPayment.id).filter(RentPayment.statut == "paye").label("paye"),
            func.count(RentPayment.id).filter(RentPayment.statut == "en_attente").label("en_attente"),
            func.count(RentPayment.id).filter(RentPayment.statut == "retard").label("retard"),
            func.count(RentPayment.id).filter(RentPayment.statut == "partiel").label("partiel"),
            func.coalesce(func.sum(RentPayment.montant).filter(RentPayment.statut == "paye"), 0).label("total_collected"),
            func.coalesce(func.sum(RentPayment.montant).filter(RentPayment.statut == "en_attente"), 0).label("total_pending"),
            func.coalesce(func.sum(RentPayment.montant).filter(RentPayment.statut == "retard"), 0).label("total_late"),
        ).where(*filters)
    ).one()
    
    return RentPaymentStatsResponse(
        total_payments=stats.total or 0,
        paye=stats.paye or 0,
        en_attente=stats.en_attente or 0,
        retard=stats.retard or 0,
        partiel=stats.partiel or 0,
        total_amount_collected=float(stats.total_collected or 0),
        total_amount_pending=float(stats.total_pending or 0),
        total_amount_late=float(stats.total_late or 0),
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
) -> dict[str, str]:
    """Payments must be corrected with a reversal or credit note."""
    raise HTTPException(status_code=403, detail="Corrigez le paiement par écriture inverse ou avoir")


@router.post("/{payment_id}/deliver-document", response_model=RentPaymentResponse)
def deliver_document(
    payment_id: UUID,
    document_type: str = Body(...),  # "quittance" | "recu"
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_admin_user),
) -> RentPaymentResponse:
    """Marque qu'un document (quittance/reçu) a été délivré pour ce paiement"""
    payment = db.execute(
        select(RentPayment)
        .where(RentPayment.id == payment_id)
        .where(RentPayment.deleted_at.is_(None))
    ).scalar_one_or_none()

    if not payment:
        raise HTTPException(status_code=404, detail="Paiement introuvable")

    if document_type not in ("quittance", "recu"):
        raise HTTPException(status_code=400, detail="Type de document invalide. Doit être 'quittance' ou 'recu'.")

    now = datetime.utcnow()
    payment.last_document_type = document_type
    payment.last_document_at = now
    payment.last_document_by = current_user.get("id")  # dict, not object attr
    payment.updated_at = now
    db.commit()
    db.refresh(payment)

    return _payment_to_response(payment)


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

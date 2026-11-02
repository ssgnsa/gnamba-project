# Immobilier Lease Contracts API Router
# Endpoints pour la gestion des baux (lease_contracts table)

from __future__ import annotations

from typing import Any, Optional
from uuid import UUID
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.api.deps import require_admin_user
from app.models.property import LeaseContract, Property, RentPayment
from app.models.entity import Entity
from app.services.immobilier_audit import (
    record_property_transition_refusal,
    set_immobilier_audit_context,
)
from app.schemas.immobilier import (
    LeaseContractCreate,
    LeaseContractUpdate,
    LeaseContractResponse,
    LeaseContractSearchParams,
    PaginatedLeaseContractResponse,
    LeaseContractStatsResponse,
    RentPaymentCreate,
    RentPaymentResponse,
)

router = APIRouter(
    prefix="/contracts",
    tags=["immobilier-contracts"],
    dependencies=[Depends(require_admin_user)],
)


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
def create_contract(
    payload: LeaseContractCreate,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(require_admin_user),
) -> LeaseContractResponse:
    """Crée un nouveau bail"""
    # Verify property exists
    prop = db.execute(
        select(Property).where(Property.id == payload.property_id)
        .where(Property.deleted_at.is_(None)).with_for_update()
    ).scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Propriété introuvable")

    contract_status = payload.statut or "actif"
    if contract_status == "actif" and prop.statut != "disponible":
        record_property_transition_refusal(
            db, current_user, str(prop.id), "louee",
            f"Création de bail refusée: état du bien {prop.statut}",
        )
        raise HTTPException(status_code=409, detail="Un bail actif exige un bien disponible")
    
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
        statut=contract_status,
        reference=reference,
        notes=payload.notes,
        commission_rate=payload.commission_rate,
        jour_echeance=payload.jour_echeance,
    )
    
    db.add(contract)
    
    # A live lease transitions the operational property state in this same transaction.
    if contract_status == "actif":
        set_immobilier_audit_context(db, current_user)
        prop.statut = "louee"
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
    stats = db.execute(
        select(
            func.count(LeaseContract.id).label("total"),
            func.count(LeaseContract.id).filter(LeaseContract.statut == "actif").label("actif"),
            func.count(LeaseContract.id).filter(LeaseContract.statut == "termine").label("termine"),
            func.count(LeaseContract.id).filter(LeaseContract.statut == "resilie").label("resilie"),
            func.count(LeaseContract.id).filter(LeaseContract.statut == "renouvele").label("renouvele"),
            func.count(LeaseContract.id).filter(LeaseContract.statut == "en_attente").label("en_attente"),
            func.coalesce(
                func.sum(LeaseContract.loyer_mensuel + LeaseContract.charges_mensuelles).filter(
                    LeaseContract.statut == "actif"
                ),
                0,
            ).label("revenue_sum"),
            func.coalesce(
                func.sum(LeaseContract.depot_garantie).filter(LeaseContract.statut == "actif"),
                0,
            ).label("deposits_sum"),
        ).where(LeaseContract.deleted_at.is_(None))
    ).one()
    
    return LeaseContractStatsResponse(
        total_contracts=stats.total or 0,
        actif=stats.actif or 0,
        termine=stats.termine or 0,
        resilie=stats.resilie or 0,
        renouvele=stats.renouvele or 0,
        en_attente=stats.en_attente or 0,
        total_monthly_revenue=float(stats.revenue_sum or 0),
        total_deposits_held=float(stats.deposits_sum or 0),
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
    current_user: dict[str, Any] = Depends(require_admin_user),
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
    previous_statut = contract.statut
    for key, value in update_data.items():
        setattr(contract, key, value)

    contract.updated_at = datetime.utcnow()

    # Transition property status when contract statut changes.
    if "statut" in update_data and previous_statut != contract.statut:
        prop = db.execute(
            select(Property).where(Property.id == contract.property_id).with_for_update()
        ).scalar_one_or_none()
        if prop:
            if contract.statut == "actif":
                if prop.statut == "disponible":
                    set_immobilier_audit_context(db, current_user)
                    prop.statut = "louee"
                elif prop.statut != "louee":
                    record_property_transition_refusal(
                        db, current_user, str(prop.id), "louee",
                        f"Contrat mis à jour en actif mais bien en {prop.statut}",
                    )
                    raise HTTPException(
                        status_code=409,
                        detail="Un bail actif exige un bien disponible",
                    )
            elif contract.statut in {"termine", "resilie", "en_attente"}:
                if prop.statut in {"loue", "louee"}:
                    set_immobilier_audit_context(db, current_user)
                    prop.statut = "disponible"
            elif contract.statut == "renouvele":
                if prop.statut == "disponible":
                    set_immobilier_audit_context(db, current_user)
                    prop.statut = "louee"

    db.commit()
    db.refresh(contract)

    return _contract_to_response(contract)


@router.delete("/{contract_id}")
def delete_contract(
    contract_id: UUID,
) -> dict[str, str]:
    """Contract deletion is prohibited by the approved business decision."""
    raise HTTPException(status_code=403, detail="La suppression de contrats est interdite")


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
    current_user: dict[str, Any] = Depends(require_admin_user),
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
        select(Property).where(Property.id == contract.property_id).with_for_update()
    ).scalar_one_or_none()
    if prop and prop.statut == "loue":
        set_immobilier_audit_context(db, current_user)
        prop.statut = "disponible"
        prop.updated_at = datetime.utcnow()
    elif prop and prop.statut == "louee":
        set_immobilier_audit_context(db, current_user)
        prop.statut = "disponible"
        prop.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(contract)
    
    return _contract_to_response(contract)


@router.post("/{contract_id}/generate-payments", response_model=dict)
def generate_contract_payments(
    contract_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(require_admin_user),
) -> dict:
    """Génère les paiements mensuels de loyer pour un contrat actif."""
    contract = db.execute(
        select(LeaseContract)
        .where(LeaseContract.id == contract_id)
        .where(LeaseContract.deleted_at.is_(None))
    ).scalar_one_or_none()

    if not contract:
        raise HTTPException(status_code=404, detail="Bail introuvable")

    if contract.statut != "actif":
        raise HTTPException(
            status_code=409,
            detail="Impossible de générer des paiements pour un contrat inactif",
        )

    # Verify existing payments to avoid duplicates
    existing = db.execute(
        select(RentPayment.mois_concerne).where(
            RentPayment.contract_id == contract_id
        )
    ).scalars().all()
    existing_months = set(str(m) for m in existing if m)

    # Generate month range from date_debut to date_fin (or now if open-ended)
    start = contract.date_debut
    if not start:
        raise HTTPException(status_code=400, detail="Date de début du contrat manquante")

    end = contract.date_fin or date_cls.today()
    # Normalize to first of month
    start_month = date(start.year, start.month, 1)
    end_month = date(end.year, end.month, 1)

    created = 0
    skipped = 0
    current = start_month
    while current <= end_month:
        mois_label = current.strftime("%Y-%m")
        if mois_label in existing_months:
            skipped += 1
        else:
            if current.month == 12:
                next_month = date(current.year + 1, 1, 1)
            else:
                next_month = date(current.year, current.month + 1, 1)
            last_day = next_month - timedelta(days=1)
            payment = RentPayment(
                locataire_entity_id=contract.locataire_entity_id,
                property_id=contract.property_id,
                contract_id=contract.id,
                montant=contract.loyer_mensuel + (contract.charges_mensuelles or 0),
                date_paiement=None,
                date_echeance=last_day,
                mois_concerne=mois_label,
                mode_paiement="especes",
                statut="en_attente",
                notes=None,
                reference=None,
            )
            db.add(payment)
            created += 1
        # Advance to next month
        if current.month == 12:
            current = date(current.year + 1, 1, 1)
        else:
            current = date(current.year, current.month + 1, 1)

    if created > 0:
        db.commit()

    return {
        "created": created,
        "skipped": skipped,
        "message": f"{created} paiement(s) généré(s), {skipped} déjà existant(s).",
    }


# Health check
@router.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "module": "immobilier-contracts"}

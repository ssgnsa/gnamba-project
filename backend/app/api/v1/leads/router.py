from __future__ import annotations

from typing import Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.entity import Entity
from app.schemas.entity import EntityCreate, EntityUpdate, EntitySearchParams
from app.services.entity_service import get_entity_service
from app.services.lead.scoring import calculate_lead_score_with_breakdown, get_hours_since_last_interaction

router = APIRouter(prefix="/api/v1/leads", tags=["leads"])

# Import automation router
from .automation_routes import router as automation_router
router.include_router(automation_router)

# Import campaign routes
from .campaign_routes import router as campaign_router
router.include_router(campaign_router)

# ============================================
# SCHEMAS (compatibilité)
# ============================================

class LeadCaptureRequest(BaseModel):
    phone: str
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    source: str = "web_form"
    source_page: str | None = None
    source_form: str | None = None
    consent_text: str | None = None
    channels_optin: dict[str, bool] | list[str] | None = None


class LeadResponse(BaseModel):
    id: str
    last_name: str | None = None
    first_name: str | None = None
    phone: str | None = None
    email: str | None = None
    source: str | None = None
    campagne_id: str | None = None
    statut: str | None = None
    assigned_to: str | None = None
    notes: str | None = None
    created_at: Any | None = None
    updated_at: Any | None = None


class LeadCreateRequest(BaseModel):
    last_name: str | None = None
    first_name: str | None = None
    phone: str | None = None
    email: str | None = None
    source: str | None = None
    campagne_id: str | None = None
    statut: str = "nouveau"
    assigned_to: str | None = None
    notes: str | None = None


class LeadUpdateRequest(BaseModel):
    last_name: str | None = None
    first_name: str | None = None
    phone: str | None = None
    email: str | None = None
    source: str | None = None
    campagne_id: str | None = None
    statut: str | None = None
    assigned_to: str | None = None
    notes: str | None = None


# ============================================
# HELPERS - Convertion entité ↔ lead
# ============================================

def _entity_to_lead_response(entity: Any) -> LeadResponse:
    """Convertit une Entity en LeadResponse (compatibilité)"""
    # Gère à la fois Entity ORM et EntityResponse Pydantic
    if hasattr(entity, 'entity_metadata'):
        metadata = entity.entity_metadata or {}
    else:
        metadata = entity.metadata or {}
    return LeadResponse(
        id=str(entity.id),
        last_name=entity.last_name,
        first_name=entity.first_name,
        phone=entity.phone,
        email=entity.email,
        source=metadata.get("source"),
        campagne_id=metadata.get("campagne_id"),
        statut=entity.status if entity.status != "active" else metadata.get("statut", "nouveau"),
        assigned_to=metadata.get("assigned_to"),
        notes=metadata.get("notes"),
        created_at=entity.created_at.isoformat() if hasattr(entity.created_at, 'isoformat') else entity.created_at,
        updated_at=entity.updated_at.isoformat() if hasattr(entity.updated_at, 'isoformat') else entity.updated_at,
    )


def _lead_capture_to_entity_create(payload: LeadCaptureRequest) -> EntityCreate:
    """Mappe LeadCaptureRequest vers EntityCreate"""
    # Calculate initial score for new lead
    
    # Prepare lead data for scoring
    lead_data = {
        "source": payload.source,
        "first_name": payload.first_name or "",
        "last_name": payload.last_name or "",
        "email": payload.email or "",
        "channels_optin": payload.channels_optin or {},
    }
    
    # Calculate score (no interaction data for new leads)
    score_result = calculate_lead_score_with_breakdown(lead_data, {
        "interaction_count": 0,
        "hours_since_last_interaction": 9999,  # No prior interaction
        "page_views": 1,  # Assume they viewed the form/page
        "last_channel_used": ""  # No prior channel
    })
    
    return EntityCreate(
        type="lead",
        subtype="particulier",
        status="pending",
        display_name=f"{payload.first_name or ''} {payload.last_name or ''}".strip() or f"Lead {payload.phone}",
        first_name=payload.first_name or "",
        last_name=payload.last_name or "",
        phone=payload.phone.strip() if payload.phone else None,
        email=payload.email.lower() if payload.email else None,
        metadata={
            "source": payload.source,
            "source_page": payload.source_page,
            "source_form": payload.source_form,
            "consent_text": payload.consent_text,
            "channels_optin": payload.channels_optin,
            "statut": "nouveau",
            "score": score_result["total"],
            "score_breakdown": score_result
        },
    )


def _lead_payload_to_entity_create(payload: LeadCreateRequest) -> EntityCreate:
    """Mappe LeadCreateRequest vers EntityCreate"""
    # Calculate initial score for new lead
    
    # Prepare lead data for scoring
    lead_data = {
        "source": payload.source or "web_form",
        "first_name": payload.first_name or "",
        "last_name": payload.last_name or "",
        "email": payload.email or "",
        "channels_optin": {},  # Not provided in LeadCreateRequest, default to empty
    }
    
    # Calculate score (no interaction data for new leads)
    score_result = calculate_lead_score_with_breakdown(lead_data, {
        "interaction_count": 0,
        "hours_since_last_interaction": 9999,  # No prior interaction
        "page_views": 1,  # Assume they viewed something
        "last_channel_used": ""  # No prior channel
    })
    
    return EntityCreate(
        type="lead",
        subtype="particulier",
        status="pending" if payload.statut == "nouveau" else "active",
        display_name=f"{payload.first_name or ''} {payload.last_name or ''}".strip() or "Lead sans nom",
        first_name=payload.first_name or "",
        last_name=payload.last_name or "",
        phone=payload.phone,
        email=payload.email,
        metadata={
            "source": payload.source or "web_form",
            "campagne_id": payload.campagne_id,
            "statut": payload.statut,
            "assigned_to": payload.assigned_to,
            "notes": payload.notes,
            "score": score_result["total"],
            "score_breakdown": score_result
        },
    )


def _lead_payload_to_entity_update(payload: LeadUpdateRequest) -> EntityUpdate:
    """Mappe LeadUpdateRequest vers EntityUpdate"""
    update_data = {}
    metadata_update = {}

    field_mapping = {
        "last_name": "last_name",
        "first_name": "first_name",
        "phone": "phone",
        "email": "email",
    }

    metadata_fields = {
        "source": "source",
        "campagne_id": "campagne_id",
        "statut": "statut",
        "assigned_to": "assigned_to",
        "notes": "notes",
    }

    for src, dst in field_mapping.items():
        value = getattr(payload, src)
        if value is not None:
            update_data[dst] = value

    for src, dst in metadata_fields.items():
        value = getattr(payload, src)
        if value is not None:
            metadata_update[dst] = value

    # Gérer le statut
    if payload.statut is not None:
        update_data["status"] = "pending" if payload.statut == "nouveau" else "active"

    return EntityUpdate(**update_data)


# ============================================
# ENDPOINTS
# ============================================

@router.get("", response_model=list[LeadResponse])
def list_leads(
    search: Optional[str] = Query(None, description="Recherche texte"),
    statut: Optional[str] = Query(None, description="Filtrer par statut"),
    assigned_to: Optional[str] = Query(None, description="Filtrer par assigné"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> list[LeadResponse]:
    """Liste les leads (entités de type lead)"""
    svc = get_entity_service(db)
    search_params = EntitySearchParams(
        search=search,
        type="lead",
        status="pending" if statut == "nouveau" else ("active" if statut else None),
        limit=limit,
        offset=offset,
        order_by="created_at",
        descending=True,
    )
    result = svc.search(search_params)
    leads = [_entity_to_lead_response(item) for item in result.items]

    # Filter by assigned_to if provided (via metadata)
    if assigned_to:
        leads = [l for l in leads if (l.entity_metadata or {}).get("assigned_to") == assigned_to]

    return leads


@router.get("/{lead_id}", response_model=LeadResponse)
def get_lead(lead_id: str, db: Session = Depends(get_db)) -> LeadResponse:
    """Retrieve a lead by ID"""
    svc = get_entity_service(db)
    entity = svc.get(UUID(lead_id))
    if not entity or entity.type != "lead":
        raise HTTPException(status_code=404, detail="Lead not found")
    return _entity_to_lead_response(entity)


@router.post("/capture")
def capture_lead(payload: LeadCaptureRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    """Capture a lead (from web form)"""
    svc = get_entity_service(db)

    if not payload.phone.strip():
        raise HTTPException(status_code=400, detail="Phone number is required")

    # Check if a lead with this phone already exists
    existing = svc.get_by_phone(payload.phone.strip())
    if existing and existing.type == "lead":
        # Update existing - recalculate score if profile data changed
        
        # Prepare data for score recalculation
        existing_metadata = existing.entity_metadata or {}
        lead_data = {
            "source": payload.source or existing_metadata.get("source", "web_form"),
            "first_name": payload.first_name if payload.first_name is not None else existing.first_name,
            "last_name": payload.last_name if payload.last_name is not None else existing.last_name,
            "email": payload.email if payload.email is not None else existing.email,
            "channels_optin": payload.channels_optin if payload.channels_optin is not None else existing_metadata.get("channels_optin", {}),
        }
        
        # Get interaction context from existing metadata or defaults
        interaction_count = existing_metadata.get("interaction_count", 0)
        last_interaction_at = existing_metadata.get("last_interaction_at")
        hours_since_last = get_hours_since_last_interaction(last_interaction_at) if last_interaction_at else 9999
        page_views = existing_metadata.get("page_views", 1)
        last_channel_used = existing_metadata.get("last_channel_used", "")
        
        score_result = calculate_lead_score_with_breakdown(lead_data, {
            "interaction_count": interaction_count,
            "hours_since_last_interaction": hours_since_last,
            "page_views": page_views,
            "last_channel_used": last_channel_used
        })
        
        update_data = EntityUpdate(
            first_name=payload.first_name,
            last_name=payload.last_name,
            email=payload.email.lower() if payload.email else None,
            entity_metadata={
                **(existing.entity_metadata or {}),
                "source": payload.source,
                "source_page": payload.source_page,
                "source_form": payload.source_form,
                "consent_text": payload.consent_text,
                "channels_optin": payload.channels_optin,
                "score": score_result["total"],
                "score_breakdown": score_result
            },
        )
        updated = svc.update(existing.id, update_data)
        return {"success": True, "data": _entity_to_lead_response(updated).model_dump(), "existing": True}

    # Create new lead
    entity = svc.create(_lead_capture_to_entity_create(payload))
    return {"success": True, "data": _entity_to_lead_response(entity).model_dump(), "existing": False}


@router.post("", response_model=LeadResponse, status_code=201)
def create_lead(payload: LeadCreateRequest, db: Session = Depends(get_db)) -> LeadResponse:
    """Create a new lead"""
    svc = get_entity_service(db)

    # Check for duplicates
    duplicates = svc.repo.find_duplicates(
        Entity(
            id_document_type=None,
            id_document_number=None,
            email=payload.email,
            phone=payload.phone,
        )
    )
    if duplicates:
        raise HTTPException(
            status_code=409,
            detail={
                "message": "A lead with these identifiers already exists",
                "duplicates": [_entity_to_lead_response(d).model_dump() for d in duplicates],
            },
        )

    entity = svc.create(_lead_payload_to_entity_create(payload))
    return _entity_to_lead_response(entity)


@router.patch("/{lead_id}", response_model=LeadResponse)
def update_lead(lead_id: str, payload: LeadUpdateRequest, db: Session = Depends(get_db)) -> LeadResponse:
    """Update a lead"""
    svc = get_entity_service(db)
    entity = svc.get(UUID(lead_id))
    if not entity or entity.type != "lead":
        raise HTTPException(status_code=404, detail="Lead not found")

    update_data = _lead_payload_to_entity_update(payload)

    # Recalculate score if relevant fields changed
    
    # Prepare data for score recalculation
    existing_metadata = entity.entity_metadata or {}
    lead_data = {
        "source": payload.source if payload.source is not None else existing_metadata.get("source", "web_form"),
        "first_name": payload.first_name if payload.first_name is not None else entity.first_name,
        "last_name": payload.last_name if payload.last_name is not None else entity.last_name,
        "email": payload.email if payload.email is not None else entity.email,
        "channels_optin": payload.channels_optin if payload.channels_optin is not None else existing_metadata.get("channels_optin", {}),
    }
    
    # Get interaction context from existing metadata
    interaction_count = existing_metadata.get("interaction_count", 0)
    last_interaction_at = existing_metadata.get("last_interaction_at")
    hours_since_last = get_hours_since_last_interaction(last_interaction_at) if last_interaction_at else 9999
    page_views = existing_metadata.get("page_views", 1)
    last_channel_used = existing_metadata.get("last_channel_used", "")
    
    score_result = calculate_lead_score_with_breakdown(lead_data, {
        "interaction_count": interaction_count,
        "hours_since_last_interaction": hours_since_last,
        "page_views": page_views,
        "last_channel_used": last_channel_used
    })
    
    # Gestion des métadonnées
    metadata_update = {}
    metadata_fields = {
        "source": "source",
        "campagne_id": "campagne_id",
        "statut": "statut",
        "assigned_to": "assigned_to",
        "notes": "notes",
    }
    for src, dst in metadata_fields.items():
        value = getattr(payload, src)
        if value is not None:
            metadata_update[dst] = value
    
    # Add score to metadata update
    metadata_update["score"] = score_result["total"]
    metadata_update["score_breakdown"] = score_result

    if metadata_update:
        entity.entity_metadata = {**(entity.entity_metadata or {}), **metadata_update}

    entity = svc.update(UUID(lead_id), update_data)
    if not entity:
        raise HTTPException(status_code=404, detail="Lead not found")

    if metadata_update:
        db.commit()
        db.refresh(entity)

    return _entity_to_lead_response(entity)


@router.delete("/{lead_id}")
def delete_lead(lead_id: str, db: Session = Depends(get_db)) -> dict[str, str]:
    """Delete a lead (soft delete)"""
    svc = get_entity_service(db)
    entity = svc.get(UUID(lead_id))
    if not entity or entity.type != "lead":
        raise HTTPException(status_code=404, detail="Lead not found")

    svc.delete(UUID(lead_id), soft=True)
    return {"status": "ok", "message": "Lead deleted"}


@router.get("/search/suggest", response_model=list[LeadResponse])
def search_leads_suggest(
    q: str = Query(..., min_length=2, max_length=100),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
) -> list[LeadResponse]:
    """Suggested search for lead autocompletion"""
    svc = get_entity_service(db)
    entities = svc.search_suggest(q, "lead", limit)
    return [_entity_to_lead_response(e) for e in entities]


# ============================================
# EXPORTS
# ============================================

__all__ = [
    "router", 
    "LeadCaptureRequest", 
    "LeadCreateRequest", 
    "LeadUpdateRequest", 
    "LeadResponse"
]

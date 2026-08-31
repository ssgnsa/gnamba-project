"""
Campaign Processor API Routes
"""
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.services.lead.campaign_processor import CampaignProcessor

router = APIRouter(tags=["leads-campaigns"])


class CampaignCreateRequest(BaseModel):
    nom: str
    description: str | None = None
    type_campagne: str = "digital"
    budget: float | None = None
    date_debut: datetime | None = None
    date_fin: datetime | None = None
    canaux: list[str] = []
    kpi_cibles: dict = {}
    template_content: dict = {}
    segment_filter: dict = {}


class CampaignUpdateRequest(BaseModel):
    nom: str | None = None
    description: str | None = None
    type_campagne: str | None = None
    budget: float | None = None
    date_debut: datetime | None = None
    date_fin: datetime | None = None
    canaux: list[str] | None = None
    kpi_cibles: dict | None = None
    template_content: dict | None = None
    segment_filter: dict | None = None
    statut: str | None = None


@router.post("/campaigns", status_code=201)
async def create_campaign(
    payload: CampaignCreateRequest,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Create a new lead campaign"""
    try:
        # Insert campaign into database
        result = db.execute(
            text("""
                INSERT INTO lead_campaigns
                (nom, description, type_campagne, statut, budget, date_debut, date_fin, canaux, kpi_cibles, template_content, created_at, updated_at)
                VALUES (:nom, :description, :type_campagne, 'brouillon', :budget, :date_debut, :date_fin, :canaux, :kpi_cibles, :template_content, :created_at, :updated_at)
                RETURNING id, nom, description, type_campagne, statut, budget, date_debut, date_fin, canaux, kpi_cibles, kpi_reels, template_content, created_at, updated_at
            """),
            {
                "nom": payload.nom,
                "description": payload.description,
                "type_campagne": payload.type_campagne,
                "budget": payload.budget,
                "date_debut": payload.date_debut,
                "date_fin": payload.date_fin,
                "canaux": payload.canaux,
                "kpi_cibles": payload.kpi_cibles,
                "template_content": payload.template_content,
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
        ).fetchone()

        db.commit()

        if result:
            return {
                "success": True,
                "data": {
                    "id": str(result[0]),
                    "nom": result[1],
                    "description": result[2],
                    "type_campagne": result[3],
                    "statut": result[4],
                    "budget": float(result[5]) if result[5] else None,
                    "date_debut": result[6],
                    "date_fin": result[7],
                    "canaux": result[8] if isinstance(result[8], list) else [],
                    "kpi_cibles": result[9] or {},
                    "kpi_reels": result[10] or {},
                    "template_content": result[11] or {},
                    "created_at": result[12],
                    "updated_at": result[13]
                }
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to create campaign")

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/campaigns")
async def list_campaigns(
    statut: Optional[str] = None,
    type_campagne: Optional[str] = None,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """List all lead campaigns"""
    try:
        query = """
            SELECT id, nom, description, type_campagne, statut, budget, date_debut, date_fin, canaux, kpi_cibles, kpi_reels, template_content, created_at, updated_at
            FROM lead_campaigns
            WHERE 1=1
        """
        params = {}

        if statut:
            query += " AND statut = :statut"
            params["statut"] = statut
        if type_campagne:
            query += " AND type_campagne = :type_campagne"
            params["type_campagne"] = type_campagne

        query += " ORDER BY created_at DESC"

        result = db.execute(text(query), params).fetchall()

        campaigns = [
            {
                "id": str(row[0]),
                "nom": row[1],
                "description": row[2],
                "type_campagne": row[3],
                "statut": row[4],
                "budget": float(row[5]) if row[5] else None,
                "date_debut": row[6],
                "date_fin": row[7],
                "canaux": row[8] if isinstance(row[8], list) else [],
                "kpi_cibles": row[9] or {},
                "kpi_reels": row[10] or {},
                "template_content": row[11] or {},
                "created_at": row[12],
                "updated_at": row[13]
            }
            for row in result
        ]

        return {"success": True, "data": campaigns}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/campaigns/{campaign_id}")
async def get_campaign(
    campaign_id: UUID,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get a campaign by ID"""
    try:
        result = db.execute(
            text("""
                SELECT id, nom, description, type_campagne, statut, budget, date_debut, date_fin, canaux, kpi_cibles, kpi_reels, template_content, created_at, updated_at
                FROM lead_campaigns
                WHERE id = :campaign_id
            """),
            {"campaign_id": campaign_id}
        ).fetchone()

        if not result:
            raise HTTPException(status_code=404, detail="Campaign not found")

        return {
            "success": True,
            "data": {
                "id": str(result[0]),
                "nom": result[1],
                "description": result[2],
                "type_campagne": result[3],
                "statut": result[4],
                "budget": float(result[5]) if result[5] else None,
                "date_debut": result[6],
                "date_fin": result[7],
                "canaux": result[8] if isinstance(result[8], list) else [],
                "kpi_cibles": result[9] or {},
                "kpi_reels": result[10] or {},
                "template_content": result[11] or {},
                "created_at": result[12],
                "updated_at": result[13]
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/campaigns/{campaign_id}")
async def update_campaign(
    campaign_id: UUID,
    payload: CampaignUpdateRequest,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Update a campaign"""
    try:
        # Build dynamic update query
        updates = []
        params = {"campaign_id": campaign_id, "updated_at": datetime.now()}

        field_mapping = {
            "nom": "nom",
            "description": "description",
            "type_campagne": "type_campagne",
            "budget": "budget",
            "date_debut": "date_debut",
            "date_fin": "date_fin",
            "canaux": "canaux",
            "kpi_cibles": "kpi_cibles",
            "template_content": "template_content",
            "statut": "statut",
        }

        for src, dst in field_mapping.items():
            value = getattr(payload, src)
            if value is not None:
                updates.append(f"{dst} = :{src}")
                params[src] = value

        updates.append("updated_at = :updated_at")

        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")

        query = f"""
            UPDATE lead_campaigns
            SET {", ".join(updates)}
            WHERE id = :campaign_id
            RETURNING id, nom, description, type_campagne, statut, budget, date_debut, date_fin, canaux, kpi_cibles, kpi_reels, template_content, created_at, updated_at
        """

        result = db.execute(text(query), params).fetchone()
        db.commit()

        if not result:
            raise HTTPException(status_code=404, detail="Campaign not found")

        return {
            "success": True,
            "data": {
                "id": str(result[0]),
                "nom": result[1],
                "description": result[2],
                "type_campagne": result[3],
                "statut": result[4],
                "budget": float(result[5]) if result[5] else None,
                "date_debut": result[6],
                "date_fin": result[7],
                "canaux": result[8] if isinstance(result[8], list) else [],
                "kpi_cibles": result[9] or {},
                "kpi_reels": result[10] or {},
                "template_content": result[11] or {},
                "created_at": result[12],
                "updated_at": result[13]
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/campaigns/{campaign_id}")
async def delete_campaign(
    campaign_id: UUID,
    db: Session = Depends(get_db)
) -> Dict[str, str]:
    """Delete a campaign"""
    try:
        result = db.execute(
            text("DELETE FROM lead_campaigns WHERE id = :campaign_id RETURNING id"),
            {"campaign_id": campaign_id}
        ).fetchone()
        db.commit()

        if not result:
            raise HTTPException(status_code=404, detail="Campaign not found")

        return {"status": "ok", "message": "Campaign deleted"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/campaigns/{campaign_id}/process")
async def process_campaign(
    campaign_id: UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Process a campaign (send messages to leads)
    This runs as a background task
    """
    # Verify campaign exists
    result = db.execute(
        text("SELECT id FROM lead_campaigns WHERE id = :campaign_id"),
        {"campaign_id": campaign_id}
    ).fetchone()

    if not result:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Add to background tasks to avoid blocking the API response
    background_tasks.add_task(_process_campaign_background, campaign_id)

    return {
        "success": True,
        "message": "Campaign processing started in background",
        "campaign_id": str(campaign_id)
    }


async def _process_campaign_background(campaign_id: UUID):
    """Background task to process campaign"""
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        processor = CampaignProcessor(db)
        result = await processor.process_campaign(campaign_id)

        if not result["success"]:
            logger.error(f"Failed to process campaign {campaign_id}: {result.get('error')}")
        # In a real system, we might send a notification or alert
    except Exception as e:
        logger.error(f"Error in background campaign processing: {str(e)}")
    finally:
        db.close()


@router.get("/campaigns/{campaign_id}/stats")
async def get_campaign_stats(
    campaign_id: UUID,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get campaign processing statistics"""
    try:
        result = db.execute(
            text("""
                SELECT id, nom, statut, budget, cout_reel, kpi_cibles, kpi_reels, date_debut, date_fin
                FROM lead_campaigns
                WHERE id = :campaign_id
            """),
            {"campaign_id": campaign_id}
        ).fetchone()

        if not result:
            raise HTTPException(status_code=404, detail="Campaign not found")

        return {
            "success": True,
            "data": {
                "id": str(result[0]),
                "nom": result[1],
                "statut": result[2],
                "budget": float(result[3]) if result[3] else None,
                "cout_reel": float(result[4]) if result[4] else None,
                "kpi_cibles": result[5] or {},
                "kpi_reels": result[6] or {},
                "date_debut": result[7],
                "date_fin": result[8]
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/campaigns/{campaign_id}/preview")
async def preview_campaign_leads(
    campaign_id: UUID,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Preview leads that would be targeted by the campaign"""
    try:
        # Get campaign
        result = db.execute(
            text("""
                SELECT id, nom, canaux, segment_filter
                FROM lead_campaigns
                WHERE id = :campaign_id
            """),
            {"campaign_id": campaign_id}
        ).fetchone()

        if not result:
            raise HTTPException(status_code=404, detail="Campaign not found")

        campaign = {
            "id": str(result[0]),
            "nom": result[1],
            "channels": result[2] if isinstance(result[2], list) else [],
            "segment_filter": result[3] or {}
        }

        # Create processor and get segmented leads
        processor = CampaignProcessor(db)
        leads = await processor._get_segmented_leads(campaign)

        # Return summary
        return {
            "success": True,
            "campaign_id": str(campaign_id),
            "campaign_name": campaign["nom"],
            "total_matching_leads": len(leads),
            "preview_leads": [
                {
                    "id": lead["id"],
                    "first_name": lead["first_name"],
                    "last_name": lead["last_name"],
                    "phone": lead["phone"],
                    "email": lead["email"],
                    "tier": processor._get_lead_tier(lead)
                }
                for lead in leads[:20]  # Limit preview to 20
            ]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
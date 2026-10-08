from __future__ import annotations
import json
from datetime import datetime, timezone
from uuid import UUID

from typing import Any
import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.deps import require_permission
from app.core.antispam import public_form_limiter
from app.core.database import SessionLocal, get_db
from app.core.security import AuthorizationError, get_http_exception_for_error
from app.content import bumpContentVersion
from app.models.entity import Entity
from app.schemas.entity import EntityCreate
from app.services.entity_service import get_entity_service

router = APIRouter(prefix="/api/v1/site", tags=["site"])


def _datetime_iso_utc(value: datetime) -> str:
    """Serialize timestamps as UTC ISO-8601, treating legacy naive DB values as UTC."""
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat()


def convert_realisation_row(row) -> SiteRealisationRow:
    """Convert database row to SiteRealisationRow with proper type conversion."""
    data = dict(row._mapping)
    # Convert datetime to ISO string
    if data.get("created_at"):
        data["created_at"] = data["created_at"].isoformat()
    if data.get("updated_at"):
        data["updated_at"] = data["updated_at"].isoformat()
    if data.get("date_debut"):
        data["date_debut"] = data["date_debut"].isoformat()
    if data.get("date_fin_prevue"):
        data["date_fin_prevue"] = data["date_fin_prevue"].isoformat()
    if data.get("date_fin_reelle"):
        data["date_fin_reelle"] = data["date_fin_reelle"].isoformat()
    # Convert Decimal to float
    if data.get("surface"):
        data["surface"] = float(data["surface"])
    if data.get("budget_previsionnel"):
        data["budget_previsionnel"] = float(data["budget_previsionnel"])
    if data.get("budget_reel"):
        data["budget_reel"] = float(data["budget_reel"])
    # Convert UUID to string
    if data.get("id"):
        data["id"] = str(data["id"])
    if data.get("chef_projet_id"):
        data["chef_projet_id"] = str(data["chef_projet_id"])
    return SiteRealisationRow(**data)


def convert_vitrine_lot_row(row) -> VitrineLotRow:
    """Convert database row to VitrineLotRow with proper type conversion."""
    data = dict(row._mapping)
    # Convert datetime to ISO string
    if data.get("created_at"):
        data["created_at"] = _datetime_iso_utc(data["created_at"])
    if data.get("updated_at"):
        data["updated_at"] = _datetime_iso_utc(data["updated_at"])
    # Convert Decimal to float
    decimal_fields = ["prix", "surface", "superficie", "prix_vente"]
    for field in decimal_fields:
        if data.get(field) is not None:
            data[field] = float(data[field])
    # Convert UUID to string
    if data.get("id"):
        data["id"] = str(data["id"])
    if data.get("lot_id"):
        data["lot_id"] = str(data["lot_id"])
    if data.get("property_id"):
        data["property_id"] = str(data["property_id"])
    if data.get("created_by"):
        data["created_by"] = str(data["created_by"])
    if data.get("updated_by"):
        data["updated_by"] = str(data["updated_by"])
    # Ensure JSON fields are lists not empty objects
    for field in ["photos", "tags", "caracteristiques"]:
        if data.get(field) is not None and not isinstance(data.get(field), list):
            data[field] = []
    # Ensure documents field is string or None
    if data.get("documents") is not None and not isinstance(data.get("documents"), str):
        data["documents"] = None
    return VitrineLotRow(**data)


class SiteRealisationRow(BaseModel):
    id: str | None = None
    reference: str | None = None
    titre: str | None = None
    description: str | None = None
    description_courte: str | None = None
    type_realisation: str | None = None
    statut: str | None = None
    localisation: str | None = None
    ville: str | None = None
    surface: float | None = None
    budget_previsionnel: float | None = None
    budget_reel: float | None = None
    date_debut: str | None = None
    date_fin_prevue: str | None = None
    date_fin_reelle: str | None = None
    chef_projet_id: str | None = None
    equipe: list[Any] | None = None
    photos: list[Any] | None = None
    documents: list[Any] | None = None
    publier_vitrine: bool = True
    ordre_affichage: int = 0
    tags: list[str] | None = None
    metadata_json: dict[str, Any] | None = None
    created_at: str | None = None
    updated_at: str | None = None


class VitrineLotRow(BaseModel):
    id: UUID | None = None
    lot_id: UUID | None = None
    property_id: UUID | None = None
    titre: str | None = Field(default=None, max_length=255)
    description: str | None = None
    prix: float | None = None
    surface: float | None = None
    localisation: str | None = None
    photos: list[Any] | None = None
    publier: bool = True
    ordre: int = 0
    tags: list[str] | None = None
    # Champs VitrineLot frontend
    reference: str | None = None
    village: str | None = None
    quartier: str | None = None
    commune: str | None = None
    departement: str | None = None
    region: str | None = None
    superficie: float | None = None
    prix_vente: float | None = None
    statut: str | None = Field(default=None, max_length=50)
    documents: str | None = None
    caracteristiques: list[str] | None = None
    image_url: str | None = None
    image_alt: str | None = None
    contact_phone: str | None = None
    contact_email: str | None = None
    publier_sur_vitrine: bool = True
    ordre_affichage: int = 0
    notes: str | None = None
    created_by: str | None = None
    updated_by: str | None = None
    created_at: str | None = None
    updated_at: str | None = None


class PublicLotInquiry(BaseModel):
    lot_id: UUID | None = None
    is_example: bool = False
    reference: str = Field(min_length=1, max_length=80)
    village: str = Field(default="", max_length=120)
    nom: str = Field(min_length=1, max_length=120)
    prenom: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=3, max_length=255)
    telephone: str = Field(min_length=5, max_length=50)
    message: str = Field(min_length=1, max_length=5000)
    website: str = Field(default="", max_length=200)
    form_started_at: float
    consent: bool


class PublicLeadCapture(BaseModel):
    """Minimal public lead payload used by generic site forms."""

    phone: str = Field(min_length=5, max_length=50)
    first_name: str | None = Field(default=None, max_length=255)
    last_name: str | None = Field(default=None, max_length=255)
    email: str | None = Field(default=None, max_length=255)
    source: str = Field(default="web_form", min_length=1, max_length=100)
    source_page: str | None = Field(default=None, max_length=500)
    source_form: str | None = Field(default=None, max_length=255)
    consent_text: str = Field(min_length=1, max_length=1000)
    channels_optin: dict[str, bool] | list[str] | None = None
    website: str = Field(default="", max_length=200)


class PublicPropertyRow(BaseModel):
    id: UUID
    reference: str
    titre: str
    description: str | None = None
    type_bien: str
    commune: str | None = None
    ville: str | None = None
    loyer_mensuel: float | None = None
    valeur: float | None = None
    cover_image_url: str | None = None
    updated_at: datetime | None = None


@router.get("/realisations", response_model=list[SiteRealisationRow])
def list_realisations() -> list[SiteRealisationRow]:
    try:
        with SessionLocal() as session:
            rows = session.execute(
                text("""
                    SELECT id, reference, titre, description, description_courte, type_realisation,
                           localisation, ville, photos, publier_vitrine, ordre_affichage,
                           created_at, updated_at
                    FROM site_realisations
                    WHERE publier_vitrine IS TRUE
                    ORDER BY ordre_affichage, created_at DESC
                """)
            ).fetchall()
        logging.info(f"Found {len(rows)} realisations")
        return [convert_realisation_row(row) for row in rows]
    except Exception as e:
        logging.error(f"Error fetching realisations: {e}")
        return []


@router.get("/properties", response_model=list[PublicPropertyRow])
def list_public_properties() -> list[PublicPropertyRow]:
    """Expose only the allowlisted fields of currently published properties."""
    try:
        with SessionLocal() as session:
            rows = session.execute(
                text("""
                    SELECT id, reference, titre, description, type_bien,
                           commune, ville, loyer_mensuel, valeur,
                           cover_image_url, updated_at
                    FROM public.properties
                    WHERE publier_vitrine IS TRUE
                      AND deleted_at IS NULL
                      AND statut IN ('disponible', 'en_vente')
                    ORDER BY created_at DESC, id
                """)
            ).fetchall()
        result = []
        for row in rows:
            data = dict(row._mapping)
            data["id"] = str(data["id"])
            for field in ("loyer_mensuel", "valeur"):
                if data[field] is not None:
                    data[field] = float(data[field])
            result.append(PublicPropertyRow(**data))
        return result
    except Exception:
        logging.exception("site.list_public_properties failed")
        return []


@router.get("/realisations/{item_id}", response_model=SiteRealisationRow)
def get_realisation(
    item_id: str,
    _admin: dict[str, Any] = Depends(require_permission("site_vitrine", "read_private")),
) -> SiteRealisationRow:
    try:
        with SessionLocal() as session:
            row = session.execute(
                text("""
                    SELECT id, reference, titre, description, description_courte, type_realisation, statut,
                           localisation, ville, surface, budget_previsionnel, budget_reel,
                           date_debut, date_fin_prevue, date_fin_reelle, chef_projet_id,
                           equipe, photos, documents, publier_vitrine, ordre_affichage, tags,
                           metadata_json, created_at, updated_at
                    FROM site_realisations WHERE id = :item_id
                """),
                {"item_id": item_id},
            ).fetchone()
        if row:
            return convert_realisation_row(row)
        raise HTTPException(status_code=404, detail="Réalisation non trouvée")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=404, detail="Réalisation non trouvée")


@router.post("/realisations", response_model=SiteRealisationRow)
def create_realisation(
    payload: SiteRealisationRow,
    current_user: dict[str, Any] = Depends(require_permission("site_vitrine", "create")),
) -> SiteRealisationRow:
    try:
        from uuid import uuid4
        from datetime import datetime

        realisation_id = str(uuid4())
        now = datetime.now()

        with SessionLocal() as session:
            session.execute(
                text("""
                    INSERT INTO site_realisations (
                        id, reference, titre, description, description_courte, type_realisation, statut,
                        localisation, ville, surface, budget_previsionnel, budget_reel,
                        date_debut, date_fin_prevue, date_fin_reelle, chef_projet_id,
                        equipe, photos, documents, publier_vitrine, ordre_affichage, tags,
                        metadata_json, created_at, updated_at, created_by, updated_by
                    ) VALUES (
                        :id, :reference, :titre, :description, :description_courte, :type_realisation, :statut,
                        :localisation, :ville, :surface, :budget_previsionnel, :budget_reel,
                        :date_debut, :date_fin_prevue, :date_fin_reelle, :chef_projet_id,
                        :equipe, :photos, :documents, :publier_vitrine, :ordre_affichage, :tags,
                        :metadata_json, :created_at, :updated_at, :created_by, :updated_by
                    )
                """),
                {
                    "id": realisation_id,
                    "reference": payload.reference,
                    "titre": payload.titre,
                    "description": payload.description,
                    "description_courte": payload.description_courte,
                    "type_realisation": payload.type_realisation,
                    "statut": payload.statut or "en_cours",
                    "localisation": payload.localisation,
                    "ville": payload.ville,
                    "surface": payload.surface,
                    "budget_previsionnel": payload.budget_previsionnel,
                    "budget_reel": payload.budget_reel,
                    "date_debut": payload.date_debut,
                    "date_fin_prevue": payload.date_fin_prevue,
                    "date_fin_reelle": payload.date_fin_reelle,
                    "chef_projet_id": payload.chef_projet_id,
                    "equipe": json.dumps(payload.equipe or []),
                    "photos": json.dumps(payload.photos or []),
                    "documents": json.dumps(payload.documents or []),
                    "publier_vitrine": payload.publier_vitrine,
                    "ordre_affichage": payload.ordre_affichage or 0,
                    "tags": payload.tags or [],
                    "metadata_json": json.dumps(payload.metadata_json or {}),
                    "created_at": now,
                    "updated_at": now,
                    "created_by": current_user.get("id"),
                    "updated_by": current_user.get("id"),
                },
            )
            session.commit()

            # Return the created realisation
            row = session.execute(
                text("""
                    SELECT id, reference, titre, description, description_courte, type_realisation, statut,
                           localisation, ville, surface, budget_previsionnel, budget_reel,
                           date_debut, date_fin_prevue, date_fin_reelle, chef_projet_id,
                           equipe, photos, documents, publier_vitrine, ordre_affichage, tags,
                           metadata_json, created_at, updated_at
                    FROM site_realisations WHERE id = :item_id
                """),
                {"item_id": realisation_id},
            ).fetchone()

        if row:
            return convert_realisation_row(row)
        raise HTTPException(status_code=404, detail="Réalisation non trouvée après création")
    except AuthorizationError as exc:
        raise get_http_exception_for_error(exc) from exc
    except Exception as exc:
        raise get_http_exception_for_error(Exception(str(exc))) from exc


@router.patch("/realisations/{item_id}", response_model=SiteRealisationRow)
def update_realisation(
    item_id: str,
    payload: SiteRealisationRow,
    current_user: dict[str, Any] = Depends(require_permission("site_vitrine", "update")),
) -> SiteRealisationRow:
    try:
        from datetime import datetime

        with SessionLocal() as session:
            # Build dynamic update query
            fields = payload.model_dump(exclude_unset=True, exclude={"id", "created_at", "updated_at"})
            if not fields:
                raise HTTPException(status_code=400, detail="Aucun champ à mettre à jour")

            fields["updated_at"] = datetime.now()
            fields["updated_by"] = current_user.get("id")

            set_clause = ", ".join(f"{key} = :{key}" for key in fields.keys())
            session.execute(
                text(f"UPDATE site_realisations SET {set_clause} WHERE id = :item_id"),
                {**fields, "item_id": item_id},
            )
            session.commit()

            row = session.execute(
                text("""
                    SELECT id, reference, titre, description, description_courte, type_realisation, statut,
                           localisation, ville, surface, budget_previsionnel, budget_reel,
                           date_debut, date_fin_prevue, date_fin_reelle, chef_projet_id,
                           equipe, photos, documents, publier_vitrine, ordre_affichage, tags,
                           metadata_json, created_at, updated_at
                    FROM site_realisations WHERE id = :item_id
                """),
                {"item_id": item_id},
            ).fetchone()

        if row:
            return convert_realisation_row(row)
        raise HTTPException(status_code=404, detail="Réalisation non trouvée après mise à jour")
    except AuthorizationError as exc:
        raise get_http_exception_for_error(exc) from exc
    except Exception as exc:
        raise get_http_exception_for_error(Exception(str(exc))) from exc


@router.delete("/realisations/{item_id}")
def delete_realisation(
    item_id: str,
    current_user: dict[str, Any] = Depends(require_permission("site_vitrine", "delete")),
) -> dict[str, str]:
    try:
        with SessionLocal() as session:
            result = session.execute(
                text("DELETE FROM site_realisations WHERE id = :item_id"),
                {"item_id": item_id},
            )
            session.commit()

        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Réalisation non trouvée")

        return {"status": "ok", "message": "Réalisation supprimée"}
    except AuthorizationError as exc:
        raise get_http_exception_for_error(exc) from exc
    except Exception as exc:
        raise get_http_exception_for_error(Exception(str(exc))) from exc


@router.get("/vitrine-lots", response_model=list[VitrineLotRow])
def list_vitrine_lots() -> list[VitrineLotRow]:
    try:
        with SessionLocal() as session:
            rows = session.execute(
                text("""
                    SELECT id, lot_id, property_id, titre, description, prix, surface, localisation,
                           photos, publier, ordre, tags, reference, village, quartier, commune,
                           departement, region, superficie, prix_vente, statut, documents,
                           caracteristiques, image_url, image_alt,
                           NULL::VARCHAR(50) AS contact_phone, NULL::VARCHAR(255) AS contact_email,
                           publier_sur_vitrine, ordre_affichage,
                           created_at, updated_at
                    FROM vitrine_lots
                    WHERE publier_sur_vitrine IS TRUE
                    ORDER BY ordre_affichage, created_at DESC
                """)
            ).fetchall()
        logging.info(f"Found {len(rows)} vitrine lots")
        return [convert_vitrine_lot_row(row) for row in rows]
    except Exception as e:
        logging.error(f"Error fetching vitrine lots: {e}")
        return []


@router.get("/vitrine-lots/{item_id}", response_model=VitrineLotRow)
def get_vitrine_lot(
    item_id: UUID,
    _admin: dict[str, Any] = Depends(require_permission("site_vitrine", "read_private")),
) -> VitrineLotRow:
    try:
        with SessionLocal() as session:
            row = session.execute(
                text("""
                    SELECT id, lot_id, property_id, titre, description, prix, surface, localisation,
                           photos, publier, ordre, tags, reference, village, quartier, commune,
                           departement, region, superficie, prix_vente, statut, documents,
                           caracteristiques, image_url, image_alt, contact_phone, contact_email,
                           publier_sur_vitrine, ordre_affichage, notes, created_by, updated_by,
                           created_at, updated_at
                    FROM vitrine_lots WHERE id = :item_id
                """),
                {"item_id": str(item_id)},
            ).fetchone()
        if row:
            return convert_vitrine_lot_row(row)
        raise HTTPException(status_code=404, detail="Lot non trouvé")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=404, detail="Lot non trouvé")


@router.post("/vitrine-lot-inquiries", status_code=201)
def create_vitrine_lot_inquiry(
    payload: PublicLotInquiry,
    request: Request,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Accept a constrained public inquiry and create the existing CRM follow-up."""
    if payload.website.strip():
        return {"success": True}
    elapsed = datetime.now(timezone.utc).timestamp() - payload.form_started_at
    if elapsed < 2.5 or elapsed > 60 * 60 or not payload.consent:
        raise HTTPException(status_code=422, detail="Formulaire invalide")
    if not request.client or not request.client.host or not public_form_limiter.allow(
        request.client.host,
        maximum=5,
        window_seconds=60 * 60,
    ):
        raise HTTPException(status_code=429, detail="Soumission temporairement indisponible")
    if not payload.telephone.strip():
        raise HTTPException(status_code=422, detail="Téléphone requis")

    lot: dict[str, Any] | None = None
    if not payload.is_example:
        if not payload.lot_id:
            raise HTTPException(status_code=422, detail="Lot requis")
        row = db.execute(
            text("""
                SELECT id, reference, titre, village, prix_vente
                FROM vitrine_lots
                WHERE id = :lot_id AND publier_sur_vitrine IS TRUE
            """),
            {"lot_id": str(payload.lot_id)},
        ).mappings().first()
        if not row:
            return {"success": True}
        lot = dict(row)

    service = get_entity_service(db)
    service.create(EntityCreate(
        type="lead",
        subtype="particulier",
        status="pending",
        display_name=f"{payload.prenom.strip()} {payload.nom.strip()}".strip(),
        first_name=payload.prenom.strip(),
        last_name=payload.nom.strip(),
        phone=payload.telephone.strip(),
        email=payload.email.strip().lower(),
        entity_metadata={
            "source": "vitrine_lots",
            "source_form": "public_lots",
            "consent_text": "Consentement explicite au formulaire public",
            "lot_reference": str((lot or {}).get("reference") or payload.reference).strip(),
            "lot_id": str(payload.lot_id) if payload.lot_id else None,
            "message": payload.message.strip(),
        },
    ))
    db.commit()
    return {"success": True}


@router.post("/lead-capture")
def create_public_lead_capture(
    payload: PublicLeadCapture,
    request: Request,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Capture a generic public lead without exposing the admin leads API."""
    if payload.website.strip():
        return {"success": True}
    if not payload.phone.strip():
        raise HTTPException(status_code=422, detail="Téléphone requis")
    if not payload.consent_text.strip():
        raise HTTPException(status_code=422, detail="Consentement requis")
    if not request.client or not request.client.host or not public_form_limiter.allow(
        request.client.host,
        maximum=5,
        window_seconds=60 * 60,
    ):
        raise HTTPException(status_code=429, detail="Soumission temporairement indisponible")

    service = get_entity_service(db)
    phone = payload.phone.strip()
    existing = service.get_by_phone(phone)
    if existing and existing.type == "lead":
        return {
            "success": True,
            "data": {"id": str(existing.id), "phone": phone},
            "existing": True,
        }

    channels_optin = payload.channels_optin
    if isinstance(channels_optin, list):
        channels_optin = {channel: True for channel in channels_optin}
    entity = service.create(
        EntityCreate(
            type="lead",
            subtype="particulier",
            status="pending",
            display_name=f"{payload.first_name or ''} {payload.last_name or ''}".strip()
            or f"Lead {phone}",
            first_name=payload.first_name or "",
            last_name=payload.last_name or "",
            phone=phone,
            email=payload.email.lower() if payload.email else None,
            entity_metadata={
                "source": payload.source,
                "source_page": payload.source_page,
                "source_form": payload.source_form,
                "consent_text": payload.consent_text,
                "channels_optin": channels_optin,
                "statut": "nouveau",
            },
        )
    )
    return {
        "success": True,
        "data": {"id": str(entity.id), "phone": phone},
        "existing": False,
    }


@router.post("/vitrine-lots", response_model=VitrineLotRow)
def create_vitrine_lot(
    payload: VitrineLotRow,
    current_user: dict[str, Any] = Depends(require_permission("site_vitrine", "create")),
) -> VitrineLotRow:
    try:
        from uuid import uuid4
        lot_id = str(uuid4())
        now = datetime.now(timezone.utc)

        with SessionLocal() as session:
            session.execute(
                text("""
                    INSERT INTO vitrine_lots (
                        id, lot_id, property_id, titre, description, prix, surface, localisation,
                        photos, publier, ordre, tags, reference, village, quartier, commune,
                        departement, region, superficie, prix_vente, statut, documents,
                        caracteristiques, image_url, image_alt, contact_phone, contact_email,
                        publier_sur_vitrine, ordre_affichage, notes, created_by, updated_by,
                        created_at, updated_at
                    ) VALUES (
                        :id, :lot_id, :property_id, :titre, :description, :prix, :surface, :localisation,
                        :photos, :publier, :ordre, :tags, :reference, :village, :quartier, :commune,
                        :departement, :region, :superficie, :prix_vente, :statut, :documents,
                        :caracteristiques, :image_url, :image_alt, :contact_phone, :contact_email,
                        :publier_sur_vitrine, :ordre_affichage, :notes, :created_by, :updated_by,
                        :created_at, :updated_at
                    )
                """),
                {
                    "id": lot_id,
                    "lot_id": str(payload.lot_id) if payload.lot_id is not None else None,
                    "property_id": str(payload.property_id) if payload.property_id is not None else None,
                    "titre": payload.titre,
                    "description": payload.description,
                    "prix": payload.prix,
                    "surface": payload.surface,
                    "localisation": payload.localisation,
                    "photos": json.dumps(payload.photos or []),
                    "publier": payload.publier,
                    "ordre": payload.ordre or 0,
                    "tags": payload.tags or [],
                    "reference": payload.reference,
                    "village": payload.village,
                    "quartier": payload.quartier,
                    "commune": payload.commune,
                    "departement": payload.departement,
                    "region": payload.region,
                    "superficie": payload.superficie,
                    "prix_vente": payload.prix_vente,
                    "statut": payload.statut or "disponible",
                    "documents": payload.documents,
                    "caracteristiques": payload.caracteristiques or [],
                    "image_url": payload.image_url,
                    "image_alt": payload.image_alt,
                    "contact_phone": payload.contact_phone,
                    "contact_email": payload.contact_email,
                    "publier_sur_vitrine": payload.publier_sur_vitrine,
                    "ordre_affichage": payload.ordre_affichage or 0,
                    "notes": payload.notes,
                    "created_by": current_user.get("id"),
                    "updated_by": current_user.get("id"),
                    "created_at": now,
                    "updated_at": now,
                },
            )
            session.commit()
            bumpContentVersion()  # Invalidate caches across all clients

            row = session.execute(
                text("""
                    SELECT id, lot_id, property_id, titre, description, prix, surface, localisation,
                           photos, publier, ordre, tags, reference, village, quartier, commune,
                           departement, region, superficie, prix_vente, statut, documents,
                           caracteristiques, image_url, image_alt, contact_phone, contact_email,
                           publier_sur_vitrine, ordre_affichage, notes, created_by, updated_by,
                           created_at, updated_at
                    FROM vitrine_lots WHERE id = :item_id
                """),
                {"item_id": lot_id},
            ).fetchone()

        if row:
            return convert_vitrine_lot_row(row)
        raise HTTPException(status_code=404, detail="Lot non trouvé après création")
    except AuthorizationError as exc:
        raise get_http_exception_for_error(exc) from exc
    except Exception as exc:
        raise get_http_exception_for_error(Exception(str(exc))) from exc


@router.patch("/vitrine-lots/{item_id}", response_model=VitrineLotRow)
def update_vitrine_lot(
    item_id: UUID,
    payload: VitrineLotRow,
    current_user: dict[str, Any] = Depends(require_permission("site_vitrine", "update")),
) -> VitrineLotRow:
    try:
        from decimal import Decimal
        import uuid

        with SessionLocal() as session:
            # 1. Préparer les champs à mettre à jour
            fields = payload.model_dump(exclude_unset=True, exclude={"id", "created_at", "updated_at"})
            if not fields:
                raise HTTPException(status_code=400, detail="Aucun champ à mettre à jour")

            for field in ("lot_id", "property_id"):
                if fields.get(field) is not None:
                    fields[field] = str(fields[field])

            fields["updated_at"] = datetime.now(timezone.utc)
            fields["updated_by"] = current_user.get("id")

            # 2. Exécuter la mise à jour
            set_clause = ", ".join(f"{key} = :{key}" for key in fields.keys())
            session.execute(
                text(f"UPDATE vitrine_lots SET {set_clause} WHERE id = :item_id"),
                {**fields, "item_id": str(item_id)},
            )
            session.commit()

            # 3. Post-commit sécurisé (ne doit pas faire échouer l'écriture)
            try:
                # Si cette fonction existe, on l'appelle. Sinon, on ignore silencieusement.
                bumpContentVersion() 
            except (NameError, Exception):
                pass 

            # 4. Relire la ligne et la sérialiser SAFELY pour Pydantic
            row = session.execute(
                text("""
                    SELECT id, lot_id, property_id, titre, description, prix, surface, localisation,
                           photos, publier, ordre, tags, reference, village, quartier, commune,
                           departement, region, superficie, prix_vente, statut, documents,
                           caracteristiques, image_url, image_alt, contact_phone, contact_email,
                           publier_sur_vitrine, ordre_affichage, notes, created_by, updated_by,
                           created_at, updated_at
                    FROM vitrine_lots WHERE id = :item_id
                """),
                {"item_id": str(item_id)}
            ).mappings().first()
            
            if not row:
                raise HTTPException(status_code=404, detail="Lot vitrine non trouvé après mise à jour")
            
            # 5. Conversion explicite des types pour éviter les ValidationError Pydantic
            safe_row = {}
            for key, value in row.items():
                if isinstance(value, uuid.UUID):
                    safe_row[key] = str(value)
                elif isinstance(value, Decimal):
                    safe_row[key] = float(value)
                elif isinstance(value, datetime):
                    safe_row[key] = _datetime_iso_utc(value)
                else:
                    safe_row[key] = value

            return VitrineLotRow(**safe_row)
            
    except HTTPException:
        raise  # Laisser passer les erreurs HTTP prévues (400, 403, 404)
    except Exception as exc:
        import logging
        logging.error(f"Erreur critique update_vitrine_lot: {str(exc)}")
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(exc)}") from exc


@router.delete("/vitrine-lots/{item_id}")
def delete_vitrine_lot(
    item_id: UUID,
    current_user: dict[str, Any] = Depends(require_permission("site_vitrine", "delete")),
) -> dict[str, str]:
    try:
        with SessionLocal() as session:
            result = session.execute(
                text("DELETE FROM vitrine_lots WHERE id = :item_id"),
                {"item_id": str(item_id)},
            )
            session.commit()
            bumpContentVersion()  # Invalidate caches across all clients

        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Lot non trouvé")

        return {"status": "ok", "message": "Lot supprimé"}
    except AuthorizationError as exc:
        raise get_http_exception_for_error(exc) from exc
    except Exception as exc:
        raise get_http_exception_for_error(Exception(str(exc))) from exc

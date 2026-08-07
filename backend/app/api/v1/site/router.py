from __future__ import annotations
import json

from typing import Any
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text

from app.api.deps import get_current_user
from app.core.database import SessionLocal
from app.core.security import AuthorizationError, get_http_exception_for_error
from app.content import bumpContentVersion

router = APIRouter(prefix="/api/v1/site", tags=["site"])


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
        data["created_at"] = data["created_at"].isoformat()
    if data.get("updated_at"):
        data["updated_at"] = data["updated_at"].isoformat()
    # Convert Decimal to float
    decimal_fields = ["prix", "surface", "superficie", "prix_vente"]
    for field in decimal_fields:
        if data.get(field):
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
    id: str | None = None
    lot_id: str | None = None
    property_id: str | None = None
    titre: str | None = None
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
    statut: str | None = None
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


@router.get("/realisations", response_model=list[SiteRealisationRow])
def list_realisations() -> list[SiteRealisationRow]:
    try:
        with SessionLocal() as session:
            rows = session.execute(
                text("""
                    SELECT id, reference, titre, description, description_courte, type_realisation, statut,
                           localisation, ville, surface, budget_previsionnel, budget_reel,
                           date_debut, date_fin_prevue, date_fin_reelle, chef_projet_id,
                           equipe, photos, documents, publier_vitrine, ordre_affichage, tags,
                           metadata_json, created_at, updated_at
                    FROM site_realisations
                    ORDER BY ordre_affichage, created_at DESC
                """)
            ).fetchall()
        logging.info(f"Found {len(rows)} realisations")
        return [convert_realisation_row(row) for row in rows]
    except Exception as e:
        logging.error(f"Error fetching realisations: {e}")
        return []


@router.get("/realisations/{item_id}", response_model=SiteRealisationRow)
def get_realisation(item_id: str) -> SiteRealisationRow:
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
    current_user: dict[str, Any] = Depends(get_current_user),
) -> SiteRealisationRow:
    try:
        if current_user.get("role") != "admin":
            raise AuthorizationError("Accès refusé")

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
    current_user: dict[str, Any] = Depends(get_current_user),
) -> SiteRealisationRow:
    try:
        if current_user.get("role") != "admin":
            raise AuthorizationError("Accès refusé")

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
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, str]:
    try:
        if current_user.get("role") != "admin":
            raise AuthorizationError("Accès refusé")

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
                           caracteristiques, image_url, image_alt, contact_phone, contact_email,
                           publier_sur_vitrine, ordre_affichage, notes, created_by, updated_by,
                           created_at, updated_at
                    FROM vitrine_lots
                    ORDER BY ordre_affichage, created_at DESC
                """)
            ).fetchall()
        logging.info(f"Found {len(rows)} vitrine lots")
        return [convert_vitrine_lot_row(row) for row in rows]
    except Exception as e:
        logging.error(f"Error fetching vitrine lots: {e}")
        return []


@router.get("/vitrine-lots/{item_id}", response_model=VitrineLotRow)
def get_vitrine_lot(item_id: str) -> VitrineLotRow:
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
                {"item_id": item_id},
            ).fetchone()
        if row:
            return convert_vitrine_lot_row(row)
        raise HTTPException(status_code=404, detail="Lot non trouvé")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=404, detail="Lot non trouvé")


@router.post("/vitrine-lots", response_model=VitrineLotRow)
def create_vitrine_lot(
    payload: VitrineLotRow,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> VitrineLotRow:
    try:
        if current_user.get("role") != "admin":
            raise AuthorizationError("Accès refusé")

        from uuid import uuid4
        from datetime import datetime

        lot_id = str(uuid4())
        now = datetime.now()

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
                    "lot_id": payload.lot_id,
                    "property_id": payload.property_id,
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
    item_id: str,
    payload: VitrineLotRow,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> VitrineLotRow:
    try:
        # Sécurisation : vérification robuste de l'utilisateur et du rôle
        if not current_user or current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Accès refusé : droits admin requis")

        from datetime import datetime

        with SessionLocal() as session:
            fields = payload.model_dump(exclude_unset=True, exclude={"id", "created_at", "updated_at"})
            if not fields:
                raise HTTPException(status_code=400, detail="Aucun champ à mettre à jour")

            fields["updated_at"] = datetime.now()
            fields["updated_by"] = current_user.get("id")

            set_clause = ", ".join(f"{key} = :{key}" for key in fields.keys())
            session.execute(
                text(f"UPDATE vitrine_lots SET {set_clause} WHERE id = :item_id"),
                {**fields, "item_id": item_id},
            )
            session.commit()

            # Note: Assurez-vous que bumpContentVersion() est bien importé et défini
            try:
                bumpContentVersion()
            except NameError:
                pass  # Fallback si la fonction n'est pas disponible

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
                {"item_id": item_id}
            ).mappings().first()

            if not row:
                raise HTTPException(status_code=404, detail="Lot vitrine non trouvé")

            return VitrineLotRow(**row)

    except HTTPException:
        raise  # Laisser passer les HTTPException (400, 403, 404)
    except Exception as exc:
        # Log l'erreur réelle avant de la masquer
        import logging
        logging.error(f"Erreur update_vitrine_lot: {str(exc)}")
        raise HTTPException(status_code=500, detail="Erreur interne lors de la mise à jour") from exc


@router.delete("/vitrine-lots/{item_id}")
def delete_vitrine_lot(
    item_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, str]:
    try:
        if current_user.get("role") != "admin":
            raise AuthorizationError("Accès refusé")

        with SessionLocal() as session:
            result = session.execute(
                text("DELETE FROM vitrine_lots WHERE id = :item_id"),
                {"item_id": item_id},
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
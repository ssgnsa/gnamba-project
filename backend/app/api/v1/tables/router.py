from __future__ import annotations

import time
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.antispam import public_form_limiter
from app.repositories.generic_table_repository import GenericTableRepository
from app.api.deps import get_current_user, get_optional_current_user
from app.api.deps import enforce_permission

router = APIRouter(prefix="/api/v1/tables", tags=["tables"])

TABLES: dict[str, tuple[str, dict[str, str], dict[str, Any], dict[str, str] | None, bool]] = {
    "tasks": (
        "tasks",
        {
            "titre": "TEXT",
            "description": "TEXT",
            "statut": "TEXT",
            "priorite": "TEXT",
            "date_debut": "TEXT",
            "date_echeance": "TEXT",
            "employee_id": "TEXT",
            "project_id": "TEXT",
        },
        {"statut": "a_faire", "priorite": "moyenne"},
        None,
        True,  # skip_ensure_table - managed by Alembic migration 009
    ),
    "taches": (
        "tasks",
        {
            "titre": "TEXT",
            "description": "TEXT",
            "statut": "TEXT",
            "priorite": "TEXT",
            "date_debut": "TEXT",
            "date_echeance": "TEXT",
            "employee_id": "TEXT",
            "project_id": "TEXT",
        },
        {"statut": "a_faire", "priorite": "moyenne"},
        None,
        True,  # skip_ensure_table - managed by Alembic migration 009 (alias for tasks)
    ),
    "properties": (
        "properties",
        {
            "type_bien": "TEXT",
            "adresse": "TEXT",
            "proprietaire": "TEXT",
            "valeur": "REAL",
            "loyer_mensuel": "REAL",
            "statut": "TEXT",
            "description": "TEXT",
            "cover_image_url": "TEXT",
        },
        {"statut": "disponible", "valeur": 0, "loyer_mensuel": 0},
        None,
        True,  # skip_ensure_table - managed by Alembic migration 007
    ),
    "lease_contracts": (
        "lease_contracts",
        {
        },
        {},
        None,
        True,  # skip_ensure_table - managed by Alembic migration 007
    ),
    "rent_payments": (
        "rent_payments",
        {
            "locataire_id": "TEXT",
            "property_id": "TEXT",
            "contract_id": "TEXT",
            "montant": "REAL",
            "date_paiement": "TEXT",
            "date_echeance": "TEXT",
            "mois_concerne": "TEXT",
            "mode_paiement": "TEXT",
            "statut": "TEXT",
            "notes": "TEXT",
            "reference": "TEXT",
        },
        {"statut": "en_attente", "montant": 0},
        None,
        True,  # skip_ensure_table - managed by Alembic migration 007
    ),
    "documents": (
        "documents",
        {
            "nom": "TEXT",
            "type_document": "TEXT",
            "url": "TEXT",
            "project_id": "TEXT",
            "description": "TEXT",
            "taille": "REAL",
            "mime_type": "TEXT",
        },
        {},
        None,
        True,  # skip_ensure_table - managed by Alembic migration 011
    ),
    "contact_messages": (
        "contact_messages",
        {
            "nom": "TEXT",
            "email": "TEXT",
            "telephone": "TEXT",
            "sujet": "TEXT",
            "message": "TEXT",
            "statut": "TEXT",
            "type_demande": "TEXT",
            "assigne_a": "TEXT",
            "reponse": "TEXT",
            "date_reponse": "TEXT",
            "ip_address": "TEXT",
            "user_agent": "TEXT",
            "metadata_json": "JSONB",
            "created_at": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
            "updated_at": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
            # Aliases pour compatibilité frontend (name/phone/subject) - CHAMP FRONTEND → CHAMP BACKEND
            "name": "TEXT",       # alias pour nom
            "phone": "TEXT",      # alias pour telephone
            "subject": "TEXT",    # alias pour sujet
        },
        {"statut": "nouveau"},
        # Mapping des alias frontend vers colonnes base de données
        {"name": "nom", "phone": "telephone", "subject": "sujet"},
        True,  # skip_ensure_table - managed by Alembic migration 012
    ),
    "page_layouts": (
        "page_layouts",
        {
            "page_key": "TEXT",
            "page_name": "TEXT",
            "layout_json": "JSONB",
            "is_active": "BOOLEAN",
            "seo_title": "TEXT",
            "seo_description": "TEXT",
            "seo_keywords": "TEXT[]",
            "og_image_media_id": "UUID",
        },
        {"is_active": True},
        None,
        True,  # skip_ensure_table - managed by Alembic migration
    ),
    "site_realisations": (
        "site_realisations",
        {
            "reference": "TEXT",
            "titre": "TEXT",
            "description": "TEXT",
            "description_courte": "TEXT",
            "type_realisation": "TEXT",
            "statut": "TEXT",
            "localisation": "TEXT",
            "ville": "TEXT",
            "surface": "REAL",
            "budget_previsionnel": "REAL",
            "budget_reel": "REAL",
            "date_debut": "TEXT",
            "date_fin_prevue": "TEXT",
            "date_fin_reelle": "TEXT",
            "chef_projet_id": "TEXT",
            "equipe": "JSONB",
            "photos": "JSONB",
            "documents": "JSONB",
            "publier_vitrine": "BOOLEAN",
            "ordre_affichage": "INTEGER",
            "tags": "TEXT[]",
            "metadata_json": "JSONB",
        },
        {"statut": "en_cours", "publier_vitrine": True, "ordre_affichage": 0},
        None,
        True,  # skip_ensure_table - managed by Alembic migration 012
    ),
    "vitrine_lots": (
        "vitrine_lots",
        {
            "lot_id": "UUID",
            "property_id": "UUID",
            "titre": "VARCHAR(255)",
            "description": "TEXT",
            "prix": "NUMERIC(12,2)",
            "surface": "NUMERIC(10,2)",
            "localisation": "TEXT",
            "photos": "JSON",
            "publier": "BOOLEAN",
            "ordre": "INTEGER",
            "tags": "TEXT[]",
            # Champs VitrineLot frontend (aligné migration 012 + type VitrineLot)
            "reference": "TEXT",
            "village": "TEXT",
            "quartier": "TEXT",
            "commune": "TEXT",
            "departement": "TEXT",
            "region": "TEXT",
            "superficie": "NUMERIC(10,2)",
            "prix_vente": "NUMERIC(12,2)",
            "statut": "VARCHAR(50)",
            "documents": "TEXT",
            "caracteristiques": "TEXT[]",
            "image_url": "TEXT",
            "image_alt": "TEXT",
            "contact_phone": "TEXT",
            "contact_email": "TEXT",
            "publier_sur_vitrine": "BOOLEAN",
            "ordre_affichage": "INTEGER",
            "notes": "TEXT",
            "created_by": "TEXT",
            "updated_by": "TEXT",
        },
        {"statut": "disponible", "publier": True, "ordre": 0, "publier_sur_vitrine": True},
        None,
        True,  # skip_ensure_table - managed by Alembic migration 012
    ),
    "messages_direction": (
        "messages_direction",
        {
            "titre": "TEXT",
            "contenu": "TEXT",
            "statut": "TEXT",
            "priorite": "TEXT",
            "destinataire_id": "TEXT",
            "expediteur_id": "TEXT",
            "date_envoi": "TEXT",
        },
        {"statut": "non_lu", "priorite": "normale"},
        None,
        True,  # skip_ensure_table - managed by Alembic migration 009
    ),
    "employes_presence": (
        "employes_presence",
        {
            "employee_id": "TEXT",
            "statut": "TEXT",
            "last_activity": "TEXT",
            "latitude": "REAL",
            "longitude": "REAL",
        },
        {"statut": "hors_ligne"},
        None,
        True,  # skip_ensure_table - managed by Alembic migration 009
    ),
    "visites_en_cours": (
        "visites_en_cours",
        {
            "visite_id": "TEXT",
            "client_nom": "TEXT",
            "client_telephone": "TEXT",
            "lot_id": "TEXT",
            "date_debut": "TEXT",
            "date_fin": "TEXT",
            "statut": "TEXT",
        },
        {"statut": "en_cours"},
        None,
        True,  # skip_ensure_table - managed by Alembic migration 013
    ),
    "activites_journal": (
        "activites_journal",
        {
            "titre": "TEXT",
            "description": "TEXT",
            "type": "TEXT",
            "employee_id": "TEXT",
            "date": "TEXT",
            "statut": "TEXT",
        },
        {"statut": "planifie"},
        None,
        True,  # skip_ensure_table - managed by Alembic migration 013
    ),
    "stats_journalieres": (
        "stats_journalieres",
        {
            "date": "TEXT",
            "visites": "INTEGER",
            "contacts": "INTEGER",
            "ventes": "INTEGER",
            "chiffre_affaires": "REAL",
        },
        {"visites": 0, "contacts": 0, "ventes": 0, "chiffre_affaires": 0},
        None,
        True,  # skip_ensure_table - managed by Alembic migration 013
    ),
    "site_content": (
        "site_content",
        {
            "section": "TEXT",
            "key": "TEXT",
            "value": "TEXT",
            "value_type": "TEXT",
            "description": "TEXT",
            "is_translatable": "BOOLEAN",
            "translations": "JSONB",
        },
        {"value_type": "text", "is_translatable": False},
        None,
        True,  # skip_ensure_table - managed by Alembic migration 012
    ),
    "visiteurs": (
        "visiteurs",
        {
            "nom": "TEXT",
            "telephone": "TEXT",
            "email": "TEXT",
            "societe": "TEXT",
            "motif": "TEXT",
            "date_arrivee": "TEXT",
            "statut": "TEXT",
        },
        {"statut": "attendu"},
        None,
        True,  # skip_ensure_table - managed by Alembic migration 013
    ),
    "visites_du_jour": (
        "visites_du_jour",
        {
            "client_nom": "TEXT",
            "client_telephone": "TEXT",
            "lot_id": "TEXT",
            "date_arrivee": "TEXT",
            "heure_arrivee": "TEXT",
            "statut": "TEXT",
        },
        {"statut": "planifiee"},
        None,
        True,  # skip_ensure_table - managed by Alembic migration 013
    ),
    "lead_campaigns": (
        "lead_campaigns",
        {
            "nom": "TEXT",
            "description": "TEXT",
            "budget": "REAL",
            "date_debut": "TEXT",
            "date_fin": "TEXT",
            "statut": "TEXT",
        },
        {"statut": "active"},
        None,
        True,  # skip_ensure_table - managed by Alembic migration 008
    ),
    "lead_interactions": (
        "lead_interactions",
        {
            "campaign_id": "TEXT",
            "lead_id": "TEXT",
            "type": "TEXT",
            "contenu": "TEXT",
            "date": "TEXT",
            "resultat": "TEXT",
        },
        {},
        None,
        True,  # skip_ensure_table - managed by Alembic migration 008
    ),
    "parties": (
        "parties",
        {
            "type": "TEXT",
            "nom": "TEXT",
            "prenom": "TEXT",
            "nom_entreprise": "TEXT",
            "cni_numero": "TEXT",
            "cni_date": "TEXT",
            "cni_lieu": "TEXT",
            "telephone": "TEXT",
            "email": "TEXT",
            "adresse": "TEXT",
            "profession": "TEXT",
            "employeur": "TEXT",
            "naissance_date": "TEXT",
            "naissance_lieu": "TEXT",
            "nationalite": "TEXT",
            "actif": "BOOLEAN",
            "created_by": "TEXT",
            "updated_by": "TEXT",
        },
        {"type": "particulier", "actif": True},
        None,
        True,  # skip_ensure_table - managed by Alembic migration 017
    ),
    "party_roles": (
        "party_roles",
        {
            "party_id": "TEXT NOT NULL",
            "role_type": "TEXT NOT NULL",
            "reference_id": "TEXT",
        },
        {},
        None,
        True,  # skip_ensure_table - managed by Alembic migration 008
    ),
    "party_lead_details": (
        "party_lead_details",
        {
            "party_id": "TEXT NOT NULL",
            "lead_id": "TEXT NOT NULL",
            "role": "TEXT",
        },
        {"role": "contact_principal"},
        None,
        True,  # skip_ensure_table - managed by Alembic migration 008
    ),
    "leads": (
        "leads",
        {
            "last_name": "TEXT",
            "first_name": "TEXT",
            "phone": "TEXT",
            "email": "TEXT",
            "source": "TEXT",
            "campagne_id": "TEXT",
            "statut": "TEXT",
            "assigned_to": "TEXT",
            "notes": "TEXT",
        },
        {"statut": "nouveau"},
    ),
    "lead_campaigns": (
        "lead_campaigns",
        {
            "nom": "TEXT NOT NULL",
            "description": "TEXT",
            "budget": "REAL",
            "date_debut": "TEXT",
            "date_fin": "TEXT",
            "statut": "TEXT",
        },
        {"statut": "planifie"},
    ),
    "lead_captures": (
        "lead_captures",
        {
            "phone": "TEXT NOT NULL",
            "first_name": "TEXT",
            "last_name": "TEXT",
            "email": "TEXT",
            "source": "TEXT",
            "source_page": "TEXT",
            "source_form": "TEXT",
            "consent_text": "TEXT",
            "channels_optin": "TEXT",
        },
        {"source": "web_form"},
        None,
        True,  # skip_ensure_table - managed by Alembic migration 008
    ),
    "lead_interactions": (
        "lead_interactions",
        {
            "campaign_id": "TEXT",
            "lead_id": "TEXT",
            "type": "TEXT",
            "contenu": "TEXT",
            "date": "TEXT",
            "resultat": "TEXT",
        },
        {},
        None,
        True,  # skip_ensure_table - managed by Alembic migration 008
    ),
    "media_files": (
        "media_files",
        {
            "filename": "TEXT NOT NULL",
            "storage_key": "TEXT",
            "original_name": "TEXT",
            "url": "TEXT",
            "thumbnail_url": "TEXT",
            "category": "TEXT",
            "uploaded_by": "TEXT",
            "upload_date": "TEXT",
            "size": "INTEGER",
            "type": "TEXT",
            "alt_text": "TEXT",
            "description": "TEXT",
            "tags": "TEXT",
            "is_brand_asset": "BOOLEAN",
            "brand_asset_type": "TEXT",
            "deleted_at": "TEXT",
            "deleted_by": "TEXT",
            "width": "INTEGER",
            "height": "INTEGER",
        },
        {"category": "autre", "is_brand_asset": False},
        None,
        True,  # skip_ensure_table - managed by Alembic migration 011
    ),
    "media_versions": (
        "media_versions",
        {
            "media_id": "TEXT NOT NULL",
            "version_number": "INTEGER",
            "old_url": "TEXT",
            "old_filename": "TEXT",
            "replaced_at": "TEXT",
            "replaced_by": "TEXT",
        },
        {"version_number": 1},
        None,
        True,  # skip_ensure_table - managed by Alembic migration 011
    ),
    "media_usage": (
        "media_usage",
        {
            "media_id": "TEXT NOT NULL",
            "entity_type": "TEXT NOT NULL",
            "entity_id": "TEXT",
            "usage_type": "TEXT NOT NULL",
            "label": "TEXT",
        },
        {},
        None,
        True,  # skip_ensure_table - managed by Alembic migration 011
    ),
    "media_audit_logs": (
        "media_audit_logs",
        {
            "media_id": "TEXT",
            "action": "TEXT NOT NULL",
            "actor_id": "TEXT",
            "metadata": "TEXT",
        },
        {},
        None,
        True,  # skip_ensure_table - managed by Alembic migration 011
    ),
    "app_settings": (
        "app_settings",
        {
            "id": "UUID PRIMARY KEY",
            "key": "TEXT UNIQUE NOT NULL",
            "value": "JSONB NOT NULL",
            "value_type": "TEXT DEFAULT 'json'",
            "category": "TEXT DEFAULT 'general'",
            "description": "TEXT",
            "is_public": "BOOLEAN DEFAULT FALSE",
            "is_editable": "BOOLEAN DEFAULT TRUE",
            "validation_schema": "JSONB",
            "default_value": "JSONB",
            "created_at": "TIMESTAMPTZ DEFAULT NOW()",
            "updated_at": "TIMESTAMPTZ DEFAULT NOW()",
        },
        {},
        None,
        True,  # skip_ensure_table - managed by Alembic migration 014/021
    ),
    "user_profiles": (
        "user_profiles",
        {
            "id": "UUID PRIMARY KEY",
            "user_id": "UUID UNIQUE NOT NULL",
            "avatar_media_id": "UUID",
            "theme": "TEXT DEFAULT 'light'",
            "language": "TEXT DEFAULT 'fr'",
            "timezone": "TEXT DEFAULT 'Africa/Abidjan'",
            "date_format": "TEXT DEFAULT 'DD/MM/YYYY'",
            "notifications_email": "BOOLEAN DEFAULT TRUE",
            "notifications_push": "BOOLEAN DEFAULT TRUE",
            "notifications_sms": "BOOLEAN DEFAULT FALSE",
            "dashboard_layout": "JSONB DEFAULT '{}'",
            "sidebar_collapsed": "BOOLEAN DEFAULT FALSE",
            "preferences": "JSONB DEFAULT '{}'",
            "last_login_at": "TIMESTAMPTZ",
            "last_login_ip": "INET",
            "login_count": "INTEGER DEFAULT 0",
            "created_at": "TIMESTAMPTZ DEFAULT NOW()",
            "updated_at": "TIMESTAMPTZ DEFAULT NOW()",
        },
        {},
        None,
        True,  # skip_ensure_table - managed by Alembic migration 014
    ),
    "visites_terrain": (
        "visites_terrain",
        {
            "lead_id": "TEXT",
            "date_visite": "TEXT",
            "agent_id": "TEXT",
            "notes": "TEXT",
        },
        {},
        None,
        True,  # skip_ensure_table - managed by Alembic migration 006/018
    ),
    "ventes_foncieres": (
        "ventes_foncieres",
        {
            "lot_id": "TEXT",
            "client_id": "TEXT",
            "prix": "REAL",
            "statut": "TEXT",
            "date_vente": "TEXT",
        },
        {"statut": "en_cours"},
        None,
        True,  # skip_ensure_table - managed by Alembic migration 006
    ),
    "campagnes_marketing": (
        "campagnes_marketing",
        {
            "nom": "TEXT",
            "description": "TEXT",
            "budget": "REAL",
            "date_debut": "TEXT",
            "date_fin": "TEXT",
            "statut": "TEXT",
        },
        {"statut": "planifie"},
    ),
    "visites": (
        "visites",
        {
            "client_nom": "TEXT",
            "client_telephone": "TEXT",
            "lot_id": "TEXT",
            "date_arrivee": "TEXT",
            "statut": "TEXT",
        },
        {"statut": "planifiee"},
    ),
    "opportunites": (
        "opportunites",
        {
            "nom": "TEXT",
            "description": "TEXT",
            "montant": "REAL",
            "statut": "TEXT",
        },
        {"statut": "nouvelle"},
    ),
    "social_posts": (
        "social_posts",
        {
            "platform": "TEXT",
            "content": "TEXT",
            "status": "TEXT",
            "scheduled_at": "TEXT",
        },
        {"status": "draft"},
    ),
}

ADMIN_TABLES = {
    "site_content", "page_layouts", "site_realisations", "vitrine_lots",
    "contact_messages", "media_files", "media_versions", "media_usage",
    "media_audit_logs",
}


def _repository(table: str, db: Session) -> GenericTableRepository:
    config = TABLES.get(table)
    if not config:
        raise HTTPException(status_code=404, detail="Table non exposée par l'API locale")
    table_name, columns, defaults = config[:3]
    field_mapping = config[3] if len(config) > 3 else {}
    skip_ensure_table = config[4] if len(config) > 4 else False
    return GenericTableRepository(db, table_name, columns, defaults, field_mapping, skip_ensure_table=skip_ensure_table)


def _canonical_vitrine_lot_uuid(value: Any, field_name: str) -> str:
    if not isinstance(value, str):
        raise HTTPException(status_code=422, detail=f"{field_name} doit être un UUID valide")
    try:
        return str(UUID(value))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=f"{field_name} doit être un UUID valide") from exc


@router.get("/{table}")
def list_rows(
    table: str,
    request: Request,
    limit: int = Query(default=100, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> list[dict[str, Any]]:
    repository = _repository(table, db)
    enforce_permission(current_user, "erp_table", "read", resource=table)

    rows, _total = repository.list_paginated(
        order_by=request.query_params.get("order_by") or "created_at",
        descending=request.query_params.get("ascending") != "true",
        limit=limit,
        offset=offset,
    )
    for key, value in request.query_params.items():
        if key in {"order_by", "ascending", "limit", "offset"}:
            continue
        rows = [row for row in rows if str(row.get(key)) == value]
    return rows


@router.post("/{table}")
async def create_row(
    table: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] | None = Depends(get_optional_current_user),
) -> dict[str, Any]:
    payload = await request.json()
    if table == "contact_messages" and current_user is not None:
        raise HTTPException(status_code=403, detail="La création de messages est réservée au formulaire public")
    public_contact = table == "contact_messages" and current_user is None
    if public_contact:
        if not isinstance(payload, dict):
            raise HTTPException(status_code=422, detail="Objet JSON requis")
        allowed_fields = {
            "nom", "email", "telephone", "sujet", "message",
            "_website", "_form_started_at", "_consent",
        }
        if set(payload) - allowed_fields:
            raise HTTPException(status_code=422, detail="Champs non autorisés")
        if str(payload.get("_website") or "").strip():
            return {"status": "ok"}
        try:
            elapsed = time.time() - float(payload.get("_form_started_at"))
        except (TypeError, ValueError):
            elapsed = 0
        if elapsed < 2.5 or elapsed > 60 * 60 or payload.get("_consent") is not True:
            raise HTTPException(status_code=422, detail="Formulaire invalide")
        if not request.client or not request.client.host:
            raise HTTPException(status_code=429, detail="Soumission temporairement indisponible")
        if not public_form_limiter.allow(
            request.client.host,
            maximum=5,
            window_seconds=60 * 60,
        ):
            raise HTTPException(status_code=429, detail="Soumission temporairement indisponible")
        if not str(payload.get("email") or "").strip() or not str(payload.get("message") or "").strip():
            raise HTTPException(status_code=422, detail="Email et message requis")
        limits = {"nom": 255, "email": 255, "telephone": 50, "sujet": 255, "message": 10000}
        if any(len(str(payload.get(key) or "")) > maximum for key, maximum in limits.items()):
            raise HTTPException(status_code=422, detail="Un champ dépasse la taille autorisée")
        payload = {key: value for key, value in payload.items() if not key.startswith("_")}
    else:
        if current_user is None:
            raise HTTPException(status_code=401, detail="Authentification requise")
        enforce_permission(current_user, "erp_table", "create", resource=table)
    if table == "vitrine_lots":
        if not isinstance(payload, dict):
            raise HTTPException(status_code=422, detail="Un objet JSON est requis")
        for field_name in ("id", "lot_id", "property_id"):
            value = payload.get(field_name)
            if value is not None:
                payload[field_name] = _canonical_vitrine_lot_uuid(value, field_name)
    created = _repository(table, db).create(payload)
    return {"status": "ok"} if public_contact else created


@router.patch("/{table}/{row_id}")
async def update_row(
    table: str,
    row_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    enforce_permission(current_user, "erp_table", "update", resource=table)
    if table == "vitrine_lots":
        row_id = _canonical_vitrine_lot_uuid(row_id, "row_id")
    payload = await request.json()
    if table == "vitrine_lots" and isinstance(payload, dict):
        for field_name in ("id", "lot_id", "property_id"):
            value = payload.get(field_name)
            if value is not None:
                payload[field_name] = _canonical_vitrine_lot_uuid(value, field_name)
    updated = _repository(table, db).update(row_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Ligne introuvable")
    return updated


@router.delete("/{table}/{row_id}")
def delete_row(
    table: str,
    row_id: str,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, str]:
    enforce_permission(current_user, "erp_table", "delete", resource=table)
    if table == "vitrine_lots":
        row_id = _canonical_vitrine_lot_uuid(row_id, "row_id")
    if not _repository(table, db).delete(row_id):
        raise HTTPException(status_code=404, detail="Ligne introuvable")
    return {"status": "ok", "message": "Ligne supprimée"}

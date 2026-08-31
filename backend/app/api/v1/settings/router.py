from __future__ import annotations

from typing import Any, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.security import AuthorizationError, get_http_exception_for_error
from app.schemas.settings import (
    SettingsRow,
    SettingsBulkRequest,
    SettingKeyRequest,
    SettingsResponse,
    SettingsAuditResponse,
    SettingsOperationResponse,
)
from app.services.settings_service import SettingsService

router = APIRouter(prefix="/api/v1/settings", tags=["settings"])


# ==============================================================================
# Dependency Factory
# ==============================================================================

def get_settings_service(db: Session = Depends(get_db)) -> SettingsService:
    """Get the settings application service."""
    return SettingsService(db)


# ==============================================================================
# Helpers
# ==============================================================================

def _get_user_id(current_user: dict[str, Any]) -> str:
    """Extrait l'ID utilisateur depuis current_user"""
    user_id_str = current_user.get("id") or current_user.get("sub")
    if not user_id_str:
        raise AuthorizationError("Utilisateur non identifié")
    return user_id_str


def _check_admin(current_user: dict[str, Any]) -> None:
    """Vérifie que l'utilisateur est admin"""
    if current_user.get("role") != "admin":
        raise AuthorizationError("Accès refusé: rôle admin requis")


# ==============================================================================
# Routes - Lecture
# ==============================================================================

@router.get("", response_model=List[SettingsResponse])
def list_settings(
    service: SettingsService = Depends(get_settings_service),
) -> List[SettingsResponse]:
    """Liste tous les paramètres d'application"""
    try:
        return service.get_all_settings()
    except Exception as exc:
        raise get_http_exception_for_error(exc) from exc


@router.get("/public", response_model=List[SettingsResponse])
def list_public_settings(
    service: SettingsService = Depends(get_settings_service),
) -> List[SettingsResponse]:
    """Liste uniquement les paramètres publics (is_public=true)"""
    try:
        return service.get_public_settings()
    except Exception as exc:
        raise get_http_exception_for_error(exc) from exc


@router.get("/category/{category}", response_model=List[SettingsResponse])
def list_settings_by_category(
    category: str,
    service: SettingsService = Depends(get_settings_service),
) -> List[SettingsResponse]:
    """Liste les paramètres par catégorie"""
    try:
        return service.get_settings_by_category(category)
    except Exception as exc:
        raise get_http_exception_for_error(exc) from exc


@router.get("/frontend", response_model=dict[str, str])
def get_settings_for_frontend(
    service: SettingsService = Depends(get_settings_service),
) -> dict[str, str]:
    """Retourne les paramètres dans le format attendu par le frontend (BrandSettings)"""
    try:
        return service.get_settings_for_frontend()
    except Exception as exc:
        raise get_http_exception_for_error(exc) from exc


@router.get("/whitelist", response_model=dict)
def get_settings_whitelist(
    service: SettingsService = Depends(get_settings_service),
) -> dict:
    """Retourne la whitelist des clés autorisées avec leur configuration"""
    try:
        return service.get_whitelist()
    except Exception as exc:
        raise get_http_exception_for_error(exc) from exc


@router.get("/audit", response_model=List[SettingsAuditResponse])
def list_settings_audit(
    limit: int = Query(50, ge=1, le=500),
    service: SettingsService = Depends(get_settings_service),
) -> List[SettingsAuditResponse]:
    """Récupère l'historique d'audit des paramètres"""
    try:
        return service.get_audit_log(limit)
    except Exception as exc:
        raise get_http_exception_for_error(exc) from exc


@router.get("/{key}", response_model=SettingsResponse)
def get_setting(
    key: str,
    service: SettingsService = Depends(get_settings_service),
) -> SettingsResponse:
    """Récupère un paramètre par sa clé"""
    try:
        result = service.get_setting(key)
        if result is None:
            raise HTTPException(status_code=404, detail="Setting not found")
        return result
    except HTTPException:
        raise
    except Exception as exc:
        raise get_http_exception_for_error(exc) from exc


# ==============================================================================
# Routes - Écriture
# ==============================================================================

@router.post("", response_model=SettingsOperationResponse)
def upsert_settings(
    payload: SettingsBulkRequest | SettingKeyRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
    service: SettingsService = Depends(get_settings_service),
) -> SettingsOperationResponse:
    """
    Crée ou met à jour des paramètres.
    Supporte deux formats:
    - Bulk: { "items": [{ "key": "...", "value": "..." }, ...] }
    - Single: { "key": "...", "value": "..." }
    """
    try:
        _check_admin(current_user)
        user_id = _get_user_id(current_user)

        # Normaliser la payload en liste d'items
        items: List[dict[str, Any]] = []
        if hasattr(payload, 'items') and payload.items is not None:
            # Format bulk: SettingsBulkRequest
            items = [{"key": item.key, "value": item.value} for item in payload.items]
        elif hasattr(payload, 'key'):
            # Format single: SettingKeyRequest
            items = [{"key": payload.key, "value": payload.value or ""}]
        elif isinstance(payload, dict):
            if 'key' in payload and 'items' not in payload:
                items = [{"key": payload['key'], "value": payload.get('value') or ""}]
            elif 'items' in payload and payload['items'] is not None:
                items = [{"key": item['key'], "value": item.get('value')} for item in payload['items']]

        if not items:
            raise HTTPException(status_code=400, detail="Aucun paramètre fourni")

        # Sauvegarder via le service (validation + audit)
        service.upsert_settings_bulk(items, user_id)

        return SettingsOperationResponse(
            status="ok",
            message="Paramètres sauvegardés"
        )
    except AuthorizationError as exc:
        raise get_http_exception_for_error(exc) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise get_http_exception_for_error(exc) from exc


@router.delete("/{key}", response_model=SettingsOperationResponse)
def delete_setting(
    key: str,
    current_user: dict[str, Any] = Depends(get_current_user),
    service: SettingsService = Depends(get_settings_service),
) -> SettingsOperationResponse:
    """Supprime un paramètre"""
    try:
        _check_admin(current_user)
        user_id = _get_user_id(current_user)

        success = service.delete_setting(key, user_id)
        if not success:
            raise HTTPException(status_code=404, detail="Setting not found")

        return SettingsOperationResponse(
            status="ok",
            message="Paramètre supprimé"
        )
    except AuthorizationError as exc:
        raise get_http_exception_for_error(exc) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise get_http_exception_for_error(exc) from exc



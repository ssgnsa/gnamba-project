# Settings Schemas - Pydantic
# Schémas pour l'API settings

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from uuid import UUID


# ============================================
# SCHÉMAS DE REQUÊTE
# ============================================

class SettingsRow(BaseModel):
    """Ligne de paramètre pour requête bulk"""
    key: str = Field(..., min_length=1, max_length=100)
    value: Any = None
    value_type: str = "json"
    category: str = "general"
    description: Optional[str] = None
    is_public: bool = False
    is_editable: bool = True
    validation_schema: Optional[Dict[str, Any]] = None
    default_value: Optional[Any] = None


class SettingsBulkRequest(BaseModel):
    """Requête bulk pour upsert multiple"""
    items: List[SettingsRow]


class SettingKeyRequest(BaseModel):
    """Requête pour upsert single"""
    key: str = Field(..., min_length=1, max_length=100)
    value: Any = None


class SettingsCreate(BaseModel):
    """Création d'un paramètre"""
    key: str = Field(..., min_length=1, max_length=100)
    value: Any
    value_type: str = "json"
    category: str = "general"
    description: Optional[str] = None
    is_public: bool = False
    is_editable: bool = True
    validation_schema: Optional[Dict[str, Any]] = None
    default_value: Optional[Any] = None


class SettingsUpdate(BaseModel):
    """Mise à jour d'un paramètre"""
    value: Any = None
    value_type: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None
    is_editable: Optional[bool] = None
    validation_schema: Optional[Dict[str, Any]] = None
    default_value: Optional[Any] = None


# ============================================
# SCHÉMAS DE RÉPONSE
# ============================================

class SettingsResponse(BaseModel):
    """Réponse pour un paramètre"""
    key: str
    value: Any
    value_type: str
    category: str
    description: Optional[str] = None
    is_public: bool
    is_editable: bool
    validation_schema: Optional[Dict[str, Any]] = None
    default_value: Optional[Any] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class SettingsAuditResponse(BaseModel):
    """Réponse pour l'audit"""
    id: str
    setting_key: str
    old_value: Any = None
    new_value: Any = None
    changed_by: Optional[str] = None
    changed_at: Optional[str] = None
    action: str


class SettingsWhitelistResponse(BaseModel):
    """Réponse pour la whitelist"""
    key: str
    category: str
    value_type: str
    description: str
    is_public: bool
    validation_schema: Optional[Dict[str, Any]] = None


# ============================================
# TYPE POUR VALEUR
# ============================================

class SettingValueType(BaseModel):
    """Type de valeur pour validation"""
    type: str  # string, number, integer, boolean, object, array
    format: Optional[str] = None  # email, uri, date-time, etc.
    pattern: Optional[str] = None
    minLength: Optional[int] = None
    maxLength: Optional[int] = None
    minimum: Optional[float] = None
    maximum: Optional[float] = None
    enum: Optional[List[Any]] = None


# ============================================
# RÉPONSES API STANDARDS
# ============================================

class SettingsOperationResponse(BaseModel):
    """Réponse standard pour opérations settings"""
    status: str = "ok"
    message: str
    data: Optional[Dict[str, Any]] = None


class SettingsErrorResponse(BaseModel):
    """Réponse d'erreur"""
    status: str = "error"
    message: str
    details: Optional[List[str]] = None
# Settings Service - Couche métier pour la gestion des paramètres
# Fournit validation, whitelist, audit et logique métier

from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.orm import Session
from jsonschema import validate, ValidationError as JsonSchemaValidationError

from app.repositories.settings_repository import SettingsRepository
from app.schemas.settings import (
    SettingsCreate,
    SettingsUpdate,
    SettingsBulkRequest,
    SettingsResponse,
    SettingsAuditResponse,
    SettingsRow,
)


# ============================================
# WHITELIST DES CLÉS AUTORISÉES
# ============================================
# Ces clés correspondent aux champs BrandSettings du frontend
# Seules ces clés peuvent être modifiées via l'API

ALLOWED_SETTINGS_KEYS = {
    # Branding général
    "app_title": {
        "category": "branding",
        "value_type": "string",
        "description": "Titre de l'application",
        "is_public": True,
        "validation_schema": {"type": "string", "minLength": 1, "maxLength": 100},
    },
    "app_subtitle": {
        "category": "branding",
        "value_type": "string",
        "description": "Sous-titre de l'application",
        "is_public": True,
        "validation_schema": {"type": "string", "maxLength": 200},
    },
    "app_company": {
        "category": "branding",
        "value_type": "string",
        "description": "Nom de l'entreprise",
        "is_public": True,
        "validation_schema": {"type": "string", "maxLength": 100},
    },
    # Couleurs
    "primary_color": {
        "category": "branding",
        "value_type": "string",
        "description": "Couleur primaire (hex)",
        "is_public": True,
        "validation_schema": {"type": "string", "pattern": "^#[0-9a-fA-F]{6}$"},
    },
    "secondary_color": {
        "category": "branding",
        "value_type": "string",
        "description": "Couleur secondaire (hex)",
        "is_public": True,
        "validation_schema": {"type": "string", "pattern": "^#[0-9a-fA-F]{6}$"},
    },
    # Logo et assets
    "logo_url": {
        "category": "branding",
        "value_type": "string",
        "description": "URL du logo principal",
        "is_public": True,
    },
    "brand_logo_dark": {
        "category": "branding",
        "value_type": "string",
        "description": "URL du logo version sombre",
        "is_public": True,
    },
    "brand_favicon_url": {
        "category": "branding",
        "value_type": "string",
        "description": "URL du favicon",
        "is_public": True,
    },
    "brand_watermark_url": {
        "category": "branding",
        "value_type": "string",
        "description": "URL du watermark",
        "is_public": True,
    },
    # Contact
    "contact_address": {
        "category": "contact",
        "value_type": "string",
        "description": "Adresse de contact",
        "is_public": True,
    },
    "contact_phone": {
        "category": "contact",
        "value_type": "string",
        "description": "Téléphone de contact",
        "is_public": True,
        "validation_schema": {"type": "string", "pattern": "^[+0-9\\s\\-]{8,20}$"},
    },
    "contact_email": {
        "category": "contact",
        "value_type": "string",
        "description": "Email de contact",
        "is_public": True,
        "validation_schema": {"type": "string", "format": "email"},
    },
    "contact_hours": {
        "category": "contact",
        "value_type": "string",
        "description": "Heures d'ouverture",
        "is_public": True,
    },
    # Réseaux sociaux
    "social_facebook": {
        "category": "social",
        "value_type": "string",
        "description": "URL Facebook",
        "is_public": True,
        "validation_schema": {"type": "string", "format": "uri"},
    },
    "social_youtube": {
        "category": "social",
        "value_type": "string",
        "description": "URL YouTube",
        "is_public": True,
        "validation_schema": {"type": "string", "format": "uri"},
    },
    "social_linkedin": {
        "category": "social",
        "value_type": "string",
        "description": "URL LinkedIn",
        "is_public": True,
        "validation_schema": {"type": "string", "format": "uri"},
    },
    "social_twitter": {
        "category": "social",
        "value_type": "string",
        "description": "URL Twitter/X",
        "is_public": True,
        "validation_schema": {"type": "string", "format": "uri"},
    },
    "social_instagram": {
        "category": "social",
        "value_type": "string",
        "description": "URL Instagram",
        "is_public": True,
        "validation_schema": {"type": "string", "format": "uri"},
    },
    "social_tiktok": {
        "category": "social",
        "value_type": "string",
        "description": "URL TikTok",
        "is_public": True,
        "validation_schema": {"type": "string", "format": "uri"},
    },
    # SEO
    "seo_description": {
        "category": "seo",
        "value_type": "string",
        "description": "Description SEO",
        "is_public": True,
        "validation_schema": {"type": "string", "maxLength": 160},
    },
    "seo_keywords": {
        "category": "seo",
        "value_type": "string",
        "description": "Mots-clés SEO",
        "is_public": True,
    },
    # Site vitrine
    "hero_background_url": {
        "category": "site",
        "value_type": "string",
        "description": "URL de l'image de fond du hero",
        "is_public": True,
    },
    # Immobilier
    "commission_rate": {
        "category": "immobilier",
        "value_type": "number",
        "description": "Taux de commission (pourcentage)",
        "is_public": True,
        "validation_schema": {"type": "number", "minimum": 0, "maximum": 100},
    },
    "rent_due_day": {
        "category": "immobilier",
        "value_type": "integer",
        "description": "Jour d'échéance du loyer (jour du mois)",
        "is_public": True,
        "validation_schema": {"type": "integer", "minimum": 1, "maximum": 31},
    },
}


def is_key_allowed(key: str) -> bool:
    """Vérifie si une clé est dans la whitelist"""
    return key in ALLOWED_SETTINGS_KEYS


def get_allowed_keys() -> Dict[str, Dict]:
    """Retourne la whitelist complète"""
    return ALLOWED_SETTINGS_KEYS


def get_key_config(key: str) -> Optional[Dict]:
    """Retourne la configuration d'une clé autorisée"""
    return ALLOWED_SETTINGS_KEYS.get(key)


# ============================================
# VALIDATION
# ============================================

def validate_setting_value(key: str, value: Any) -> Tuple[bool, Optional[str]]:
    """
    Valide une valeur de paramètre selon sa configuration.
    Retourne (is_valid, error_message).
    """
    config = get_key_config(key)
    if not config:
        return False, f"Clé non autorisée: {key}"

    schema = config.get("validation_schema")
    if not schema:
        return True, None

    try:
        validate(instance=value, schema=schema)
        return True, None
    except JsonSchemaValidationError as e:
        return False, f"Validation échouée pour {key}: {e.message}"


def validate_settings_bulk(items: List[Dict[str, Any]]) -> Tuple[bool, List[str]]:
    """
    Valide une liste de paramètres en bulk.
    Retourne (all_valid, list_of_errors).
    """
    errors = []
    for item in items:
        key = item.get("key")
        value = item.get("value")
        
        if not key:
            errors.append("Clé manquante dans un item")
            continue
            
        if not is_key_allowed(key):
            errors.append(f"Clé non autorisée: {key}")
            continue
            
        valid, error = validate_setting_value(key, value)
        if not valid:
            errors.append(error)
    
    return len(errors) == 0, errors


# ============================================
# SERVICE
# ============================================

class SettingsService:
    """
    Service centralisé pour la gestion des paramètres d'application.
    Fournit validation, audit, et logique métier.
    Remplace l'accès direct SQL dans le router.
    """

    def __init__(self, db: Session):
        self.db = db
        self.repo = SettingsRepository(db)

    # ============================================
    # LECTURE
    # ============================================

    def get_all_settings(self) -> List[SettingsResponse]:
        """Récupère tous les paramètres formatés pour l'API"""
        settings = self.repo.get_all()
        return [
            SettingsResponse(
                key=s.key,
                value=s.value,
                value_type=s.value_type,
                category=s.category,
                description=s.description,
                is_public=s.is_public,
                is_editable=s.is_editable,
                validation_schema=s.validation_schema,
                default_value=s.default_value,
                updated_at=s.updated_at,
            )
            for s in settings
        ]

    def get_setting(self, key: str) -> Optional[SettingsResponse]:
        """Récupère un paramètre par sa clé"""
        setting = self.repo.get_by_key(key)
        if not setting:
            return None
        return SettingsResponse(
            key=setting.key,
            value=setting.value,
            value_type=setting.value_type,
            category=setting.category,
            description=setting.description,
            is_public=setting.is_public,
            is_editable=setting.is_editable,
            validation_schema=setting.validation_schema,
            default_value=setting.default_value,
            updated_at=setting.updated_at,
        )

    def get_public_settings(self) -> List[SettingsResponse]:
        """Récupère uniquement les paramètres publics"""
        settings = self.repo.get_public_settings()
        return [
            SettingsResponse(
                key=s.key,
                value=s.value,
                value_type=s.value_type,
                category=s.category,
                description=s.description,
                is_public=s.is_public,
                is_editable=s.is_editable,
                validation_schema=s.validation_schema,
                default_value=s.default_value,
                updated_at=s.updated_at,
            )
            for s in settings
        ]

    def get_settings_by_category(self, category: str) -> List[SettingsResponse]:
        """Récupère les paramètres par catégorie"""
        settings = self.repo.get_by_category(category)
        return [
            SettingsResponse(
                key=s.key,
                value=s.value,
                value_type=s.value_type,
                category=s.category,
                description=s.description,
                is_public=s.is_public,
                is_editable=s.is_editable,
                validation_schema=s.validation_schema,
                default_value=s.default_value,
                updated_at=s.updated_at,
            )
            for s in settings
        ]

    def get_whitelist(self) -> Dict[str, Dict]:
        """Retourne la whitelist des clés autorisées avec leur config"""
        return ALLOWED_SETTINGS_KEYS

    # ============================================
    # ÉCRITURE
    # ============================================

    def upsert_setting(
        self,
        key: str,
        value: Any,
        user_id: UUID,
        value_type: str = "json",
        category: Optional[str] = None,
        description: Optional[str] = None,
        is_public: Optional[bool] = None,
        is_editable: Optional[bool] = None,
        validation_schema: Optional[Dict] = None,
        default_value: Optional[Any] = None,
    ) -> SettingsResponse:
        """
        Crée ou met à jour un paramètre unique.
        Valide la clé (whitelist) et la valeur (JSON Schema).
        Définit app.current_user_id pour l'audit trigger.
        """
        # Vérifier whitelist
        if not is_key_allowed(key):
            raise ValueError(f"Clé non autorisée: {key}. Clés autorisées: {list(ALLOWED_SETTINGS_KEYS.keys())}")

        # Récupérer config par défaut si non fournie
        config = get_key_config(key)
        if config:
            value_type = value_type or config.get("value_type", "json")
            category = category or config.get("category", "general")
            if description is None:
                description = config.get("description")
            if is_public is None:
                is_public = config.get("is_public", False)
            if is_editable is None:
                is_editable = config.get("is_editable", True)
            if validation_schema is None:
                validation_schema = config.get("validation_schema")
            if default_value is None:
                default_value = config.get("default_value")

        # Valider la valeur
        valid, error = validate_setting_value(key, value)
        if not valid:
            raise ValueError(error)

        # Sauvegarder via repository (setting app.current_user_id pour audit)
        setting = self.repo.upsert(
            key=key,
            value=value,
            value_type=value_type,
            category=category,
            description=description,
            is_public=is_public,
            is_editable=is_editable,
            validation_schema=validation_schema,
            default_value=default_value,
            user_id=user_id,
        )

        return SettingsResponse(
            key=setting.key,
            value=setting.value,
            value_type=setting.value_type,
            category=setting.category,
            description=setting.description,
            is_public=setting.is_public,
            is_editable=setting.is_editable,
            validation_schema=setting.validation_schema,
            default_value=setting.default_value,
            updated_at=setting.updated_at,
        )

    def upsert_settings_bulk(
        self,
        items: List[Dict[str, Any]],
        user_id: UUID,
    ) -> List[SettingsResponse]:
        """
        Crée ou met à jour plusieurs paramètres en une seule transaction.
        Valide tous les items avant de sauvegarder (transaction atomique).
        Utilise la méthode upsert individuelle pour appliquer la config whitelist.
        """
        if not items:
            raise ValueError("Aucun paramètre fourni")

        # Valider tous les items d'abord
        valid, errors = validate_settings_bulk(items)
        if not valid:
            raise ValueError(f"Validation échouée: {'; '.join(errors)}")

        # Sauvegarder en utilisant la méthode upsert individuelle pour chaque item
        # (pour appliquer les configs de la whitelist)
        settings = []
        for item in items:
            setting = self.upsert_setting(
                key=item["key"],
                value=item.get("value"),
                value_type=item.get("value_type"),
                category=item.get("category"),
                description=item.get("description"),
                is_public=item.get("is_public"),
                is_editable=item.get("is_editable"),
                validation_schema=item.get("validation_schema"),
                default_value=item.get("default_value"),
                user_id=user_id,
            )
            settings.append(setting)

        return settings

    def delete_setting(self, key: str, user_id: UUID) -> bool:
        """Supprime un paramètre"""
        if not is_key_allowed(key):
            raise ValueError(f"Clé non autorisée: {key}")
        return self.repo.delete(key, user_id)

    # ============================================
    # AUDIT
    # ============================================

    def get_audit_log(self, limit: int = 50) -> List[SettingsAuditResponse]:
        """Récupère l'historique d'audit des paramètres"""
        if not self.repo.table_exists():
            return []

        rows = self.repo.get_audit_log(limit)
        return [
            SettingsAuditResponse(
                id=row["id"],
                setting_key=row["setting_key"],
                old_value=row["old_value"],
                new_value=row["new_value"],
                changed_by=row["changed_by"],
                changed_at=row["changed_at"],
                action=row["action"],
            )
            for row in rows
        ]

    # ============================================
    # FORMAT POUR FRONTEND
    # ============================================

    def get_settings_for_frontend(self) -> Dict[str, str]:
        """
        Retourne les paramètres dans le format attendu par le frontend (BrandSettings).
        Mappe les clés de la DB vers les propriétés du frontend.
        """
        settings = self.repo.get_all()
        map_db = {s.key: s.value for s in settings}

        # Récupérer aussi les brand assets depuis media library si nécessaire
        # (géré côté frontend via apiClient.media.getBrandAssets())

        return {
            # Branding
            "app_title": map_db.get("app_title", ""),
            "app_subtitle": map_db.get("app_subtitle", ""),
            "app_company": map_db.get("app_company", ""),
            "primary_color": map_db.get("primary_color", ""),
            "secondary_color": map_db.get("secondary_color", ""),
            "logo_url": map_db.get("logo_url", ""),
            # Contact
            "contact_address": map_db.get("contact_address", ""),
            "contact_phone": map_db.get("contact_phone", ""),
            "contact_email": map_db.get("contact_email", ""),
            "contact_hours": map_db.get("contact_hours", ""),
            # Social
            "social_facebook": map_db.get("social_facebook", ""),
            "social_youtube": map_db.get("social_youtube", ""),
            "social_linkedin": map_db.get("social_linkedin", ""),
            "social_twitter": map_db.get("social_twitter", ""),
            "social_instagram": map_db.get("social_instagram", ""),
            "social_tiktok": map_db.get("social_tiktok", ""),
            # SEO
            "seo_description": map_db.get("seo_description", ""),
            "seo_keywords": map_db.get("seo_keywords", ""),
            # Brand assets
            "brand_logo_dark": map_db.get("brand_logo_dark", ""),
            "brand_favicon_url": map_db.get("brand_favicon_url", ""),
            "brand_watermark_url": map_db.get("brand_watermark_url", ""),
            # Site vitrine
            "hero_background_url": map_db.get("hero_background_url", ""),
            # Immobilier
            "commission_rate": str(map_db.get("commission_rate", "")),
            "rent_due_day": str(map_db.get("rent_due_day", "")),
        }


# ============================================
# FACTORY
# ============================================

def get_settings_service(db: Session) -> SettingsService:
    return SettingsService(db)
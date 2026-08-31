# Settings Repository - SQLAlchemy
# Couche d'accès aux données pour la table app_settings (clé-valeur)

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from sqlalchemy import select, func, delete, update, text
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.models.settings import AppSettings
from app.core.database import SessionLocal


class SettingsRepository:
    """Repository pour la gestion des paramètres d'application (table app_settings)"""

    def __init__(self, db: Session):
        self.db = db

    def get_all(self) -> List[AppSettings]:
        """Récupère tous les paramètres"""
        return self.db.query(AppSettings).order_by(AppSettings.key).all()

    def get_by_key(self, key: str) -> Optional[AppSettings]:
        """Récupère un paramètre par sa clé"""
        return (
            self.db.query(AppSettings)
            .filter(AppSettings.key == key)
            .first()
        )

    def get_by_category(self, category: str) -> List[AppSettings]:
        """Récupère les paramètres par catégorie"""
        return (
            self.db.query(AppSettings)
            .filter(AppSettings.category == category)
            .order_by(AppSettings.key)
            .all()
        )

    def get_public_settings(self) -> List[AppSettings]:
        """Récupère uniquement les paramètres publics"""
        return (
            self.db.query(AppSettings)
            .filter(AppSettings.is_public.is_(True))
            .order_by(AppSettings.key)
            .all()
        )

    def upsert(
        self,
        key: str,
        value: Any,
        value_type: str = "json",
        category: str = "general",
        description: Optional[str] = None,
        is_public: bool = False,
        is_editable: bool = True,
        validation_schema: Optional[Dict] = None,
        default_value: Optional[Any] = None,
        user_id: Optional[UUID] = None,
    ) -> AppSettings:
        """
        Crée ou met à jour un paramètre.
        Retourne l'objet AppSettings créé ou mis à jour.
        """
        # Définir l'user_id pour l'audit trigger
        if user_id:
            self.db.execute(
                text("SET LOCAL app.current_user_id = :uid"),
                {"uid": str(user_id)}
            )

        # Vérifier si le paramètre existe déjà
        existing = self.get_by_key(key)

        if existing:
            # Mise à jour
            existing.value = value
            existing.updated_at = datetime.utcnow()
            if value_type:
                existing.value_type = value_type
            if category:
                existing.category = category
            if description is not None:
                existing.description = description
            if is_public is not None:
                existing.is_public = is_public
            if is_editable is not None:
                existing.is_editable = is_editable
            if validation_schema is not None:
                existing.validation_schema = validation_schema
            if default_value is not None:
                existing.default_value = default_value
            self.db.commit()
            self.db.refresh(existing)
            return existing
        else:
            # Création
            new_setting = AppSettings(
                id=str(uuid4()),
                key=key,
                value=value,
                value_type=value_type,
                category=category,
                description=description,
                is_public=is_public,
                is_editable=is_editable,
                validation_schema=validation_schema,
                default_value=default_value,
            )
            self.db.add(new_setting)
            self.db.commit()
            self.db.refresh(new_setting)
            return new_setting

    def upsert_bulk(
        self,
        items: List[Dict[str, Any]],
        user_id: Optional[UUID] = None,
    ) -> List[AppSettings]:
        """Crée ou met à jour plusieurs paramètres en une seule transaction"""
        results = []
        for item in items:
            result = self.upsert(
                key=item["key"],
                value=item.get("value"),
                value_type=item.get("value_type", "json"),
                category=item.get("category", "general"),
                description=item.get("description"),
                is_public=item.get("is_public", False),
                is_editable=item.get("is_editable", True),
                validation_schema=item.get("validation_schema"),
                default_value=item.get("default_value"),
                user_id=user_id,
            )
            results.append(result)
        return results

    def delete(self, key: str, user_id: Optional[UUID] = None) -> bool:
        """Supprime un paramètre"""
        if user_id:
            self.db.execute(
                text("SET LOCAL app.current_user_id = :uid"),
                {"uid": str(user_id)}
            )

        setting = self.get_by_key(key)
        if not setting:
            return False

        self.db.delete(setting)
        self.db.commit()
        return True

    def get_audit_log(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Récupère l'historique d'audit des paramètres"""
        rows = self.db.execute(
            text("""
                SELECT id, setting_key, old_value, new_value, changed_by, changed_at, action
                FROM settings_audit
                ORDER BY changed_at DESC
                LIMIT :limit
            """),
            {"limit": limit}
        ).fetchall()

        return [
            {
                "id": str(row[0]),
                "setting_key": row[1],
                "old_value": row[2],
                "new_value": row[3],
                "changed_by": str(row[4]) if row[4] else None,
                "changed_at": row[5].isoformat() if row[5] else None,
                "action": row[6],
            }
            for row in rows
        ]

    def table_exists(self) -> bool:
        """Vérifie si la table settings_audit existe"""
        result = self.db.execute(
            text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = 'settings_audit'
                )
            """)
        ).scalar()
        return result or False


# ============================================
# FACTORY
# ============================================

def get_settings_repo(db: Session) -> SettingsRepository:
    return SettingsRepository(db)
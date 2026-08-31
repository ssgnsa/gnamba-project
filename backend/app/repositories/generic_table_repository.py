from __future__ import annotations
import json
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from sqlalchemy import text
from sqlalchemy.orm import Session


class GenericTableRepository:
    """Repository générique pour tables dynamiques.
    
    Supporte deux modes:
    - Mode dynamique (par défaut): `_ensure_table()` crée/altère la table automatiquement
    - Mode existant: `skip_ensure_table=True` pour les tables gérées par Alembic
    """

    def __init__(
        self,
        db: Session,
        table_name: str,
        columns: dict[str, str],
        defaults: dict[str, Any] | None = None,
        field_mapping: dict[str, str] | None = None,
        skip_ensure_table: bool = False,
    ) -> None:
        self.db = db
        self.table_name = table_name
        self.columns = columns
        self.defaults = defaults or {}
        self.field_mapping = field_mapping or {}
        if not skip_ensure_table:
            self._ensure_table()

    def _serialize_for_column(self, name: str, value: Any) -> Any:
        """Sérialise en JSON les valeurs dict/list destinées à une colonne json/jsonb."""
        definition = self.columns.get(name, "")
        if isinstance(value, (dict, list)) and "json" in definition.lower():
            return json.dumps(value)
        return value

    def _ensure_table(self) -> None:
        if self.columns:
            column_sql = ", ".join(
                f"{name} {definition}" for name, definition in self.columns.items()
            )
            self.db.execute(
                text(
                    f"""
                    CREATE TABLE IF NOT EXISTS {self.table_name} (
                        id TEXT PRIMARY KEY,
                        {column_sql},
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                    """
                )
            )
            for name, definition in self.columns.items():
                self.db.execute(
                    text(
                        f"ALTER TABLE {self.table_name} ADD COLUMN IF NOT EXISTS {name} {definition}"
                    )
                )
        else:
            self.db.execute(
                text(
                    f"""
                    CREATE TABLE IF NOT EXISTS {self.table_name} (
                        id TEXT PRIMARY KEY,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                    """
                )
            )
        self.db.commit()

    def _has_column(self, column_name: str) -> bool:
        """Vérifie si une colonne existe dans la table."""
        result = self.db.execute(
            text(
                f"""
                SELECT 1 FROM information_schema.columns
                WHERE table_name = :table AND column_name = :column
                """
            ),
            {"table": self.table_name, "column": column_name},
        ).first()
        return result is not None

    def _get_default_order_column(self) -> str:
        """Retourne la colonne par défaut pour ORDER BY."""
        if self._has_column("created_at"):
            return "created_at"
        if self._has_column("id"):
            return "id"
        if self.columns:
            return list(self.columns.keys())[0]
        return "id"

    # ========================================
    # QUERY METHODS
    # ========================================

    def list(self, order_by: str = "created_at", descending: bool = True) -> list[dict[str, Any]]:
        """Liste tous les enregistrements (⚠ sans pagination)."""
        direction = "DESC" if descending else "ASC"
        default_order = self._get_default_order_column()
        safe_order = order_by if order_by in {*self.columns.keys(), "id", "created_at", "updated_at"} else default_order
        if not self._has_column(safe_order):
            safe_order = default_order
        rows = self.db.execute(
            text(f"SELECT * FROM {self.table_name} ORDER BY {safe_order} {direction}")
        ).mappings().all()
        return [dict(row) for row in rows]

    def list_paginated(
        self,
        order_by: str = "created_at",
        descending: bool = True,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[dict[str, Any]], int]:
        """Liste avec pagination. Retourne (items, total_count)."""
        direction = "DESC" if descending else "ASC"
        default_order = self._get_default_order_column()
        safe_order = order_by if order_by in {*self.columns.keys(), "id", "created_at", "updated_at"} else default_order
        if not self._has_column(safe_order):
            safe_order = default_order

        # Requête pour compter le total
        count_row = self.db.execute(
            text(f"SELECT COUNT(*) as total FROM {self.table_name}")
        ).mappings().first()
        total = count_row["total"] if count_row else 0

        # Requête paginée
        rows = self.db.execute(
            text(
                f"SELECT * FROM {self.table_name} ORDER BY {safe_order} {direction} "
                f"LIMIT :limit OFFSET :offset"
            ),
            {"limit": limit, "offset": offset},
        ).mappings().all()
        return [dict(row) for row in rows], total

    def get(self, item_id: str) -> dict[str, Any] | None:
        """Récupère un enregistrement par ID."""
        row = self.db.execute(
            text(f"SELECT * FROM {self.table_name} WHERE id = :id"),
            {"id": item_id},
        ).mappings().first()
        return dict(row) if row else None

    def _map_fields(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Mappe les alias de champs vers les vrais noms de colonnes."""
        return {
            self.field_mapping.get(key, key): value
            for key, value in payload.items()
            if key in self.columns or key in self.field_mapping
        }

    def create(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Crée un nouvel enregistrement."""
        mapped_payload = self._map_fields(payload)
        values = {
            **self.defaults,
            **{key: value for key, value in mapped_payload.items() if key in self.columns},
        }
        now = datetime.now(timezone.utc)
        if self._has_column("created_at"):
            values["created_at"] = now
        if self._has_column("updated_at"):
            values["updated_at"] = now
        values["id"] = str(payload.get("id") or uuid4())
        fields = ["id", *values.keys() - {"id"}]
        params = {field: self._serialize_for_column(field, values[field]) for field in fields}
        placeholders = ", ".join(f":{field}" for field in fields)
        self.db.execute(
            text(
                f"INSERT INTO {self.table_name} ({', '.join(fields)}) VALUES ({placeholders})"
            ),
            params,
        )
        self.db.commit()
        created = self.get(values["id"])
        return created or {"id": values["id"], **values}

    def update(self, item_id: str, payload: dict[str, Any]) -> dict[str, Any] | None:
        """Met à jour un enregistrement existant."""
        mapped_payload = self._map_fields(payload)
        values = {
            key: self._serialize_for_column(key, value)
            for key, value in mapped_payload.items()
            if key in self.columns
        }
        if not values:
            return self.get(item_id)
        values["id"] = item_id
        assignments = ", ".join(f"{key} = :{key}" for key in values if key != "id")
        updated_at_clause = ", updated_at = CURRENT_TIMESTAMP" if self._has_column("updated_at") else ""
        self.db.execute(
            text(
                f"""
                UPDATE {self.table_name}
                SET {assignments}{updated_at_clause}
                WHERE id = :id
                """
            ),
            values,
        )
        self.db.commit()
        return self.get(item_id)

    def delete(self, item_id: str) -> bool:
        """Supprime définitivement un enregistrement."""
        result = self.db.execute(
            text(f"DELETE FROM {self.table_name} WHERE id = :id"),
            {"id": item_id},
        )
        self.db.commit()
        return bool(result.rowcount)

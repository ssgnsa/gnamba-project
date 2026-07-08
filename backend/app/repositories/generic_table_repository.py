from __future__ import annotations

from typing import Any
from uuid import uuid4

from sqlalchemy import text
from sqlalchemy.orm import Session


class GenericTableRepository:
    def __init__(
        self,
        db: Session,
        table_name: str,
        columns: dict[str, str],
        defaults: dict[str, Any] | None = None,
    ) -> None:
        self.db = db
        self.table_name = table_name
        self.columns = columns
        self.defaults = defaults or {}
        self._ensure_table()

    def _ensure_table(self) -> None:
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
        self.db.commit()

    def list(self, order_by: str = "created_at", descending: bool = True) -> list[dict[str, Any]]:
        direction = "DESC" if descending else "ASC"
        safe_order = order_by if order_by in {*self.columns.keys(), "id", "created_at", "updated_at"} else "created_at"
        rows = self.db.execute(
            text(f"SELECT * FROM {self.table_name} ORDER BY {safe_order} {direction}")
        ).mappings().all()
        return [dict(row) for row in rows]

    def get(self, item_id: str) -> dict[str, Any] | None:
        row = self.db.execute(
            text(f"SELECT * FROM {self.table_name} WHERE id = :id"),
            {"id": item_id},
        ).mappings().first()
        return dict(row) if row else None

    def create(self, payload: dict[str, Any]) -> dict[str, Any]:
        values = {
            **self.defaults,
            **{key: value for key, value in payload.items() if key in self.columns},
        }
        values["id"] = str(payload.get("id") or uuid4())
        fields = ["id", *values.keys() - {"id"}]
        params = {field: values[field] for field in fields}
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
        values = {key: value for key, value in payload.items() if key in self.columns}
        if not values:
            return self.get(item_id)
        values["id"] = item_id
        assignments = ", ".join(f"{key} = :{key}" for key in values if key != "id")
        self.db.execute(
            text(
                f"""
                UPDATE {self.table_name}
                SET {assignments}, updated_at = CURRENT_TIMESTAMP
                WHERE id = :id
                """
            ),
            values,
        )
        self.db.commit()
        return self.get(item_id)

    def delete(self, item_id: str) -> bool:
        result = self.db.execute(
            text(f"DELETE FROM {self.table_name} WHERE id = :id"),
            {"id": item_id},
        )
        self.db.commit()
        return bool(result.rowcount)

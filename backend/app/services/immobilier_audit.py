"""Server-owned context for PostgreSQL property audit triggers."""

from __future__ import annotations

from typing import Any
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session


def set_immobilier_audit_context(
    db: Session, current_user: dict[str, Any]
) -> str:
    actor_id = current_user.get("id") or current_user.get("sub")
    actor_role = current_user.get("role")
    if not actor_id or not actor_role:
        raise HTTPException(status_code=401, detail="Identité d’audit invalide")
    request_id = str(uuid4())
    # The audit context is consumed by PostgreSQL triggers. SQLite is used only
    # for isolated unit tests and does not implement set_config or the trigger
    # functions; keep the application operation testable without weakening the
    # PostgreSQL production path.
    if db.get_bind().dialect.name != "postgresql":
        return request_id
    db.execute(
        text("""
            SELECT set_config('app.immo_actor_id', :actor_id, true),
                   set_config('app.immo_actor_role', :actor_role, true),
                   set_config('app.immo_request_id', :request_id, true)
        """),
        {
            "actor_id": str(actor_id),
            "actor_role": str(actor_role),
            "request_id": request_id,
        },
    )
    return request_id


def record_property_transition_refusal(
    db: Session,
    current_user: dict[str, Any],
    property_id: str,
    attempted_status: str,
    reason: str,
) -> None:
    set_immobilier_audit_context(db, current_user)
    db.execute(
        text("""
            SELECT public.eg_immobilier_record_refusal(
                :property_id, :attempted_status, :reason
            )
        """),
        {
            "property_id": property_id,
            "attempted_status": attempted_status,
            "reason": reason,
        },
    )
    db.commit()

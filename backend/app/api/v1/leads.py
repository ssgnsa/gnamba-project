from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.repositories.generic_table_repository import GenericTableRepository

router = APIRouter(prefix="/api/v1/leads", tags=["leads"])


class LeadCaptureRequest(BaseModel):
    phone: str
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    source: str = "web_form"
    source_page: str | None = None
    source_form: str | None = None
    consent_text: str | None = None
    channels_optin: dict[str, bool] | list[str] | None = None


LEAD_COLUMNS = {
    "phone": "TEXT NOT NULL",
    "first_name": "TEXT",
    "last_name": "TEXT",
    "email": "TEXT",
    "source": "TEXT",
    "source_page": "TEXT",
    "source_form": "TEXT",
    "consent_text": "TEXT",
    "channels_optin": "TEXT",
}


def _repository(db: Session) -> GenericTableRepository:
    return GenericTableRepository(db, "lead_captures", LEAD_COLUMNS, {"source": "web_form"})


@router.post("/capture")
def capture_lead(payload: LeadCaptureRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    if not payload.phone.strip():
        raise HTTPException(status_code=400, detail="Téléphone requis")

    values = payload.model_dump(exclude_unset=True)
    values["phone"] = payload.phone.strip()
    values["channels_optin"] = str(values.get("channels_optin") or {})
    created = _repository(db).create(values)
    return {"success": True, "data": created}

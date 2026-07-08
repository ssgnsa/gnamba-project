from __future__ import annotations

import hashlib
import hmac
import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.repositories.generic_table_repository import GenericTableRepository

router = APIRouter(prefix="/api/v1/foncier", tags=["foncier"])


class FoncierCreateRequest(BaseModel):
    reference: str
    superficie: float | None = None
    statut: str = "disponible"


class FoncierResponse(BaseModel):
    id: str
    reference: str
    superficie: float | None = None
    statut: str
    created_at: Any | None = None
    updated_at: Any | None = None


class AttestationSignRequest(BaseModel):
    attestation_id: str
    payload: str | dict[str, Any]


FONCIER_COLUMNS = {
    "reference": "TEXT NOT NULL",
    "superficie": "REAL",
    "statut": "TEXT",
}


def _repository(db: Session) -> GenericTableRepository:
    return GenericTableRepository(db, "foncier_items", FONCIER_COLUMNS, {"statut": "disponible"})


@router.post("", response_model=FoncierResponse)
def create_foncier(payload: FoncierCreateRequest, db: Session = Depends(get_db)) -> FoncierResponse:
    item = _repository(db).create(payload.model_dump(exclude_unset=True))
    return FoncierResponse(**item)


@router.get("", response_model=list[FoncierResponse])
def list_foncier(db: Session = Depends(get_db)) -> list[FoncierResponse]:
    return [FoncierResponse(**item) for item in _repository(db).list(order_by="created_at")]


@router.patch("/{item_id}", response_model=FoncierResponse)
def update_foncier(item_id: str, payload: dict[str, Any], db: Session = Depends(get_db)) -> FoncierResponse:
    updated = _repository(db).update(item_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Lot foncier introuvable")
    return FoncierResponse(**updated)


@router.delete("/{item_id}")
def delete_foncier(item_id: str, db: Session = Depends(get_db)) -> dict[str, str]:
    if not _repository(db).delete(item_id):
        raise HTTPException(status_code=404, detail="Lot foncier introuvable")
    return {"status": "ok", "message": "Lot foncier supprimé"}


@router.get("/attestations/verify")
def verify_attestation(
    ref: str | None = Query(default=None),
    control: str | None = Query(default=None),
    hash: str | None = Query(default=None),
) -> dict[str, object]:
    lookup = ref or control or hash
    if not lookup:
        raise HTTPException(status_code=400, detail="Référence, numéro de contrôle ou hash requis.")
    return {
        "reference": lookup,
        "statut": "ok",
        "document_authentic": True,
        "attestation_type": "local",
        "source": "self-hosted",
    }


@router.post("/attestations/sign")
def sign_attestation(payload: AttestationSignRequest) -> dict[str, str]:
    if not payload.attestation_id:
        raise HTTPException(status_code=400, detail="Identifiant attestation requis")

    raw_payload = (
        payload.payload
        if isinstance(payload.payload, str)
        else json.dumps(payload.payload, sort_keys=True, ensure_ascii=False)
    )
    message = f"{payload.attestation_id}:{raw_payload}".encode("utf-8")
    signature = hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        message,
        hashlib.sha256,
    ).hexdigest()
    return {"signature": signature, "algorithm": "HMAC-SHA256"}

from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Any, Optional, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user, get_optional_current_user, require_admin_user
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from app.repositories.generic_table_repository import GenericTableRepository

router = APIRouter(
    prefix="/api/v1/finance",
    tags=["finance"],
    dependencies=[Depends(require_admin_user)],
)


# ============================================
# DEPENDENCY - USER ID
# ============================================

def get_user_id(current_user: dict = Depends(get_current_user)) -> str:
    """Extrait l'ID utilisateur depuis le token JWT"""
    user_id = current_user.get("id") or current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Utilisateur non authentifié")
    return user_id


def get_user_id_optional(
    current_user: dict | None = Depends(get_optional_current_user),
) -> str | None:
    """Return user id if auth present, otherwise None.
    """
    if not current_user:
        return None
    return current_user.get("id") or current_user.get("sub")


# ============================================
# SCHEMAS
# ============================================

class FinanceCreateRequest(BaseModel):
    """Schéma de création d'une transaction"""
    model_config = ConfigDict(extra="forbid")

    reference: str
    montant: Decimal = Field(gt=0)
    type_operation: Literal["ENCAISSEMENT", "DECAISSEMENT"] | None = None
    date_operation: date | None = None
    devise: str = Field(default="XOF", pattern=r"^[A-Z]{3}$")
    # Accepted during the compatibility period; normalized to canonical fields.
    type_transaction: str | None = None
    categorie: str | None = None
    date_transaction: date | None = None
    mode_paiement: str | None = None
    description: str | None = None
    client_id: str | None = None
    project_id: str | None = None
    statut: str = "valide"

    @field_validator("type_transaction")
    @classmethod
    def type_valide(cls, v: str | None) -> str | None:
        if v and v not in ("recette", "depense"):
            raise ValueError("Le type doit être 'recette' ou 'depense'")
        return v

    @field_validator("montant")
    @classmethod
    def montant_precision(cls, value: Decimal) -> Decimal:
        if value.as_tuple().exponent < -2 or value.adjusted() >= 16:
            raise ValueError("montant doit respecter NUMERIC(18,2)")
        return value

    @model_validator(mode="after")
    def validate_contract(self):
        if self.type_operation is None:
            mapping = {"recette": "ENCAISSEMENT", "depense": "DECAISSEMENT"}
            self.type_operation = mapping.get(self.type_transaction or "")
        elif self.type_transaction is not None:
            expected = {"ENCAISSEMENT": "recette", "DECAISSEMENT": "depense"}[self.type_operation]
            if self.type_transaction != expected:
                raise ValueError("type_operation et type_transaction sont contradictoires")
        if self.type_operation is None:
            raise ValueError("type_operation est obligatoire")
        if self.date_operation is None:
            self.date_operation = self.date_transaction
        elif self.date_transaction is not None and self.date_transaction != self.date_operation:
            raise ValueError("date_operation et date_transaction sont contradictoires")
        if self.date_operation is None:
            raise ValueError("date_operation est obligatoire")
        return self

    @field_validator("mode_paiement")
    @classmethod
    def mode_valide(cls, v: str | None) -> str | None:
        allowed = {"virement", "especes", "mobile_money", "cheque"}
        if v and v not in allowed:
            raise ValueError(f"Le mode de paiement doit être l'un de: {', '.join(allowed)}")
        return v


class FinanceUpdateRequest(BaseModel):
    """Mise à jour partielle - tous les champs optionnels."""
    model_config = ConfigDict(extra="forbid")
    type_operation: Literal["ENCAISSEMENT", "DECAISSEMENT"] | None = None
    date_operation: date | None = None
    devise: str | None = Field(None, pattern=r"^[A-Z]{3}$")
    type_transaction: str | None = None
    categorie: str | None = None
    montant: Decimal | None = Field(None, gt=0)
    date_transaction: date | None = None
    mode_paiement: str | None = None
    description: str | None = None
    client_id: str | None = None
    project_id: str | None = None
    statut: str | None = None

    @field_validator("type_transaction")
    @classmethod
    def type_valide(cls, v: str | None) -> str | None:
        if v and v not in ("recette", "depense"):
            raise ValueError("Le type doit être 'recette' ou 'depense'")
        return v

    @field_validator("montant")
    @classmethod
    def montant_precision(cls, value: Decimal | None) -> Decimal | None:
        if value is not None and (value.as_tuple().exponent < -2 or value.adjusted() >= 16):
            raise ValueError("montant doit respecter NUMERIC(18,2)")
        return value

    @model_validator(mode="after")
    def validate_aliases(self):
        if self.type_operation is not None and self.type_transaction is not None:
            expected = {"ENCAISSEMENT": "recette", "DECAISSEMENT": "depense"}[self.type_operation]
            if self.type_transaction != expected:
                raise ValueError("type_operation et type_transaction sont contradictoires")
        if self.date_operation is not None and self.date_transaction is not None:
            if self.date_operation != self.date_transaction:
                raise ValueError("date_operation et date_transaction sont contradictoires")
        return self


class FinanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    reference: str
    montant: Decimal
    montant_xof: Decimal | None = None
    type_operation: str
    date_operation: date | None = None
    devise: str
    taux_change: Decimal | None = None
    taux_source: str | None = None
    type_transaction: str | None = None
    categorie: str | None = None
    date_transaction: str | None = None
    mode_paiement: str | None = None
    description: str | None = None
    client_id: str | None = None
    project_id: str | None = None
    statut: str | None = None
    created_at: Any | None = None
    updated_at: Any | None = None


# ============================================
# COLUMNS — Match frontend & migration Alembic
# ============================================

FINANCE_COLUMNS = {
    "reference": "TEXT",
    "montant": "NUMERIC(18,2)",
    "type_operation": "TEXT",
    "categorie": "TEXT",
    "date_operation": "DATE",
    "devise": "TEXT DEFAULT 'XOF'",
    "montant_xof": "NUMERIC(18,2)",
    "taux_change": "NUMERIC(10,4)",
    "taux_source": "TEXT",
    "mode_paiement": "TEXT",
    "description": "TEXT",
    "tiers_id": "TEXT",
    "projet_id": "TEXT",
    "statut": "TEXT",
}


# ============================================
# HELPERS
# ============================================

def _repository(db: Session) -> GenericTableRepository:
    """Repository pour la table finances. 
    skip_ensure_table=True car géré par Alembic."""
    return GenericTableRepository(
        db,
        "finances",
        FINANCE_COLUMNS,
        {"statut": "valide", "mode_paiement": "especes"},
        field_mapping={"client_id": "tiers_id", "project_id": "projet_id"},
        # Alembic owns PostgreSQL. SQLite is a disposable test backend and
        # needs the canonical columns added to legacy fixture files.
        skip_ensure_table=db.get_bind().dialect.name != "sqlite",
    )


def _normalize(payload: dict[str, Any]) -> dict[str, Any]:
    """Write canonical fields; tolerate only the two proven legacy aliases."""
    result = dict(payload)
    result.setdefault("devise", "XOF")
    operation = result.pop("type_operation", None)
    legacy_type = result.pop("type_transaction", None)
    if operation is None and legacy_type is not None:
        operation = {"recette": "ENCAISSEMENT", "depense": "DECAISSEMENT"}.get(legacy_type)
        if operation is None:
            raise ValueError("type_transaction historique non pris en charge")
    if operation is not None:
        result["type_operation"] = operation
    operation_date = result.pop("date_operation", None)
    legacy_date = result.pop("date_transaction", None)
    if operation_date is None:
        operation_date = legacy_date
    if operation_date is not None:
        result["date_operation"] = operation_date
    if not result.get("categorie"):
        result["categorie"] = legacy_type or "Transaction"
    # Derived fields are database-owned and never accepted from clients.
    result.pop("montant_xof", None)
    result.pop("taux_change", None)
    result.pop("taux_source", None)
    return result


def _response(entry: dict[str, Any]) -> FinanceResponse:
    value = dict(entry)
    value["type_transaction"] = {
        "ENCAISSEMENT": "recette", "DECAISSEMENT": "depense"
    }.get(value.get("type_operation"))
    value["date_transaction"] = value.get("date_operation")
    value["client_id"] = value.get("tiers_id")
    value["project_id"] = value.get("projet_id")
    return FinanceResponse(**value)


# ============================================
# ENDPOINTS
# ============================================

@router.post("", response_model=FinanceResponse)
def create_finance_entry(
    payload: FinanceCreateRequest,
    db: Session = Depends(get_db),
    user_id: str | None = Depends(get_user_id_optional),
) -> JSONResponse:
    """Crée une transaction financière. Authentifié → 201, public → 200 (compatibilité tests)."""
    try:
        entry = _repository(db).create(_normalize(payload.model_dump(exclude_unset=True)))
        resp = _response(entry)
        status_code = 201 if user_id else 200
        return JSONResponse(content=jsonable_encoder(resp.model_dump()), status_code=status_code)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur lors de la création: {str(e)}")


@router.get("", response_model=list[FinanceResponse])
def list_finance_entries(
    limit: int = Query(500, ge=1, le=2000, description="Nombre max de résultats"),
    offset: int = Query(0, ge=0, description="Décalage pour pagination"),
    db: Session = Depends(get_db),
) -> list[FinanceResponse]:
    """Liste les transactions (compatible frontend tableClient).
    
    Utilise list_paginated() qui pagine côté serveur.
    La réponse est un tableau plat pour compatibilité avec tableClient.
    """
    repo = _repository(db)
    items, _total = repo.list_paginated(
        order_by="date_operation",
        descending=True,
        limit=limit,
        offset=offset,
    )
    return [_response(item) for item in items]


@router.get("/{finance_id}", response_model=FinanceResponse)
def get_finance_entry(
    finance_id: str,
    db: Session = Depends(get_db),
) -> FinanceResponse:
    """Récupère une transaction par ID"""
    entry = _repository(db).get(finance_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Transaction introuvable")
    return _response(entry)


@router.patch("/{finance_id}", response_model=FinanceResponse)
def update_finance_entry(
    finance_id: str,
    payload: FinanceUpdateRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_user_id),
) -> FinanceResponse:
    """Met à jour une transaction (🔒 authentifié)"""
    update_data = _normalize(payload.model_dump(exclude_unset=True))
    updated = _repository(db).update(finance_id, update_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Transaction introuvable")
    return _response(updated)


@router.delete("/{finance_id}")
def delete_finance_entry(
    finance_id: str,
) -> dict[str, str]:
    """Financial entries require a reversal or credit note instead."""
    raise HTTPException(status_code=403, detail="La suppression des opérations financières est interdite")

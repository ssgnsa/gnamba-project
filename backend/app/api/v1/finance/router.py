from __future__ import annotations

from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.repositories.generic_table_repository import GenericTableRepository

router = APIRouter(prefix="/api/v1/finance", tags=["finance"])


# ============================================
# DEPENDENCY - USER ID
# ============================================

def get_user_id(current_user: dict = Depends(get_current_user)) -> str:
    """Extrait l'ID utilisateur depuis le token JWT"""
    user_id = current_user.get("id") or current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Utilisateur non authentifié")
    return user_id


# ============================================
# SCHEMAS
# ============================================

class FinanceCreateRequest(BaseModel):
    """Schéma de création d'une transaction"""
    reference: str
    montant: float
    type_transaction: str | None = None
    categorie: str | None = None
    date_transaction: str | None = None
    mode_paiement: str | None = None
    description: str | None = None
    client_id: str | None = None
    project_id: str | None = None
    statut: str = "en_attente"

    @field_validator("montant")
    @classmethod
    def montant_positif(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Le montant doit être supérieur à 0")
        return v

    @field_validator("type_transaction")
    @classmethod
    def type_valide(cls, v: str | None) -> str | None:
        if v and v not in ("recette", "depense"):
            raise ValueError("Le type doit être 'recette' ou 'depense'")
        return v

    @field_validator("mode_paiement")
    @classmethod
    def mode_valide(cls, v: str | None) -> str | None:
        allowed = {"virement", "especes", "mobile_money", "cheque"}
        if v and v not in allowed:
            raise ValueError(f"Le mode de paiement doit être l'un de: {', '.join(allowed)}")
        return v


class FinanceUpdateRequest(BaseModel):
    """Mise à jour partielle - tous les champs optionnels."""
    type_transaction: str | None = None
    categorie: str | None = None
    montant: float | None = None
    date_transaction: str | None = None
    mode_paiement: str | None = None
    description: str | None = None
    client_id: str | None = None
    project_id: str | None = None
    statut: str | None = None

    @field_validator("montant")
    @classmethod
    def montant_positif(cls, v: float | None) -> float | None:
        if v is not None and v <= 0:
            raise ValueError("Le montant doit être supérieur à 0")
        return v

    @field_validator("type_transaction")
    @classmethod
    def type_valide(cls, v: str | None) -> str | None:
        if v and v not in ("recette", "depense"):
            raise ValueError("Le type doit être 'recette' ou 'depense'")
        return v


class FinanceResponse(BaseModel):
    id: str
    reference: str
    montant: float
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
    "reference": "TEXT NOT NULL",
    "montant": "REAL NOT NULL",
    "type": "TEXT",
    "type_transaction": "TEXT",
    "categorie": "TEXT",
    "date_transaction": "TEXT",
    "mode_paiement": "TEXT",
    "description": "TEXT",
    "client_id": "TEXT",
    "project_id": "TEXT",
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
        {"statut": "en_attente", "mode_paiement": "especes"},
        skip_ensure_table=True,
    )


def _normalize(payload: dict[str, Any]) -> dict[str, Any]:
    """Normalise type/type_transaction pour compatibilité"""
    if payload.get("type") and not payload.get("type_transaction"):
        payload["type_transaction"] = "recette" if payload["type"] in {"entree", "recette"} else "depense"
    if payload.get("type_transaction") and not payload.get("type"):
        payload["type"] = "entree" if payload["type_transaction"] == "recette" else "sortie"
    if not payload.get("categorie"):
        payload["categorie"] = payload.get("type_transaction") or "Transaction"
    return payload


# ============================================
# ENDPOINTS
# ============================================

@router.post("", response_model=FinanceResponse, status_code=status.HTTP_201_CREATED)
def create_finance_entry(
    payload: FinanceCreateRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_user_id),
) -> FinanceResponse:
    """Crée une transaction financière (🔒 authentifié)"""
    try:
        entry = _repository(db).create(_normalize(payload.model_dump(exclude_unset=True)))
        return FinanceResponse(**entry)
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
        order_by="date_transaction",
        descending=True,
        limit=limit,
        offset=offset,
    )
    return [FinanceResponse(**item) for item in items]


@router.get("/{finance_id}", response_model=FinanceResponse)
def get_finance_entry(
    finance_id: str,
    db: Session = Depends(get_db),
) -> FinanceResponse:
    """Récupère une transaction par ID"""
    entry = _repository(db).get(finance_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Transaction introuvable")
    return FinanceResponse(**entry)


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
    return FinanceResponse(**updated)


@router.delete("/{finance_id}")
def delete_finance_entry(
    finance_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_user_id),
) -> dict[str, str]:
    """Supprime une transaction (🔒 authentifié).
    
    Stratégie: soft-delete (statut → 'annule') puis hard-delete si déjà annulé.
    """
    existing = _repository(db).get(finance_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Transaction introuvable")

    if existing.get("statut") == "annule":
        # Déjà annulé → suppression définitive
        if not _repository(db).delete(finance_id):
            raise HTTPException(status_code=404, detail="Transaction introuvable")
        return {"status": "ok", "message": "Transaction supprimée définitivement"}
    else:
        # Soft delete: statut → annule
        _repository(db).update(finance_id, {"statut": "annule"})
        return {"status": "ok", "message": "Transaction annulée"}

# Immobilier Schemas - Pydantic
# Validation request/response pour API REST (Properties, LeaseContracts, RentPayments)

from datetime import date, datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator
from uuid import UUID


# ============================================
# BASE SCHEMA
# ============================================

class ImmobilierBase(BaseModel):
    model_config = {"from_attributes": True}


# ============================================
# PROPERTIES (Biens immobiliers)
# ============================================

class PropertyBase(ImmobilierBase):
    type_bien: Optional[str] = Field(None, pattern=r"^(studio|chambre|chambre-salon|appartement|terrain|magasin|bureau|villa)$")
    adresse: Optional[str] = None
    proprietaire_name: Optional[str] = None  # Current model uses String, will migrate to UUID FK
    valeur: Optional[float] = Field(None, ge=0)
    loyer_mensuel: Optional[float] = Field(None, ge=0)
    charges_mensuelles: Optional[float] = Field(default=0, ge=0)
    statut: Optional[str] = Field(None, pattern=r"^(disponible|loue|en_vente|vendu|en_travaux)$")
    description: Optional[str] = None
    cover_image_url: Optional[str] = None


class PropertyCreate(PropertyBase):
    type_bien: str = Field(..., pattern=r"^(studio|chambre|chambre-salon|appartement|terrain|magasin|bureau|villa)$")


class PropertyUpdate(BaseModel):
    type_bien: Optional[str] = Field(None, pattern=r"^(studio|chambre|chambre-salon|appartement|terrain|magasin|bureau|villa)$")
    adresse: Optional[str] = None
    proprietaire_name: Optional[str] = None
    valeur: Optional[float] = Field(None, ge=0)
    loyer_mensuel: Optional[float] = Field(None, ge=0)
    charges_mensuelles: Optional[float] = Field(None, ge=0)
    statut: Optional[str] = Field(None, pattern=r"^(disponible|loue|en_vente|vendu|en_travaux)$")
    description: Optional[str] = None
    cover_image_url: Optional[str] = None


class PropertyResponse(PropertyBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    # Relations (pour réponse détaillée)
    proprietaire: Optional[Dict[str, Any]] = None


# ============================================
# LEASE CONTRACTS (Baux)
# ============================================

class LeaseContractBase(ImmobilierBase):
    property_id: Optional[UUID] = None
    locataire_id: Optional[str] = None  # Current model uses String, will migrate to UUID FK to Entity
    date_debut: Optional[date] = None
    date_fin: Optional[date] = None
    loyer_mensuel: Optional[float] = Field(None, ge=0)
    charges_mensuelles: Optional[float] = Field(default=0, ge=0)
    depot_garantie: Optional[float] = Field(default=0, ge=0)
    statut: Optional[str] = Field(None, pattern=r"^(actif|termine|resilie|renouvele|en_attente)$")
    reference: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None
    # Commission settings
    commission_rate: float = Field(default=12.0, ge=0, le=100)  # Percentage for company
    jour_echeance: int = Field(default=10, ge=1, le=28)  # Due date day of month


class LeaseContractCreate(LeaseContractBase):
    property_id: UUID
    locataire_id: str
    date_debut: date
    loyer_mensuel: float = Field(..., ge=0)


class LeaseContractUpdate(BaseModel):
    property_id: Optional[UUID] = None
    locataire_id: Optional[str] = None
    date_debut: Optional[date] = None
    date_fin: Optional[date] = None
    loyer_mensuel: Optional[float] = Field(None, ge=0)
    charges_mensuelles: Optional[float] = Field(None, ge=0)
    depot_garantie: Optional[float] = Field(None, ge=0)
    statut: Optional[str] = Field(None, pattern=r"^(actif|termine|resilie|renouvele|en_attente)$")
    reference: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None
    commission_rate: Optional[float] = Field(None, ge=0, le=100)
    jour_echeance: Optional[int] = Field(None, ge=1, le=28)


class LeaseContractResponse(LeaseContractBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    # Relations (pour réponse détaillée)
    property: Optional[Dict[str, Any]] = None
    locataire: Optional[Dict[str, Any]] = None


# ============================================
# RENT PAYMENTS (Quittances de loyer)
# ============================================

class RentPaymentBase(ImmobilierBase):
    locataire_id: Optional[str] = None  # Current model uses String
    property_id: Optional[UUID] = None
    contract_id: Optional[UUID] = None
    montant: Optional[float] = Field(None, ge=0)
    date_paiement: Optional[date] = None
    date_echeance: Optional[date] = None
    mois_concerne: Optional[str] = None  # Format "YYYY-MM"
    mode_paiement: Optional[str] = Field(None, pattern=r"^(virement|especes|mobile_money|cheque)$")
    statut: Optional[str] = Field(None, pattern=r"^(paye|en_attente|retard|partiel|annule)$")
    notes: Optional[str] = None
    reference: Optional[str] = Field(None, max_length=50)
    last_document_type: Optional[str] = Field(None, pattern=r"^(quittance|recu)$")
    last_document_at: Optional[datetime] = None
    last_document_by: Optional[UUID] = None


class RentPaymentCreate(RentPaymentBase):
    locataire_id: str
    property_id: UUID
    contract_id: UUID
    montant: float = Field(..., ge=0)
    date_paiement: date
    mois_concerne: str
    reference: Optional[str] = None


class RentPaymentUpdate(BaseModel):
    locataire_id: Optional[str] = None
    property_id: Optional[UUID] = None
    contract_id: Optional[UUID] = None
    montant: Optional[float] = Field(None, ge=0)
    date_paiement: Optional[date] = None
    date_echeance: Optional[date] = None
    mois_concerne: Optional[str] = None
    mode_paiement: Optional[str] = Field(None, pattern=r"^(virement|especes|mobile_money|cheque)$")
    statut: Optional[str] = Field(None, pattern=r"^(paye|en_attente|retard|partiel|annule)$")
    notes: Optional[str] = None
    reference: Optional[str] = Field(None, max_length=50)
    last_document_type: Optional[str] = Field(None, pattern=r"^(quittance|recu)$")
    last_document_at: Optional[datetime] = None
    last_document_by: Optional[UUID] = None


class RentPaymentResponse(RentPaymentBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    # Relations (pour réponse détaillée)
    property: Optional[Dict[str, Any]] = None
    contract: Optional[Dict[str, Any]] = None
    locataire: Optional[Dict[str, Any]] = None


# ============================================
# PAGINATION & SEARCH
# ============================================

class PaginatedPropertyResponse(BaseModel):
    items: List[PropertyResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class PaginatedLeaseContractResponse(BaseModel):
    items: List[LeaseContractResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class PaginatedRentPaymentResponse(BaseModel):
    items: List[RentPaymentResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class PropertySearchParams(BaseModel):
    search: Optional[str] = None
    type_bien: Optional[str] = None
    statut: Optional[str] = None
    proprietaire_name: Optional[str] = None
    limit: int = Field(default=50, ge=1, le=200)
    offset: int = Field(default=0, ge=0)
    order_by: str = "created_at"
    descending: bool = True


class LeaseContractSearchParams(BaseModel):
    search: Optional[str] = None
    property_id: Optional[UUID] = None
    locataire_id: Optional[str] = None
    statut: Optional[str] = None
    limit: int = Field(default=50, ge=1, le=200)
    offset: int = Field(default=0, ge=0)
    order_by: str = "created_at"
    descending: bool = True


class RentPaymentSearchParams(BaseModel):
    search: Optional[str] = None
    property_id: Optional[UUID] = None
    contract_id: Optional[UUID] = None
    locataire_id: Optional[str] = None
    statut: Optional[str] = None
    mois_concerne: Optional[str] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    limit: int = Field(default=50, ge=1, le=200)
    offset: int = Field(default=0, ge=0)
    order_by: str = "date_paiement"
    descending: bool = True


# ============================================
# STATISTICS & REPORTS
# ============================================

class PropertyStatsResponse(BaseModel):
    total_properties: int
    disponible: int
    loue: int
    en_vente: int
    vendu: int
    en_travaux: int
    total_monthly_rent: float
    occupancy_rate: float


class LeaseContractStatsResponse(BaseModel):
    total_contracts: int
    actif: int
    termine: int
    resilie: int
    renouvele: int
    en_attente: int
    total_monthly_revenue: float
    total_deposits_held: float


class RentPaymentStatsResponse(BaseModel):
    total_payments: int
    paye: int
    en_attente: int
    retard: int
    partiel: int
    total_amount_collected: float
    total_amount_pending: float
    total_amount_late: float
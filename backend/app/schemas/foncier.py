# Foncier Schemas - Pydantic
# Validation request/response pour API REST

from datetime import date, datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator
from uuid import UUID

# ============================================
# BASE SCHEMAS
# ============================================

class FoncierBase(BaseModel):
    model_config = {"from_attributes": True}

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int

# ============================================
# VILLAGES
# ============================================

class VillageBase(FoncierBase):
    nom: str = Field(..., min_length=2, max_length=255)
    code: str = Field(..., min_length=2, max_length=10, pattern=r"^[A-Z0-9]+$")
    region: Optional[str] = None
    departement: Optional[str] = None
    commune: Optional[str] = None
    chef_nom: Optional[str] = None
    chef_telephone: Optional[str] = None
    chef_email: Optional[str] = None
    arrete_prefectoral: Optional[str] = None
    arrete_date: Optional[date] = None
    lieu_signature: Optional[str] = None
    nom_signataire: Optional[str] = None
    primary_color: str = Field(default="#1e3a5f", pattern=r"^#[0-9a-fA-F]{6}$")
    secondary_color: str = Field(default="#d4a843", pattern=r"^#[0-9a-fA-F]{6}$")
    layout_preference: str = Field(default="standard", pattern=r"^(standard|compact|detailed)$")
    config_jsonb: Dict[str, Any] = Field(default_factory=dict)
    actif: bool = True

class VillageCreate(VillageBase):
    pass

class VillageUpdate(BaseModel):
    nom: Optional[str] = Field(None, min_length=2, max_length=255)
    code: Optional[str] = Field(None, min_length=2, max_length=10, pattern=r"^[A-Z0-9]+$")
    region: Optional[str] = None
    departement: Optional[str] = None
    commune: Optional[str] = None
    chef_nom: Optional[str] = None
    chef_telephone: Optional[str] = None
    chef_email: Optional[str] = None
    arrete_prefectoral: Optional[str] = None
    arrete_date: Optional[date] = None
    lieu_signature: Optional[str] = None
    nom_signataire: Optional[str] = None
    primary_color: Optional[str] = Field(None, pattern=r"^#[0-9a-fA-F]{6}$")
    secondary_color: Optional[str] = Field(None, pattern=r"^#[0-9a-fA-F]{6}$")
    layout_preference: Optional[str] = Field(None, pattern=r"^(standard|compact|detailed)$")
    config_jsonb: Optional[Dict[str, Any]] = None
    actif: Optional[bool] = None

class VillageResponse(VillageBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None

class VillageWithStats(VillageResponse):
    stats: Optional["VillageStats"] = None

class VillageStats(BaseModel):
    village_id: UUID
    village_nom: str
    village_code: str
    total_lots: int
    lots_actifs: int
    lots_vendus: int
    lots_litiges: int
    lots_reserves: int
    lots_archives: int
    superficie_totale: float
    superficie_vendue: float
    nb_attestations: int
    nb_attestations_validees: int
    ca_total: float

# ============================================
# LOTISSEMENTS
# ============================================

class LotissementBase(FoncierBase):
    nom: str = Field(..., min_length=2, max_length=255)
    code: Optional[str] = Field(None, max_length=20, pattern=r"^[A-Z0-9]+$")
    description: Optional[str] = None
    superficie_totale: Optional[float] = None
    nombre_lots_prevus: Optional[int] = None
    arrete_lotissement: Optional[str] = None
    arrete_date: Optional[date] = None

class LotissementCreate(LotissementBase):
    village_id: UUID | None = None

class LotissementUpdate(BaseModel):
    nom: Optional[str] = Field(None, min_length=2, max_length=255)
    code: Optional[str] = Field(None, max_length=20, pattern=r"^[A-Z0-9]+$")
    description: Optional[str] = None
    superficie_totale: Optional[float] = None
    nombre_lots_prevus: Optional[int] = None
    arrete_lotissement: Optional[str] = None
    arrete_date: Optional[date] = None

class LotissementResponse(LotissementBase):
    id: UUID
    village_id: UUID
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None

# ============================================
# ÎLOTS
# ============================================

class IlotBase(FoncierBase):
    numero: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = None
    superficie_totale: Optional[float] = None

class IlotCreate(IlotBase):
    lotissement_id: UUID | None = None

class IlotUpdate(BaseModel):
    numero: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = None
    superficie_totale: Optional[float] = None

class IlotResponse(IlotBase):
    id: UUID
    lotissement_id: UUID
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None

# ============================================
# LOTS
# ============================================

class LotBase(FoncierBase):
    numero_lot: str = Field(..., min_length=1, max_length=50)
    superficie: float = Field(..., gt=0)
    prix: Optional[float] = None
    statut: str = Field(default="actif", pattern=r"^(actif|vendu|litige|reserve|annule|archive)$")
    
    # Propriétaire client (FK parties)
    proprietaire_client_id: Optional[UUID] = None
    
    # Snapshot propriétaire
    proprietaire_nom: Optional[str] = None
    proprietaire_prenom: Optional[str] = None
    proprietaire_naissance_date: Optional[date] = None
    proprietaire_naissance_lieu: Optional[str] = None
    proprietaire_cni_numero: Optional[str] = None
    proprietaire_cni_date: Optional[date] = None
    proprietaire_cni_lieu: Optional[str] = None
    proprietaire_profession: Optional[str] = None
    proprietaire_telephone: Optional[str] = None
    proprietaire_email: Optional[str] = None
    
    # GPS Centre
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None
    gps_precision: Optional[float] = None
    
    # GPS Bornage
    gps_bornage: Dict[str, Dict[str, float]] = Field(default_factory=dict)
    
    # Administratif
    chef_village: Optional[str] = None
    arrete_prefectoral: Optional[str] = None
    arrete_date: Optional[date] = None
    
    # Transaction
    publier_sur_vitrine: bool = False
    date_cession: Optional[date] = None
    prix_cession: Optional[float] = None
    notes: Optional[str] = None

class LotCreate(LotBase):
    ilot_id: UUID | None = None

class LotUpdate(BaseModel):
    numero_lot: Optional[str] = Field(None, min_length=1, max_length=50)
    superficie: Optional[float] = Field(None, gt=0)
    prix: Optional[float] = None
    statut: Optional[str] = Field(None, pattern=r"^(actif|vendu|litige|reserve|annule|archive)$")
    proprietaire_client_id: Optional[UUID] = None
    proprietaire_nom: Optional[str] = None
    proprietaire_prenom: Optional[str] = None
    proprietaire_naissance_date: Optional[date] = None
    proprietaire_naissance_lieu: Optional[str] = None
    proprietaire_cni_numero: Optional[str] = None
    proprietaire_cni_date: Optional[date] = None
    proprietaire_cni_lieu: Optional[str] = None
    proprietaire_profession: Optional[str] = None
    proprietaire_telephone: Optional[str] = None
    proprietaire_email: Optional[str] = None
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None
    gps_precision: Optional[float] = None
    gps_bornage: Optional[Dict[str, Dict[str, float]]] = None
    chef_village: Optional[str] = None
    arrete_prefectoral: Optional[str] = None
    arrete_date: Optional[date] = None
    publier_sur_vitrine: Optional[bool] = None
    date_cession: Optional[date] = None
    prix_cession: Optional[float] = None
    notes: Optional[str] = None

class LotResponse(LotBase):
    id: UUID
    ilot_id: UUID
    reference: str
    row_version: int
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    deleted_by: Optional[UUID] = None
    deleted_reason: Optional[str] = None
    client_updated_at: Optional[datetime] = None
    last_modified_device_id: Optional[str] = None
    retention_until: Optional[datetime] = None
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
    
    # Relations (pour réponse détaillée)
    hierarchy: Optional[Dict[str, Any]] = None
    proprietaire_client: Optional[Dict[str, Any]] = None
    attestations: Optional[List["AttestationSummary"]] = None

class AttestationSummary(FoncierBase):
    id: UUID
    reference: str
    version: int
    type: str
    statut: str
    date_etablissement: Optional[date] = None
    date_expiration: Optional[datetime] = None

LotResponse.model_rebuild()

class LotSearchParams(BaseModel):
    search: Optional[str] = None
    statut: Optional[str] = None
    village_id: Optional[UUID] = None
    lotissement_id: Optional[UUID] = None
    ilot_id: Optional[UUID] = None
    limit: int = Field(default=50, ge=1, le=200)
    offset: int = Field(default=0, ge=0)

class LotArchiveRequest(BaseModel):
    reason: str = Field(default="archivage", max_length=255)

class DuplicateCheckParams(BaseModel):
    village_id: UUID
    lotissement_id: UUID
    ilot_id: UUID
    numero_lot: str
    exclude_lot_id: Optional[UUID] = None

# ============================================
# ATTESTATIONS
# ============================================

class TemoinCreate(BaseModel):
    nom: str = Field(..., min_length=2, max_length=255)
    prenom: str = Field(..., min_length=2, max_length=255)
    profession: Optional[str] = None
    telephone: Optional[str] = None
    cni: Optional[str] = None

class TemoinResponse(TemoinCreate):
    id: UUID
    attestation_id: UUID
    empreinte_media_id: Optional[UUID] = None
    created_at: datetime

class AttestationBase(FoncierBase):
    type: str = Field(default="standard", pattern=r"^(standard|cession|succession|mutation)$")
    statut: str = Field(default="brouillon", pattern=r"^(brouillon|soumis|valide|archive|revoque|expire|annule)$")
    
    date_etablissement: Optional[date] = None
    date_expiration: Optional[datetime] = None
    
    mode_acquisition: Optional[str] = None
    historique_possession: Optional[str] = None
    domicile: Optional[str] = None
    
    # Cession
    cedant_nom: Optional[str] = None
    cedant_prenom: Optional[str] = None
    cedant_cni_numero: Optional[str] = None
    cedant_telephone: Optional[str] = None
    cedant_domicile: Optional[str] = None
    
    # Limites
    limites_nord: Optional[str] = None
    limites_sud: Optional[str] = None
    limites_est: Optional[str] = None
    limites_ouest: Optional[str] = None
    
    # GPS
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None
    gps_precision: Optional[float] = None
    gps_points: Optional[Dict[str, Any]] = None
    
    # Enregistrement
    registre_volume: Optional[str] = None
    registre_page: Optional[int] = None
    registre_ligne: Optional[int] = None
    numero_enregistrement: Optional[str] = None
    
    # Workflow
    validation_agent_nom: Optional[str] = None
    validation_chef_nom: Optional[str] = None
    
    # Témoins
    temoins: List[TemoinCreate] = Field(default_factory=list)

class AttestationCreate(AttestationBase):
    lot_id: UUID
    proprietaire_client_id: Optional[UUID] = None

class AttestationUpdate(BaseModel):
    type: Optional[str] = Field(None, pattern=r"^(standard|cession|succession|mutation)$")
    statut: Optional[str] = Field(None, pattern=r"^(brouillon|soumis|valide|archive|revoque|expire|annule)$")
    date_etablissement: Optional[date] = None
    date_expiration: Optional[datetime] = None
    mode_acquisition: Optional[str] = None
    historique_possession: Optional[str] = None
    domicile: Optional[str] = None
    cedant_nom: Optional[str] = None
    cedant_prenom: Optional[str] = None
    cedant_cni_numero: Optional[str] = None
    cedant_telephone: Optional[str] = None
    cedant_domicile: Optional[str] = None
    limites_nord: Optional[str] = None
    limites_sud: Optional[str] = None
    limites_est: Optional[str] = None
    limites_ouest: Optional[str] = None
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None
    gps_precision: Optional[float] = None
    gps_points: Optional[Dict[str, Any]] = None
    registre_volume: Optional[str] = None
    registre_page: Optional[int] = None
    registre_ligne: Optional[int] = None
    numero_enregistrement: Optional[str] = None
    validation_agent_nom: Optional[str] = None
    validation_chef_nom: Optional[str] = None
    temoins: Optional[List[TemoinCreate]] = None

class AttestationSubmitRequest(BaseModel):
    agent_nom: str = Field(..., min_length=2, max_length=255)

class AttestationValidateRequest(BaseModel):
    chef_nom: str = Field(..., min_length=2, max_length=255)
    signature_media_id: Optional[UUID] = None
    empreinte_media_id: Optional[UUID] = None

class AttestationScanRequest(BaseModel):
    media_id: UUID
    original_name: str

class AttestationResponse(AttestationBase):
    id: UUID
    lot_id: UUID
    reference: str
    version: int
    proprietaire_client_id: Optional[UUID] = None
    
    # Sécurité
    qr_payload: Optional[str] = None
    signature_numerique: Optional[str] = None
    hash_sha256: Optional[str] = None
    control_number: Optional[str] = None
    signature_nonce: Optional[str] = None
    signature_issued_at: Optional[datetime] = None
    
    # Workflow
    validation_agent_id: Optional[UUID] = None
    validation_agent_date: Optional[datetime] = None
    validation_chef_id: Optional[UUID] = None
    validation_chef_date: Optional[datetime] = None
    
    # Biométrique
    proprietaire_photo_media_id: Optional[UUID] = None
    proprietaire_empreinte_media_id: Optional[UUID] = None
    chef_signature_manuscrite_requise: bool = True
    chef_signature_media_id: Optional[UUID] = None
    chef_empreinte_media_id: Optional[UUID] = None
    temoin_empreinte_media_ids: List[UUID] = Field(default_factory=list)
    
    # Révocation
    revoke_reason: Optional[str] = None
    revoked_at: Optional[datetime] = None
    revoked_by: Optional[UUID] = None
    
    # Documents
    pdf_media_id: Optional[UUID] = None
    pdf_generated_at: Optional[datetime] = None
    printed_by: Optional[UUID] = None
    printed_at: Optional[datetime] = None
    print_count: int = 0
    
    # Témoins
    temoins: List[TemoinResponse] = Field(default_factory=list)
    
    # Audit
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    client_updated_at: Optional[datetime] = None
    last_modified_device_id: Optional[str] = None
    deleted_at: Optional[datetime] = None

class AttestationPdfResponse(BaseModel):
    pdf_url: str
    qr_payload: str
    control_number: str

class AttestationVerificationResponse(BaseModel):
    reference: str
    statut: str
    date_etablissement: Optional[date] = None
    date_expiration: Optional[datetime] = None
    lot: Dict[str, Any]
    village: Dict[str, Any]
    proprietaire: Dict[str, Any]
    verifie_le: datetime
    authentique: bool

# ============================================
# AUDIT / ACTIVITY LOGS
# ============================================

class ActivityLogBase(FoncierBase):
    entity_type: str
    entity_id: UUID
    entity_reference: Optional[str] = None
    action: str
    action_category: str = "data"
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None
    changed_fields: Optional[List[str]] = None
    user_id: Optional[UUID] = None
    user_role: Optional[str] = None
    user_name: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

class ActivityLogCreate(ActivityLogBase):
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    request_id: Optional[UUID] = None
    device_id: Optional[str] = None

class ActivityLogResponse(ActivityLogBase):
    id: UUID
    created_at: datetime

class AuditSearchParams(BaseModel):
    entity_type: Optional[str] = None
    entity_id: Optional[UUID] = None
    action: Optional[str] = None
    user_id: Optional[UUID] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    limit: int = Field(default=50, ge=1, le=500)
    offset: int = Field(default=0, ge=0)

class TimelineResponse(BaseModel):
    entity_type: str
    entity_id: UUID
    entity_reference: str
    events: List[ActivityLogResponse]

# ============================================
# SYNC OFFLINE
# ============================================

class SyncStatusResponse(BaseModel):
    pending: int
    last_sync: Optional[datetime] = None
    last_error: Optional[str] = None
    queue_size: int

class SyncQueueItem(BaseModel):
    id: UUID
    op: str
    payload: Dict[str, Any]
    client_updated_at: datetime
    status: str
    attempts: int
    last_error: Optional[str] = None

class ConflictResolutionRequest(BaseModel):
    resolution: str = Field(..., pattern=r"^(local|server|merge)$")
    merged_data: Optional[Dict[str, Any]] = None
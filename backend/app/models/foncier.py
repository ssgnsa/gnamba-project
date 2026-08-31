# Foncier Models - SQLAlchemy
# Nouveau schéma normalisé pour PostgreSQL local

from sqlalchemy import (
    Column, String, Text, Numeric, Integer, Boolean, Date, DateTime, ForeignKey,
    UniqueConstraint, Index, JSON, ARRAY, UUID as SA_UUID, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID, INET
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

# Import Base from database module to ensure models are registered with the same metadata
from app.core.database import Base

def gen_uuid():
    return str(uuid.uuid4())

# ============================================
# VILLAGES (Niveau 1)
# ============================================
class FoncierVillage(Base):
    __tablename__ = "foncier_villages"
    
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    nom = Column(String(255), nullable=False, unique=True)
    code = Column(String(10), nullable=False, unique=True)
    region = Column(String(255))
    departement = Column(String(255))
    commune = Column(String(255))
    
    # Chef village
    chef_nom = Column(String(255))
    chef_telephone = Column(String(50))
    chef_email = Column(String(255))
    
    # Arrêté préfectoral
    arrete_prefectoral = Column(Text)
    arrete_date = Column(Date)
    
    # Signature
    lieu_signature = Column(String(255))
    nom_signataire = Column(String(255))
    
    # Branding
    logo_media_id = Column(UUID(as_uuid=False), nullable=True)
    primary_color = Column(String(7), default="#1e3a5f")
    secondary_color = Column(String(7), default="#d4a843")
    layout_preference = Column(String(50), default="standard")
    config_jsonb = Column(JSON, default={})
    
    actif = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(UUID(as_uuid=False))
    updated_by = Column(UUID(as_uuid=False))
    
    # Relations
    lotissements = relationship("FoncierLotissement", back_populates="village", cascade="all, delete-orphan")
    user_access = relationship("UserVillageAccess", back_populates="village", cascade="all, delete-orphan")

# ============================================
# LOTISSEMENTS (Niveau 2)
# ============================================
class FoncierLotissement(Base):
    __tablename__ = "foncier_lotissements"
    
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    village_id = Column(UUID(as_uuid=False), ForeignKey("foncier_villages.id", ondelete="RESTRICT"), nullable=False)
    nom = Column(String(255), nullable=False)
    code = Column(String(20))
    description = Column(Text)
    superficie_totale = Column(Numeric(12, 2))
    nombre_lots_prevus = Column(Integer)
    
    arrete_lotissement = Column(Text)
    arrete_date = Column(Date)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(UUID(as_uuid=False))
    updated_by = Column(UUID(as_uuid=False))
    
    # Relations
    village = relationship("FoncierVillage", back_populates="lotissements")
    ilots = relationship("FoncierIlot", back_populates="lotissement", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint("village_id", "nom", name="uq_lotissement_village_nom"),
        Index("idx_lotissement_village", "village_id"),
    )

# ============================================
# ÎLOTS (Niveau 3)
# ============================================
class FoncierIlot(Base):
    __tablename__ = "foncier_ilots"
    
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    lotissement_id = Column(UUID(as_uuid=False), ForeignKey("foncier_lotissements.id", ondelete="RESTRICT"), nullable=False)
    numero = Column(String(50), nullable=False)
    description = Column(Text)
    superficie_totale = Column(Numeric(10, 2))
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(UUID(as_uuid=False))
    updated_by = Column(UUID(as_uuid=False))
    
    # Relations
    lotissement = relationship("FoncierLotissement", back_populates="ilots")
    lots = relationship("FoncierLot", back_populates="ilot", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint("lotissement_id", "numero", name="uq_ilot_lotissement_numero"),
        Index("idx_ilot_lotissement", "lotissement_id"),
    )

# ============================================
# LOTS (Niveau 4)
# ============================================
class FoncierLot(Base):
    __tablename__ = "foncier_lots"
    
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    ilot_id = Column(UUID(as_uuid=False), ForeignKey("foncier_ilots.id", ondelete="RESTRICT"), nullable=False)
    numero_lot = Column(String(50), nullable=False)
    reference = Column(String(100), nullable=False, unique=True)
    
    superficie = Column(Numeric(10, 2), nullable=False)
    prix = Column(Numeric(12, 2))
    
    statut = Column(String(20), nullable=False, default="actif")
    
    # Propriétaire = Client (FK parties)
    proprietaire_client_id = Column(UUID(as_uuid=False), ForeignKey("parties.id", ondelete="SET NULL"))
    
    # Snapshot propriétaire (pour attestation/historique)
    proprietaire_nom = Column(String(255))
    proprietaire_prenom = Column(String(255))
    proprietaire_naissance_date = Column(Date)
    proprietaire_naissance_lieu = Column(String(255))
    proprietaire_cni_numero = Column(String(50))
    proprietaire_cni_date = Column(Date)
    proprietaire_cni_lieu = Column(String(255))
    proprietaire_profession = Column(String(255))
    proprietaire_telephone = Column(String(50))
    proprietaire_email = Column(String(255))
    
    # GPS Centre
    gps_lat = Column(Numeric(9, 6))
    gps_lng = Column(Numeric(9, 6))
    gps_precision = Column(Numeric(5, 2))
    
    # GPS Bornage 4 points (JSONB)
    gps_bornage = Column(JSON, default={})
    
    # Administratif
    chef_village = Column(String(255))
    arrete_prefectoral = Column(Text)
    arrete_date = Column(Date)
    
    # Transaction
    publier_sur_vitrine = Column(Boolean, default=False)
    date_cession = Column(Date)
    prix_cession = Column(Numeric(12, 2))
    notes = Column(Text)
    
    # Audit & Sync
    row_version = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime(timezone=True))
    deleted_by = Column(UUID(as_uuid=False))
    deleted_reason = Column(Text)
    client_updated_at = Column(DateTime(timezone=True))
    last_modified_device_id = Column(String(100))
    retention_until = Column(DateTime(timezone=True))
    created_by = Column(UUID(as_uuid=False))
    updated_by = Column(UUID(as_uuid=False))
    
    # Relations
    ilot = relationship("FoncierIlot", back_populates="lots")
    attestations = relationship("FoncierAttestation", back_populates="lot", cascade="all, delete-orphan")
    proprietaire_client = relationship("Party", foreign_keys=[proprietaire_client_id])
    
    __table_args__ = (
        CheckConstraint("statut IN ('actif', 'vendu', 'litige', 'reserve', 'annule', 'archive')", name='ck_lot_statut'),
        Index("idx_lot_ilot", "ilot_id"),
        Index("idx_lot_reference", "reference"),
        Index("idx_lot_statut", "statut"),
        Index("idx_lot_proprietaire_client", "proprietaire_client_id"),
        Index("idx_lot_deleted", "deleted_at"),
        Index("idx_foncier_lot_vitrine", "publier_sur_vitrine"),
    )

# ============================================
# ATTESTATIONS (Niveau 5)
# ============================================
class FoncierAttestation(Base):
    __tablename__ = "foncier_attestations"
    
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    lot_id = Column(UUID(as_uuid=False), ForeignKey("foncier_lots.id", ondelete="CASCADE"), nullable=False)
    proprietaire_client_id = Column(UUID(as_uuid=False), ForeignKey("parties.id", ondelete="SET NULL"))
    
    reference = Column(String(100), nullable=False, unique=True)
    version = Column(Integer, default=1)
    
    type = Column(String(20), nullable=False, default="standard")
    statut = Column(String(20), nullable=False, default="brouillon")
    
    date_etablissement = Column(Date)
    date_expiration = Column(DateTime(timezone=True))
    
    mode_acquisition = Column(Text)
    historique_possession = Column(Text)
    domicile = Column(Text)
    
    # Cession
    cedant_nom = Column(String(255))
    cedant_prenom = Column(String(255))
    cedant_cni_numero = Column(String(50))
    cedant_telephone = Column(String(50))
    cedant_domicile = Column(Text)
    
    # Limites textuelles
    limites_nord = Column(Text)
    limites_sud = Column(Text)
    limites_est = Column(Text)
    limites_ouest = Column(Text)
    
    # GPS
    gps_lat = Column(Numeric(9, 6))
    gps_lng = Column(Numeric(9, 6))
    gps_precision = Column(Numeric(5, 2))
    gps_points = Column(JSON)
    
    # Enregistrement
    registre_volume = Column(String(50))
    registre_page = Column(Integer)
    registre_ligne = Column(Integer)
    numero_enregistrement = Column(String(100))
    
    # Sécurité & Vérification
    qr_payload = Column(Text)
    signature_numerique = Column(Text)
    hash_sha256 = Column(String(64))
    control_number = Column(String(20))
    signature_nonce = Column(String(64))
    signature_issued_at = Column(DateTime(timezone=True))
    
    # Workflow validation
    validation_agent_nom = Column(String(255))
    validation_agent_id = Column(UUID(as_uuid=False))
    validation_agent_date = Column(DateTime(timezone=True))
    validation_chef_nom = Column(String(255))
    validation_chef_id = Column(UUID(as_uuid=False))
    validation_chef_date = Column(DateTime(timezone=True))
    
    # Biométrique & Signature physique
    proprietaire_photo_media_id = Column(UUID(as_uuid=False))
    proprietaire_empreinte_media_id = Column(UUID(as_uuid=False))
    chef_signature_manuscrite_requise = Column(Boolean, default=True)
    chef_signature_media_id = Column(UUID(as_uuid=False))
    chef_empreinte_media_id = Column(UUID(as_uuid=False))
    temoin_empreinte_media_ids = Column(ARRAY(UUID(as_uuid=False)))
    
    # Révocation
    revoke_reason = Column(Text)
    revoked_at = Column(DateTime(timezone=True))
    revoked_by = Column(UUID(as_uuid=False))
    
    # Documents
    pdf_media_id = Column(UUID(as_uuid=False))
    pdf_generated_at = Column(DateTime(timezone=True))
    printed_by = Column(UUID(as_uuid=False))
    printed_at = Column(DateTime(timezone=True))
    print_count = Column(Integer, default=0)
    
    # Audit
    created_by = Column(UUID(as_uuid=False))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    client_updated_at = Column(DateTime(timezone=True))
    last_modified_device_id = Column(String(100))
    deleted_at = Column(DateTime(timezone=True))
    
    # Relations
    lot = relationship("FoncierLot", back_populates="attestations")
    temoins = relationship("FoncierAttestationTemoin", back_populates="attestation", cascade="all, delete-orphan")
    proprietaire_client = relationship("Party", foreign_keys=[proprietaire_client_id])
    
    __table_args__ = (
        CheckConstraint("type IN ('standard', 'cession', 'succession', 'mutation')", name='ck_attestation_type'),
        CheckConstraint("statut IN ('brouillon', 'soumis', 'valide', 'archive', 'revoque', 'expire', 'annule')", name='ck_attestation_statut'),
        Index("idx_attestation_lot", "lot_id"),
        Index("idx_attestation_reference", "reference"),
        Index("idx_attestation_statut", "statut"),
        Index("idx_attestation_proprietaire_client", "proprietaire_client_id"),
        Index("idx_attestation_expiration", "date_expiration"),
        Index("idx_attestation_deleted", "deleted_at"),
    )

# ============================================
# TÉMOINS ATTESTATION
# ============================================
class FoncierAttestationTemoin(Base):
    __tablename__ = "foncier_attestation_temoins"
    
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    attestation_id = Column(UUID(as_uuid=False), ForeignKey("foncier_attestations.id", ondelete="CASCADE"), nullable=False)
    nom = Column(String(255), nullable=False)
    prenom = Column(String(255), nullable=False)
    profession = Column(String(255))
    telephone = Column(String(50))
    cni = Column(String(50))
    empreinte_media_id = Column(UUID(as_uuid=False))
    # NEW: Link to Entity (unified)
    entity_id = Column(UUID(as_uuid=False), ForeignKey("entities.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    
    attestation = relationship("FoncierAttestation", back_populates="temoins")
    entity = relationship("Entity", foreign_keys=[entity_id])
    
    __table_args__ = (
        Index("idx_temoin_attestation", "attestation_id"),
        Index("idx_temoin_entity_id", "entity_id"),
    )

# ============================================
# ACCÈS UTILISATEUR VILLAGE
# ============================================
class UserVillageAccess(Base):
    __tablename__ = "user_village_access"
    
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), nullable=False)  # Référence users table via API
    village_id = Column(UUID(as_uuid=False), ForeignKey("foncier_villages.id", ondelete="CASCADE"), nullable=False)
    access_level = Column(String(20), nullable=False, default="lecteur")
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    
    village = relationship("FoncierVillage", back_populates="user_access")
    
    __table_args__ = (
        CheckConstraint("access_level IN ('lecteur', 'agent', 'validateur', 'gestionnaire')", name='ck_access_level'),
        UniqueConstraint("user_id", "village_id", name="uq_user_village"),
        Index("idx_user_village_user", "user_id"),
        Index("idx_user_village_village", "village_id"),
    )

# ============================================
# AUDIT UNIFIÉ (activity_logs)
# ============================================
class ActivityLog(Base):
    __tablename__ = "activity_logs"
    
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(UUID(as_uuid=False), nullable=False)
    entity_reference = Column(String(100))
    action = Column(String(50), nullable=False)
    action_category = Column(String(20), default="data")
    old_values = Column(JSON)
    new_values = Column(JSON)
    changed_fields = Column(ARRAY(String))
    user_id = Column(UUID(as_uuid=False))
    user_role = Column(String(50))
    user_name = Column(String(255))
    ip_address = Column(INET)
    user_agent = Column(Text)
    request_id = Column(UUID(as_uuid=False))
    device_id = Column(String(100))
    log_metadata = Column("metadata", JSON, default={})
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    
    __table_args__ = (
        Index("idx_activity_entity", "entity_type", "entity_id"),
        Index("idx_activity_user", "user_id"),
        Index("idx_activity_action", "action"),
        Index("idx_activity_created", "created_at"),
        Index("idx_activity_request", "request_id"),
    )
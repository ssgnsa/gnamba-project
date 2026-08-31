# Party/Client Model - SQLAlchemy
# �� ⚠��️ LEGACY MODEL - TO BE DEPRECATED AFTER MIGRATION TO ENTITY
# Modèle minimal pour la table parties (clients) - DO NOT USE FOR NEW CODE

from sqlalchemy import Column, String, Text, Date, DateTime, Boolean, ForeignKey, Index, UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base
import uuid

def gen_uuid():
    return str(uuid.uuid4())

class Party(Base):
    __tablename__ = "parties"
    
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    
    # �������� �������� ������ ������ ������ ������ ���� ���� ������ ������ ���� ���� ���� ���� �� �� DEPRECATED: Use Entity.type instead
    type = Column(String(20), nullable=False, default="particulier")
    # CheckConstraint("type IN ('particulier', 'entreprise', 'institution')", name='ck_party_type'),
    
    # Identité
    nom = Column(String(255))
    prenom = Column(String(255))
    nom_entreprise = Column(String(255))
    
    # Documents
    cni_numero = Column(String(50))
    cni_date = Column(Date)
    cni_lieu = Column(String(255))
    
    # Contact
    telephone = Column(String(50))
    email = Column(String(255))
    adresse = Column(Text)
    
    # Profession
    profession = Column(String(255))
    employeur = Column(String(255))
    
    # Naissance
    naissance_date = Column(Date)
    naissance_lieu = Column(String(255))
    
    # Nationalité
    nationalite = Column(String(100))
    
    # Statut
    actif = Column(Boolean, default=True)
    
    # NEW: Link to Entity (unified)
    entity_id = Column(UUID(as_uuid=False), ForeignKey("entities.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Métadonnées
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(UUID(as_uuid=False))
    updated_by = Column(UUID(as_uuid=False))
    
    # Relations
    entity = relationship("Entity", foreign_keys=[entity_id])
    
    # Relations inverse (définies dans les autres modèles)
    # foncier_lots_proprietaire = relationship("FoncierLot", foreign_keys="FoncierLot.proprietaire_client_id", back_populates="proprietaire_client")
    # foncier_attestations_proprietaire = relationship("FoncierAttestation", foreign_keys="FoncierAttestation.proprietaire_client_id", back_populates="proprietaire_client")
    
    __table_args__ = (
        Index("idx_party_type", "type"),
        Index("idx_party_client_cni", "cni_numero"),
        Index("idx_party_actif", "actif"),
        Index("idx_party_entity_id", "entity_id"),
    )
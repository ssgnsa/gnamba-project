# Entity Model - SQLAlchemy
# Table unifiée pour toutes les entités : clients, employés, fournisseurs, partenaires, leads, visiteurs

from sqlalchemy import (
    Column, String, Text, Date, DateTime, Boolean, ForeignKey, Index, JSON, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class Entity(Base):
    __tablename__ = "entities"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)

    # === Classification ===
    # Type principal : 'client', 'employee', 'supplier', 'partner', 'lead', 'visitor', 'user'
    type = Column(String(30), nullable=False, index=True)
    # Sous-type : 'particulier', 'entreprise', 'institution', 'commercial', 'artisan', etc.
    subtype = Column(String(50), nullable=True, index=True)
    # Statut : 'active', 'inactive', 'archived', 'pending', 'onboarding'
    status = Column(String(20), nullable=False, default='active', index=True)
    # Nom affiché (calculé ou explicite)
    display_name = Column(String(255), nullable=True)

    # === Identité commune ===
    first_name = Column(String(255), nullable=True)      # Prénom (particulier)
    last_name = Column(String(255), nullable=True)       # Nom (particulier)
    company_name = Column(String(255), nullable=True)    # Raison sociale (entreprise)

    # === Documents d'identité ===
    id_document_type = Column(String(50), nullable=True)     # 'cni', 'passport', 'rc', 'nif', 'rcs', etc.
    id_document_number = Column(String(100), nullable=True)  # Numéro document
    id_document_date = Column(Date, nullable=True)           # Date délivrance
    id_document_place = Column(String(255), nullable=True)   # Lieu délivrance

    # === Contact ===
    phone = Column(String(50), nullable=True, index=True)
    email = Column(String(255), nullable=True, index=True)
    address = Column(Text, nullable=True)

    # === Professionnel ===
    profession = Column(String(255), nullable=True)
    employer = Column(String(255), nullable=True)

    # === Personnel ===
    birth_date = Column(Date, nullable=True)
    birth_place = Column(String(255), nullable=True)
    nationality = Column(String(100), nullable=True)

    # === Métadonnées extensibles (JSONB) ===
    # Exemples d'usage :
    # - client: { "cni_lieu": "...", "segment": "VIP", "credit_limit": 1000000 }
    # - employee: { "matricule": "...", "service": "IT", "grade": "senior" }
    # - supplier: { "payment_terms": "30 jours", "iban": "FR76...", "certifications": ["ISO9001"] }
    # - lead: { "source": "web", "score": 85, "assigned_to": "uuid" }
    entity_metadata = Column("metadata", JSON, default={}, nullable=False)

    # === Audit & Sync ===
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(UUID(as_uuid=False), nullable=True)
    updated_by = Column(UUID(as_uuid=False), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)
    deleted_by = Column(UUID(as_uuid=False), nullable=True)

    # === Relations inverses (définies dans les autres modèles) ===
    foncier_temoins = relationship("FoncierAttestationTemoin", foreign_keys="FoncierAttestationTemoin.entity_id", back_populates="entity")
    properties = relationship("Property", foreign_keys="Property.proprietaire_entity_id", back_populates="proprietaire_entity")
    lease_contracts = relationship("LeaseContract", foreign_keys="LeaseContract.locataire_entity_id", back_populates="locataire_entity")
    rent_payments = relationship("RentPayment", foreign_keys="RentPayment.locataire_entity_id", back_populates="locataire_entity")
    party = relationship("Party", foreign_keys="Party.entity_id", back_populates="entity")
    leads = relationship("Lead", foreign_keys="Lead.entity_id", back_populates="entity")
    finances = relationship("Finances", foreign_keys="Finances.entity_id", back_populates="entity")
    employees = relationship("Employee", foreign_keys="Employee.entity_id", back_populates="entity")
    suppliers = relationship("Supplier", foreign_keys="Supplier.entity_id", back_populates="entity")
    user = relationship("User", foreign_keys="User.entity_id", back_populates="entity")

    __table_args__ = (
        # Index composites pour recherches fréquentes
        Index("idx_entity_type_status", "type", "status"),
        Index("idx_entity_name_search", "last_name", "first_name", "company_name"),
        Index("idx_entity_contact_search", "phone", "email"),
        Index("idx_entity_doc_search", "id_document_type", "id_document_number"),

        # Contrainte d'unicité sur document d'identité (par type)
        # UniqueConstraint("id_document_type", "id_document_number", name="uq_entity_id_doc"),

        # Contrainte de contrôle sur type
        # CheckConstraint("type IN ('client', 'employee', 'supplier', 'partner', 'lead', 'visitor', 'user')", name='ck_entity_type'),
        # CheckConstraint("status IN ('active', 'inactive', 'archived', 'pending', 'onboarding')", name='ck_entity_status'),
    )

    def __repr__(self):
        return f"<Entity(id={self.id}, type={self.type}, display_name={self.display_name})>"

    @property
    def computed_display_name(self) -> str:
        """Calcule le nom d'affichage si non défini explicitement"""
        if self.display_name:
            return self.display_name
        if self.company_name:
            return self.company_name
        parts = []
        if self.first_name:
            parts.append(self.first_name)
        if self.last_name:
            parts.append(self.last_name.upper())
        return " ".join(parts) if parts else f"Entity {str(self.id)[:8]}"

    @property
    def primary_contact(self) -> dict:
        """Retourne les infos de contact principales"""
        return {
            "phone": self.phone,
            "email": self.email,
            "address": self.address,
        }

    @property
    def identity_document(self) -> dict:
        """Retourne les infos du document d'identité"""
        return {
            "type": self.id_document_type,
            "number": self.id_document_number,
            "date": self.id_document_date.isoformat() if self.id_document_date else None,
            "place": self.id_document_place,
        }

    def to_dict(self, include_metadata: bool = True) -> dict:
        """Sérialisation pour API"""
        data = {
            "id": str(self.id),
            "type": self.type,
            "subtype": self.subtype,
            "status": self.status,
            "display_name": self.computed_display_name,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "company_name": self.company_name,
            "phone": self.phone,
            "email": self.email,
            "address": self.address,
            "profession": self.profession,
            "employer": self.employer,
            "birth_date": self.birth_date.isoformat() if self.birth_date else None,
            "birth_place": self.birth_place,
            "nationality": self.nationality,
            "id_document": self.identity_document,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "deleted_at": self.deleted_at.isoformat() if self.deleted_at else None,
        }
        if include_metadata:
            data["metadata"] = self.entity_metadata
        return data
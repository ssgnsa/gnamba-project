# Property/Immobilier Models - SQLAlchemy
# Tables: properties, lease_contracts, rent_payments, immobilier_items

from sqlalchemy import (
    Column, String, Text, Numeric, DateTime, ForeignKey, Boolean, JSON, Index, Integer
)
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class Property(Base):
    __tablename__ = "properties"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    type_bien = Column(String, nullable=True)
    adresse = Column(Text, nullable=True)
    proprietaire = Column(String, nullable=True)  # Keep for backward compatibility
    proprietaire_entity_id = Column(UUID(as_uuid=False), ForeignKey("entities.id", ondelete="SET NULL"), nullable=True, index=True)
    valeur = Column(Numeric(12, 2), nullable=True)
    loyer_mensuel = Column(Numeric(10, 2), nullable=True)
    charges_mensuelles = Column(Numeric(10, 2), nullable=True, default=0)
    statut = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    cover_image_url = Column(String, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(UUID(as_uuid=False), nullable=True)
    updated_by = Column(UUID(as_uuid=False), nullable=True)
    deleted_at = Column(TIMESTAMP(timezone=True), nullable=True)
    deleted_by = Column(UUID(as_uuid=False), nullable=True)

    # Relationships
    proprietaire_entity = relationship("Entity", foreign_keys=[proprietaire_entity_id])
    lease_contracts = relationship("LeaseContract", back_populates="property", cascade="all, delete-orphan")
    rent_payments = relationship("RentPayment", back_populates="property", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_property_statut", "statut"),
        Index("idx_property_proprietaire_entity_id", "proprietaire_entity_id"),
    )


class LeaseContract(Base):
    __tablename__ = "lease_contracts"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    property_id = Column(UUID(as_uuid=False), ForeignKey("properties.id", ondelete="CASCADE"), nullable=True)
    locataire_id = Column(String, nullable=True)  # Keep for backward compatibility
    locataire_entity_id = Column(UUID(as_uuid=False), ForeignKey("entities.id", ondelete="SET NULL"), nullable=True, index=True)
    date_debut = Column(TIMESTAMP(timezone=True), nullable=True)
    date_fin = Column(TIMESTAMP(timezone=True), nullable=True)
    loyer_mensuel = Column(Numeric(10, 2), nullable=True)
    charges_mensuelles = Column(Numeric(10, 2), nullable=True)
    depot_garantie = Column(Numeric(10, 2), nullable=True)
    statut = Column(String, nullable=True, default="actif")
    notes = Column(Text, nullable=True)
    reference = Column(String, nullable=True)
    commission_rate = Column(Numeric(5, 2), default=12.0)
    jour_echeance = Column(Integer, default=10)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(TIMESTAMP(timezone=True), nullable=True)
    deleted_by = Column(UUID(as_uuid=False), nullable=True)

    # Relationships
    property = relationship("Property", back_populates="lease_contracts")
    rent_payments = relationship("RentPayment", back_populates="contract", cascade="all, delete-orphan")
    locataire_entity = relationship("Entity", foreign_keys=[locataire_entity_id])

    __table_args__ = (
        Index("idx_lease_contract_property", "property_id"),
        Index("idx_lease_contract_statut", "statut"),
        Index("idx_lease_contract_locataire_entity_id", "locataire_entity_id"),
    )


class RentPayment(Base):
    __tablename__ = "rent_payments"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    locataire_id = Column(String, nullable=True)  # Keep for backward compatibility
    locataire_entity_id = Column(UUID(as_uuid=False), ForeignKey("entities.id", ondelete="SET NULL"), nullable=True, index=True)
    property_id = Column(UUID(as_uuid=False), ForeignKey("properties.id", ondelete="CASCADE"), nullable=True)
    contract_id = Column(UUID(as_uuid=False), ForeignKey("lease_contracts.id", ondelete="CASCADE"), nullable=True)
    montant = Column(Numeric(10, 2), nullable=True)
    date_paiement = Column(TIMESTAMP(timezone=True), nullable=True)
    date_echeance = Column(TIMESTAMP(timezone=True), nullable=True)
    mois_concerne = Column(String, nullable=True)
    mode_paiement = Column(String, nullable=True)
    statut = Column(String, nullable=True, default="en_attente")
    notes = Column(Text, nullable=True)
    reference = Column(String, nullable=True)
    last_document_type = Column(String, nullable=True)
    last_document_at = Column(TIMESTAMP(timezone=True), nullable=True)
    last_document_by = Column(UUID(as_uuid=False), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(TIMESTAMP(timezone=True), nullable=True)
    deleted_by = Column(UUID(as_uuid=False), nullable=True)

    # Relationships
    property = relationship("Property", back_populates="rent_payments")
    contract = relationship("LeaseContract", back_populates="rent_payments")
    locataire_entity = relationship("Entity", foreign_keys=[locataire_entity_id])

    __table_args__ = (
        Index("idx_rent_payment_property", "property_id"),
        Index("idx_rent_payment_contract", "contract_id"),
        Index("idx_rent_payment_locataire", "locataire_id"),
        Index("idx_rent_payment_locataire_entity_id", "locataire_entity_id"),
        Index("idx_rent_payment_statut", "statut"),
        Index("idx_rent_payment_mois", "mois_concerne"),
    )


class ImmobilierItem(Base):
    __tablename__ = "immobilier_items"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    titre = Column(String, nullable=False)
    ville = Column(String, nullable=True)
    prix = Column(Numeric(12, 2), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_immobilier_item_ville", "ville"),
    )
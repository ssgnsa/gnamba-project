# Finances Models - SQLAlchemy
# Tables: finances, products, suppliers

from sqlalchemy import (
    Column, String, Text, Numeric, DateTime, ForeignKey, Boolean, JSON, Index
)
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class Finances(Base):
    __tablename__ = "finances"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    type = Column(String, nullable=True)  # recette, depense, investissement
    type_transaction = Column(String, nullable=True)  # You can keep both for compatibility
    categorie = Column(String, nullable=True)
    montant = Column(Numeric(12, 2), nullable=True)
    devise = Column(String, nullable=False, default="FCFA")
    date = Column(TIMESTAMP(timezone=True), nullable=True)
    description = Column(Text, nullable=True)
    reference = Column(String, nullable=True)
    document_media_id = Column(UUID(as_uuid=False), nullable=True)
    statut = Column(String, nullable=True, default="brouillon")  # brouillon, valide, annule
    # NEW: Link to Entity (unified client/supplier/partner)
    entity_id = Column(UUID(as_uuid=False), ForeignKey("entities.id", ondelete="SET NULL"), nullable=True, index=True)
    created_by = Column(String, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationship
    entity = relationship("Entity", foreign_keys=[entity_id])

    # Convenience properties to access identity data from linked entity
    @property
    def nom_entity(self):
        """Get name from linked entity"""
        return self.entity.display_name if self.entity else self.nom

    @property
    def telephone_entity(self):
        """Get phone from linked entity"""
        return self.entity.phone if self.entity else self.telephone

    @property
    def email_entity(self):
        """Get email from linked entity"""
        return self.entity.email if self.entity else self.email

    @property
    def adresse_entity(self):
        """Get address from linked entity"""
        return self.entity.address if self.entity else self.adresse

    __table_args__ = (
        Index("idx_finances_type", "type"),
        Index("idx_finances_categorie", "categorie"),
        Index("idx_finances_date", "date"),
        Index("idx_finances_statut", "statut"),
        Index("idx_finances_entity_id", "entity_id"),
    )


class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    designation = Column(String, nullable=True)
    nom = Column(String, nullable=False)
    categorie = Column(String, nullable=True)
    prix_unitaire = Column(Numeric(10, 2), nullable=True)
    stock_actuel = Column(Numeric(10, 2), nullable=True, default=0)
    stock_minimum = Column(Numeric(10, 2), nullable=True, default=0)
    unite = Column(String, nullable=True)  # kg, m, l, pce, etc.
    description = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    supplier_id = Column(UUID(as_uuid=False), ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationship
    supplier = relationship("Supplier", back_populates="products")

    __table_args__ = (
        Index("idx_product_nom", "nom"),
        Index("idx_product_categorie", "categorie"),
        Index("idx_product_supplier", "supplier_id"),
        Index("idx_product_stock", "stock_actuel", "stock_minimum"),
    )


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    # Supplier-specific fields (identity moved to Entity)
    produits_fournis = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    contact_nom = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)

    # Link to Entity (unified person/organization) - NOW MANDATORY
    entity_id = Column(UUID(as_uuid=False), ForeignKey("entities.id", ondelete="SET NULL"), nullable=False, index=True)

    # Relationship
    entity = relationship("Entity", foreign_keys=[entity_id])
    products = relationship("Product", back_populates="supplier")

    # Convenience properties to access identity data from linked entity
    @property
    def nom_entity(self):
        """Get name from linked entity"""
        return self.entity.display_name if self.entity else self.nom

    @property
    def telephone_entity(self):
        """Get phone from linked entity"""
        return self.entity.phone if self.entity else self.telephone

    @property
    def email_entity(self):
        """Get email from linked entity"""
        return self.entity.email if self.entity else self.email

    @property
    def adresse_entity(self):
        """Get address from linked entity"""
        return self.entity.address if self.entity else self.adresse
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_supplier_entity_id", "entity_id"),
    )
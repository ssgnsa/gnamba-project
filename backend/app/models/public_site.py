# Page Builder / Public Website Models - SQLAlchemy
# Tables: page_layouts, site_content, site_realisations, vitrine_lots, contact_messages

from sqlalchemy import (
    Column, String, Text, Numeric, DateTime, ForeignKey, Boolean, JSON, Index, ARRAY, Integer
)
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class PageLayout(Base):
    __tablename__ = "page_layouts"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    page_key = Column(String(100), nullable=False, unique=True)
    page_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    layout_json = Column(JSON, default=list, nullable=False)
    seo_title = Column(String(255), nullable=True)
    seo_description = Column(Text, nullable=True)
    seo_keywords = Column(ARRAY(String), default=list, nullable=False)
    og_image_media_id = Column(UUID(as_uuid=False), ForeignKey("media_files.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    updated_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    __table_args__ = (
        Index("idx_page_layout_active", "is_active"),
    )


class SiteContent(Base):
    __tablename__ = "site_content"
    __table_args__ = (
        Index("idx_site_content_section", "section"),
    )

    section = Column(String, primary_key=True, nullable=False)
    key = Column(String, primary_key=True, nullable=False)
    value = Column(Text, nullable=True)
    type = Column(String, nullable=True)  # text, html, json, image, etc.


class SiteRealisation(Base):
    __tablename__ = "site_realisations"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    titre = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    categorie = Column(String, nullable=True)
    statut = Column(String, nullable=True, default="brouillon")
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_site_realisation_categorie", "categorie"),
        Index("idx_site_realisation_statut", "statut"),
    )


class VitrineLot(Base):
    __tablename__ = "vitrine_lots"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    lot_id = Column(UUID(as_uuid=False), nullable=True)
    property_id = Column(UUID(as_uuid=False), nullable=True)
    titre = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    prix = Column(Numeric(12, 2), nullable=True)
    surface = Column(Numeric(10, 2), nullable=True)
    localisation = Column(String, nullable=True)
    photos = Column(JSON, nullable=True, default=list)
    publier = Column(Boolean, nullable=True, default=True)
    ordre = Column(Integer, nullable=True, default=0)
    tags = Column(JSON, nullable=True, default=list)
    reference = Column(String, nullable=True)
    village = Column(String, nullable=True)
    quartier = Column(String, nullable=True)
    commune = Column(String, nullable=True)
    departement = Column(String, nullable=True)
    region = Column(String, nullable=True)
    superficie = Column(Numeric(10, 2), nullable=True)
    prix_vente = Column(Numeric(12, 2), nullable=True)
    statut = Column(String, nullable=True, default="disponible")
    documents = Column(JSON, nullable=True, default=list)
    caracteristiques = Column(JSON, nullable=True, default=dict)
    image_url = Column(String, nullable=True)
    image_alt = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)
    contact_email = Column(String, nullable=True)
    publier_sur_vitrine = Column(Boolean, nullable=True, default=True)
    ordre_affichage = Column(Integer, nullable=True, default=0)
    notes = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=False), nullable=True)
    updated_by = Column(UUID(as_uuid=False), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_vitrine_lot_reference", "reference"),
        Index("idx_vitrine_lot_statut", "statut"),
        Index("idx_vitrine_lot_publie", "publier_sur_vitrine"),
    )


class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    nom = Column(String, nullable=False)
    email = Column(String, nullable=False)
    telephone = Column(String, nullable=True)
    sujet = Column(String, nullable=True)
    message = Column(Text, nullable=False)
    statut = Column(String, nullable=True, default="nouveau")  # nouveau, en_cours, traite, archive
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_contact_message_email", "email"),
        Index("idx_contact_message_statut", "statut"),
        Index("idx_contact_message_date", "created_at"),
    )
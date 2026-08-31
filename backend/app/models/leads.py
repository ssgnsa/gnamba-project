# Leads/CRM Models - SQLAlchemy
# Tables: leads, lead_campaigns, lead_captures, lead_interactions, party_lead_details, party_roles

from sqlalchemy import (
    Column, String, Text, Numeric, DateTime, ForeignKey, Boolean, JSON, Index, ARRAY, Integer
)
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP, INET
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class Lead(Base):
    __tablename__ = "leads"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    reference = Column(String(50), nullable=False, unique=True)
    source = Column(String(50), nullable=False)
    campaign_id = Column(UUID(as_uuid=False), ForeignKey("lead_campaigns.id", ondelete="SET NULL"), nullable=True)
    # Link to Entity (unified person/organization) - NOW MANDATORY
    entity_id = Column(UUID(as_uuid=False), ForeignKey("entities.id", ondelete="SET NULL"), nullable=False, index=True)

    # Relationship
    entity = relationship("Entity", foreign_keys=[entity_id])

    # Convenience properties to access identity data from linked entity
    @property
    def nom_complet(self):
        """Get full name from linked entity"""
        if self.entity:
            return self.entity.display_name or f"{self.entity.first_name or ''} {self.entity.last_name or ''}".strip()
        # Fallback to legacy fields during transition
        return f"{self.prenom or ''} {self.nom or ''}".strip()

    @property
    def email_entity(self):
        """Get email from linked entity"""
        return self.entity.email if self.entity else self.email

    @property
    def telephone_entity(self):
        """Get phone from linked entity"""
        return self.entity.phone if self.entity else self.telephone

    @property
    def adresse_entity(self):
        """Get address from linked entity"""
        return self.entity.address if self.entity else self.adresse
    nom = Column(String(255), nullable=True)
    prenom = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    telephone = Column(String(50), nullable=True)
    adresse = Column(Text, nullable=True)
    ville = Column(String(100), nullable=True)
    budget_min = Column(Numeric(12, 2), nullable=True)
    budget_max = Column(Numeric(12, 2), nullable=True)
    type_bien_recherche = Column(String(50), nullable=True)
    surface_min = Column(Numeric(10, 2), nullable=True)
    surface_max = Column(Numeric(10, 2), nullable=True)
    statut = Column(String(20), nullable=False, default="nouveau")
    score = Column(Integer, nullable=False, default=0)
    qualifie = Column(Boolean, nullable=False, default=False)
    date_qualification = Column(TIMESTAMP(timezone=True), nullable=True)
    assigne_a = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes = Column(Text, nullable=True)
    metadata_json = Column(JSON, nullable=False, default={})
    row_version = Column(Integer, nullable=False, default=1)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(TIMESTAMP(timezone=True), nullable=True)
    deleted_by = Column(UUID(as_uuid=False), nullable=True)
    deleted_reason = Column(Text, nullable=True)
    client_updated_at = Column(TIMESTAMP(timezone=True), nullable=True)
    last_modified_device_id = Column(String(100), nullable=True)
    retention_until = Column(TIMESTAMP(timezone=True), nullable=True)
    created_by = Column(UUID(as_uuid=False), nullable=True)
    updated_by = Column(UUID(as_uuid=False), nullable=True)

    # Relationship
    campaign = relationship("LeadCampaign", back_populates="leads")
    entity = relationship("Entity", foreign_keys=[entity_id])

    __table_args__ = (
        Index("idx_lead_reference", "reference"),
        Index("idx_lead_statut", "statut"),
        Index("idx_lead_source", "source"),
        Index("idx_lead_assigne", "assigne_a"),
        Index("idx_lead_campaign", "campaign_id"),
        Index("idx_lead_qualifie", "qualifie"),
        Index("idx_lead_entity_id", "entity_id"),
    )


class LeadCampaign(Base):
    __tablename__ = "lead_campaigns"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    nom = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    type_campagne = Column(String, nullable=False, default="digital")
    statut = Column(String, nullable=False, default="brouillon")
    date_debut = Column(TIMESTAMP(timezone=True), nullable=True)
    date_fin = Column(TIMESTAMP(timezone=True), nullable=True)
    budget = Column(Numeric(12, 2), nullable=True)
    cout_reel = Column(Numeric(12, 2), nullable=True)
    cible = Column(Text, nullable=True)
    canaux = Column(ARRAY(String), nullable=False, default=[])
    kpi_cibles = Column(JSON, nullable=False, default={})
    kpi_reels = Column(JSON, nullable=False, default={})
    notes = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationship
    leads = relationship("Lead", back_populates="campaign")

    __table_args__ = (
        Index("idx_lead_campaign_statut", "statut"),
        Index("idx_lead_campaign_type", "type_campagne"),
        Index("idx_lead_campaign_dates", "date_debut", "date_fin"),
    )


class LeadCapture(Base):
    __tablename__ = "lead_captures"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    campaign_id = Column(UUID(as_uuid=False), ForeignKey("lead_campaigns.id", ondelete="SET NULL"), nullable=True)
    form_name = Column(String(100), nullable=True)
    page_url = Column(String(500), nullable=True)
    utm_source = Column(String(100), nullable=True)
    utm_medium = Column(String(100), nullable=True)
    utm_campaign = Column(String(100), nullable=True)
    utm_content = Column(String(100), nullable=True)
    utm_term = Column(String(100), nullable=True)
    referrer = Column(String(500), nullable=True)
    user_agent = Column(Text, nullable=True)
    ip_address = Column(INET, nullable=True)
    country = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    data_json = Column(JSON, nullable=False, default={})
    lead_id = Column(UUID(as_uuid=False), ForeignKey("leads.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_capture_campaign", "campaign_id"),
        Index("idx_capture_lead", "lead_id"),
        Index("idx_capture_created", "created_at"),
    )


class LeadInteraction(Base):
    __tablename__ = "lead_interactions"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    lead_id = Column(UUID(as_uuid=False), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(50), nullable=False)
    direction = Column(String(20), nullable=False)
    sujet = Column(String(255), nullable=True)
    contenu = Column(Text, nullable=True)
    resultat = Column(String(50), nullable=True)
    prochaine_action = Column(Text, nullable=True)
    prochaine_action_date = Column(TIMESTAMP(timezone=True), nullable=True)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    metadata_json = Column(JSON, nullable=False, default={})
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    lead = relationship("Lead", backref="interactions")

    __table_args__ = (
        Index("idx_interaction_lead", "lead_id"),
        Index("idx_interaction_user", "user_id"),
        Index("idx_interaction_type", "type"),
        Index("idx_interaction_created", "created_at"),
    )


class PartyLeadDetail(Base):
    __tablename__ = "party_lead_details"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    party_id = Column(UUID(as_uuid=False), ForeignKey("parties.id", ondelete="CASCADE"), nullable=False)
    lead_id = Column(UUID(as_uuid=False), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), nullable=False, default="contact")
    notes = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_party_lead_party", "party_id"),
        Index("idx_party_lead_lead", "lead_id"),
        Index("idx_party_lead_unique", "party_id", "lead_id", unique=True),
    )


class PartyRole(Base):
    __tablename__ = "party_roles"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    party_id = Column(UUID(as_uuid=False), ForeignKey("parties.id", ondelete="CASCADE"), nullable=False)
    role_type = Column(String(50), nullable=False)
    context_type = Column(String(50), nullable=True)
    context_id = Column(UUID(as_uuid=False), nullable=True)
    date_debut = Column(TIMESTAMP(timezone=True), nullable=True)
    date_fin = Column(TIMESTAMP(timezone=True), nullable=True)
    actif = Column(Boolean, nullable=False, default=True)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_party_role_party", "party_id"),
        Index("idx_party_role_type", "role_type"),
        Index("idx_party_role_context", "context_type", "context_id"),
    )
# Visits/Stats Models - SQLAlchemy
# Tables: visiteurs, visites_du_jour, visites_en_cours, activites_journal, stats_journalieres

from sqlalchemy import (
    Column, String, Text, Numeric, Integer, DateTime, ForeignKey, Boolean, JSON, Index
)
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class Visiteur(Base):
    __tablename__ = "visiteurs"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    nom = Column(String, nullable=True)
    prenom = Column(String, nullable=True)
    telephone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    societe = Column(String, nullable=True)
    motif = Column(String, nullable=True)
    date_arrivee = Column(TIMESTAMP(timezone=True), nullable=True)
    heure_arrivee = Column(String, nullable=True)
    heure_depart = Column(String, nullable=True)
    statut = Column(String, nullable=True, default="present")  # present, parti, en_attente
    badge_numero = Column(String, nullable=True)
    accompagnateur = Column(String, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_visiteur_date", "date_arrivee"),
        Index("idx_visiteur_statut", "statut"),
        Index("idx_visiteur_societe", "societe"),
    )


class VisiteDuJour(Base):
    __tablename__ = "visites_du_jour"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    client_nom = Column(String, nullable=True)
    client_telephone = Column(String, nullable=True)
    lot_id = Column(UUID(as_uuid=False), nullable=True)  # Reference to foncier_lots
    date_arrivee = Column(TIMESTAMP(timezone=True), nullable=True)
    heure_arrivee = Column(String, nullable=True)
    statut = Column(String, nullable=True, default="planifiee")  # planifiee, en_cours, terminee, annulee
    agent_id = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_visite_jour_date", "date_arrivee"),
        Index("idx_visite_jour_lot", "lot_id"),
        Index("idx_visite_jour_statut", "statut"),
        Index("idx_visite_jour_agent", "agent_id"),
    )


class VisiteEnCours(Base):
    __tablename__ = "visites_en_cours"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    visite_id = Column(UUID(as_uuid=False), ForeignKey("visites_du_jour.id", ondelete="CASCADE"), nullable=True)
    client_nom = Column(String, nullable=True)
    client_telephone = Column(String, nullable=True)
    lot_id = Column(UUID(as_uuid=False), nullable=True)
    date_debut = Column(TIMESTAMP(timezone=True), nullable=True)
    date_fin = Column(TIMESTAMP(timezone=True), nullable=True)
    statut = Column(String, nullable=True, default="en_cours")
    agent_id = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_visite_cours_visite", "visite_id"),
        Index("idx_visite_cours_statut", "statut"),
    )


class ActiviteJournal(Base):
    __tablename__ = "activites_journal"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    titre = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    type = Column(String, nullable=True)  # reunion, visite, appel, tache, etc.
    employee_id = Column(UUID(as_uuid=False), nullable=True)  # Reference to employees
    date = Column(TIMESTAMP(timezone=True), nullable=True)
    heure_debut = Column(String, nullable=True)
    heure_fin = Column(String, nullable=True)
    statut = Column(String, nullable=True, default="planifiee")  # planifiee, en_cours, terminee, annulee
    priorite = Column(String, nullable=True, default="normale")
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_activite_journal_employee", "employee_id"),
        Index("idx_activite_journal_date", "date"),
        Index("idx_activite_journal_statut", "statut"),
    )


class StatsJournalieres(Base):
    __tablename__ = "stats_journalieres"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    date = Column(TIMESTAMP(timezone=True), nullable=False, unique=True)
    visites = Column(Integer, default=0)
    contacts = Column(Integer, default=0)
    ventes = Column(Integer, default=0)
    chiffre_affaires = Column(Numeric(12, 2), default=0)
    nouveaux_leads = Column(Integer, default=0)
    contrats_signes = Column(Integer, default=0)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_stats_date", "date", unique=True),
    )
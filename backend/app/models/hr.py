# HR/Employees Models - SQLAlchemy
# Tables: employees, tasks, employes_presence, messages_direction

from sqlalchemy import (
    Column, String, Text, DateTime, ForeignKey, Boolean, JSON, Index, Enum as SQLEnum, Numeric
)
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.core.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class EmployeePresenceStatus(str, enum.Enum):
    PRESENT = "present"
    ABSENT = "absent"
    EN_PAUSE = "en_pause"
    EN_DEPLACEMENT = "en_deplacement"


class Employee(Base):
    __tablename__ = "employees"

    # Primary key
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    
    # HR-specific fields (identity moved to Entity)
    matricule = Column(String(50), unique=True, nullable=True)
    poste = Column(String, nullable=True)
    service = Column(String, nullable=True)
    date_embauche = Column(TIMESTAMP(timezone=True), nullable=True)
    salaire = Column(Numeric(10, 2), nullable=True)
    statut = Column(String, nullable=True, default="actif")  # actif, inactif, conge
    photo_media_id = Column(UUID(as_uuid=False), nullable=True)

    # Link to Entity (unified person/organization) - NOW MANDATORY
    entity_id = Column(UUID(as_uuid=False), ForeignKey("entities.id", ondelete="SET NULL"), nullable=False, index=True)

    # Relationship
    entity = relationship("Entity", foreign_keys=[entity_id])

    # Relationships
    tasks = relationship("Task", back_populates="employee", cascade="all, delete-orphan")
    presences = relationship("EmployeePresence", back_populates="employee", cascade="all, delete-orphan")
    messages_sent = relationship("MessageDirection", back_populates="expediteur", foreign_keys="MessageDirection.expediteur_id")
    messages_received = relationship("MessageDirection", back_populates="destinataire", foreign_keys="MessageDirection.destinataire_id")

    # Convenience properties to access identity data from linked entity
    @property
    def nom_complet(self):
        """Get full name from linked entity"""
        if self.entity:
            return self.entity.display_name or f"{self.entity.first_name or ''} {self.entity.last_name or ''}".strip()
        return None

    @property
    def email_entity(self):
        """Get email from linked entity"""
        return self.entity.email if self.entity else None

    @property
    def telephone_entity(self):
        """Get phone from linked entity"""
        return self.entity.phone if self.entity else None

    __table_args__ = (
        Index("idx_employee_matricule", "matricule"),
        Index("idx_employee_statut", "statut"),
        Index("idx_employee_service", "service"),
    )


class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    titre = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    statut = Column(String, nullable=False, default="a_faire")  # a_faire, en_cours, termine, annule
    priorite = Column(String, nullable=True, default="normale")  # basse, normale, haute, urgente
    date_debut = Column(TIMESTAMP(timezone=True), nullable=True)
    date_echeance = Column(TIMESTAMP(timezone=True), nullable=True)
    date_completion = Column(TIMESTAMP(timezone=True), nullable=True)
    employee_id = Column(UUID(as_uuid=False), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    project_id = Column(UUID(as_uuid=False), nullable=True)  # Could be projects or foncier project
    assigned_by = Column(String, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationship
    employee = relationship("Employee", back_populates="tasks")

    __table_args__ = (
        Index("idx_task_employee", "employee_id"),
        Index("idx_task_statut", "statut"),
        Index("idx_task_priorite", "priorite"),
        Index("idx_task_dates", "date_debut", "date_echeance"),
    )


class EmployeePresence(Base):
    __tablename__ = "employes_presence"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    employee_id = Column(UUID(as_uuid=False), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    statut = Column(SQLEnum(EmployeePresenceStatus), nullable=False, default=EmployeePresenceStatus.ABSENT)
    last_activity = Column(TIMESTAMP(timezone=True), nullable=True)
    latitude = Column(Numeric(9, 6), nullable=True)
    longitude = Column(Numeric(9, 6), nullable=True)
    pointage_debut = Column(TIMESTAMP(timezone=True), nullable=True)
    pointage_fin = Column(TIMESTAMP(timezone=True), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationship
    employee = relationship("Employee", back_populates="presences")

    __table_args__ = (
        Index("idx_presence_employee_date", "employee_id", "pointage_debut"),
        Index("idx_presence_statut", "statut"),
    )


class MessageDirection(Base):
    __tablename__ = "messages_direction"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    titre = Column(String, nullable=False)
    contenu = Column(Text, nullable=True)
    type = Column(String, nullable=True)  # info, alerte, annonce, etc.
    priorite = Column(String, nullable=True, default="normale")  # basse, normale, haute, critique
    cibles_tous_employes = Column(Boolean, default=False)
    cibles_services = Column(JSON, nullable=True)  # Array of service names
    cibles_employes = Column(JSON, nullable=True)  # Array of employee IDs
    date_expiration = Column(TIMESTAMP(timezone=True), nullable=True)
    statut = Column(String, nullable=True, default="brouillon")  # brouillon, envoye, archive
    date_publication = Column(TIMESTAMP(timezone=True), nullable=True)
    destinataire_id = Column(UUID(as_uuid=False), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    expediteur_id = Column(UUID(as_uuid=False), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    date_envoi = Column(TIMESTAMP(timezone=True), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    expediteur = relationship("Employee", back_populates="messages_sent", foreign_keys=[expediteur_id])
    destinataire = relationship("Employee", back_populates="messages_received", foreign_keys=[destinataire_id])

    __table_args__ = (
        Index("idx_message_expediteur", "expediteur_id"),
        Index("idx_message_destinataire", "destinataire_id"),
        Index("idx_message_statut", "statut"),
        Index("idx_message_date_pub", "date_publication"),
    )
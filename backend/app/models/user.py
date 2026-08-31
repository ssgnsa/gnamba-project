"""SQLAlchemy models for EGS."""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Enum, Integer, Text, ForeignKey, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import enum

from app.core.database import Base


class RoleEnum(str, enum.Enum):
    ADMIN = "admin"
    GESTIONNAIRE = "gestionnaire"
    EMPLOYE = "employe"
    GUEST = "guest"


class AccessLevelEnum(str, enum.Enum):
    ADMIN = "admin"
    GESTIONNAIRE = "gestionnaire"
    EMPLOYE = "employe"
    GUEST = "guest"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, nullable=False, index=True, unique=True)
    full_name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default=RoleEnum.EMPLOYE.value, nullable=False)
    access_level = Column(String, default=AccessLevelEnum.EMPLOYE.value, nullable=False)
    poste = Column(String, nullable=True)
    department = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    is_active = Column(Integer, default=1, nullable=False)

    # Link to Entity (unified person/organization) - NOW MANDATORY
    entity_id = Column(UUID(as_uuid=False), ForeignKey("entities.id", ondelete="SET NULL"), nullable=False, index=True)

    # Relationship
    entity = relationship("Entity", foreign_keys=[entity_id])

    def to_dict(self):
        """Convert model to dictionary."""
        entity_data = {}
        if self.entity:
            entity_data = {
                "email": self.entity.email,
                "full_name": self.entity.display_name or f"{self.entity.first_name or ''} {self.entity.last_name or ''}".strip(),
                "phone": self.entity.phone,
                "poste": self.entity.entity_metadata.get('poste') if self.entity.entity_metadata else None,
                "department": self.entity.entity_metadata.get('department') if self.entity.entity_metadata else None,
            }

        email = self.email or entity_data.get("email")
        full_name = self.full_name or entity_data.get("full_name")
        phone = self.phone or entity_data.get("phone")
        poste = self.poste if self.poste is not None else entity_data.get("poste")
        department = self.department if self.department is not None else entity_data.get("department")

        return {
            "id": self.id,
            "email": email,
            "full_name": full_name,
            "role": self.role.value if isinstance(self.role, RoleEnum) else self.role,
            "access_level": self.access_level.value if isinstance(self.access_level, AccessLevelEnum) else self.access_level,
            "poste": poste,
            "department": department,
            "phone": phone,
            "entity_id": self.entity_id,
        }


class AuthSession(Base):
    __tablename__ = "auth_sessions"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, nullable=False, index=True)
    refresh_token_hash = Column(String, nullable=False, unique=True, index=True)
    user_agent = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_seen_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    revoked_reason = Column(String, nullable=True)
    compromised_at = Column(DateTime(timezone=True), nullable=True)

    def to_dict(self):
        """Convert model to dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "refresh_token_hash": self.refresh_token_hash,
            "user_agent": self.user_agent,
            "ip_address": self.ip_address,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_seen_at": self.last_seen_at.isoformat() if self.last_seen_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "revoked_at": self.revoked_at.isoformat() if self.revoked_at else None,
            "revoked_reason": self.revoked_reason,
            "compromised_at": self.compromised_at.isoformat() if self.compromised_at else None,
        }


class AuthAuditLog(Base):
    __tablename__ = "auth_audit_logs"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, nullable=True, index=True)
    email = Column(String, nullable=True, index=True)
    action = Column(String, nullable=False, index=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def to_dict(self):
        """Convert model to dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "email": self.email,
            "action": self.action,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "metadata_json": self.metadata_json,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class AuthLoginFailure(Base):
    __tablename__ = "auth_login_failures"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, nullable=False, index=True)
    ip_address = Column(String, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def to_dict(self):
        """Convert model to dictionary."""
        return {
            "id": self.id,
            "email": self.email,
            "ip_address": self.ip_address,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
"""SQLAlchemy models for EGS."""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Enum, Integer
from sqlalchemy.sql import func
import enum

from backend.app.core.database import Base


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
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default=RoleEnum.EMPLOYE.value, nullable=False)
    access_level = Column(String, default=AccessLevelEnum.EMPLOYE.value, nullable=False)
    poste = Column(String, nullable=True)
    department = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    is_active = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def to_dict(self):
        """Convert model to dictionary."""
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role.value if isinstance(self.role, RoleEnum) else self.role,
            "access_level": self.access_level.value if isinstance(self.access_level, AccessLevelEnum) else self.access_level,
            "poste": self.poste,
            "department": self.department,
            "phone": self.phone,
        }

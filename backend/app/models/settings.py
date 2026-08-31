# Settings/Config Models - SQLAlchemy
# Tables: app_settings (key-value), user_profiles
# NOTE: These models match the migration 014_settings_tables

from sqlalchemy import (
    Column, String, Text, DateTime, ForeignKey, Boolean, JSON, Index, Integer
)
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class AppSettings(Base):
    """Key-value settings table - matches migration 014_settings_tables"""
    __tablename__ = "app_settings"

    id = Column(UUID(as_uuid=False), primary_key=True)
    key = Column(String(100), nullable=False, unique=True)
    value = Column(JSON, nullable=False)
    value_type = Column(String(20), nullable=False, default="json")
    category = Column(String(50), nullable=False, default="general")
    description = Column(Text, nullable=True)
    is_public = Column(Boolean, nullable=False, default=False)
    is_editable = Column(Boolean, nullable=False, default=True)
    validation_schema = Column(JSON, nullable=True)
    default_value = Column(JSON, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_app_settings_category", "category"),
        Index("idx_app_settings_public", "is_public"),
    )


class UserProfile(Base):
    """User profiles table - matches migration 014_settings_tables"""
    __tablename__ = "user_profiles"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    avatar_media_id = Column(UUID(as_uuid=False), ForeignKey("media_files.id", ondelete="SET NULL"), nullable=True)
    theme = Column(String(20), nullable=False, default="light")
    language = Column(String(10), nullable=False, default="fr")
    timezone = Column(String(50), nullable=False, default="Africa/Abidjan")
    date_format = Column(String(20), nullable=False, default="DD/MM/YYYY")
    notifications_email = Column(Boolean, nullable=False, default=True)
    notifications_push = Column(Boolean, nullable=False, default=True)
    notifications_sms = Column(Boolean, nullable=False, default=False)
    dashboard_layout = Column(JSON, nullable=False, default={})
    sidebar_collapsed = Column(Boolean, nullable=False, default=False)
    preferences = Column(JSON, nullable=False, default={})
    last_login_at = Column(TIMESTAMP(timezone=True), nullable=True)
    last_login_ip = Column(String, nullable=True)  # INET stored as string for simplicity
    login_count = Column(Integer, nullable=False, default=0)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_user_profile_user", "user_id"),
    )
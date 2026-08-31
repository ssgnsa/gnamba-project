# Media Models - SQLAlchemy
# Tables: media_files, media_versions, media_usage, media_audit_logs

from sqlalchemy import (
    Column, String, Text, Integer, Boolean, DateTime, ForeignKey, BigInteger, ARRAY, JSON, Index
)
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class MediaFile(Base):
    __tablename__ = "media_files"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    filename = Column(String, nullable=False)
    storage_key = Column(String, nullable=True)
    original_name = Column(String, nullable=False, default="")
    url = Column(String, nullable=False, default="")
    thumbnail_url = Column(String, nullable=True)
    category = Column(String, nullable=False, default="autre")
    uploaded_by = Column(String, nullable=True)
    upload_date = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    size = Column(BigInteger, nullable=False, default=0)
    type = Column(String, nullable=False, default="")
    alt_text = Column(String, nullable=False, default="")
    description = Column(String, nullable=False, default="")
    tags = Column(ARRAY(String), nullable=False, default=[])
    is_brand_asset = Column(Boolean, nullable=False, default=False)
    brand_asset_type = Column(String, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(TIMESTAMP(timezone=True), nullable=True)
    deleted_by = Column(String, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)

    # Relationships
    versions = relationship("MediaVersion", back_populates="media", cascade="all, delete-orphan")
    usages = relationship("MediaUsage", back_populates="media", cascade="all, delete-orphan")
    audit_logs = relationship("MediaAuditLog", back_populates="media", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_media_category", "category"),
        Index("idx_media_uploaded_by", "uploaded_by"),
        Index("idx_media_brand_asset", "is_brand_asset", "brand_asset_type"),
        Index("idx_media_deleted", "deleted_at"),
    )


class MediaVersion(Base):
    __tablename__ = "media_versions"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    media_id = Column(UUID(as_uuid=False), ForeignKey("media_files.id", ondelete="CASCADE"), nullable=False)
    version_number = Column(Integer, nullable=False, default=1)
    old_url = Column(String, nullable=False, default="")
    old_filename = Column(String, nullable=False, default="")
    replaced_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    replaced_by = Column(String, nullable=True)

    # Relationship
    media = relationship("MediaFile", back_populates="versions")

    __table_args__ = (
        Index("idx_media_version_media", "media_id"),
        Index("idx_media_version_number", "media_id", "version_number"),
    )


class MediaUsage(Base):
    __tablename__ = "media_usage"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    media_id = Column(UUID(as_uuid=False), ForeignKey("media_files.id", ondelete="CASCADE"), nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id = Column(String, nullable=True)
    usage_type = Column(String, nullable=False)
    label = Column(String, nullable=False, default="")
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationship
    media = relationship("MediaFile", back_populates="usages")

    __table_args__ = (
        Index("idx_media_usage_entity", "entity_type", "entity_id"),
        Index("idx_media_usage_media", "media_id"),
        Index("idx_media_usage_type", "usage_type"),
    )


class MediaAuditLog(Base):
    __tablename__ = "media_audit_logs"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    media_id = Column(UUID(as_uuid=False), ForeignKey("media_files.id", ondelete="SET NULL"), nullable=True)
    action = Column(String, nullable=False)
    actor_id = Column(String, nullable=True)
    log_metadata = Column("metadata", JSON, default={})
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationship
    media = relationship("MediaFile", back_populates="audit_logs")

    __table_args__ = (
        Index("idx_media_audit_media", "media_id"),
        Index("idx_media_audit_actor", "actor_id"),
        Index("idx_media_audit_action", "action"),
        Index("idx_media_audit_created", "created_at"),
    )
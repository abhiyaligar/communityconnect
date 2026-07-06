"""
CommunityConnect Backend - Regional Scoping Models
"""

import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base


class LocalAdminRegion(Base):
    __tablename__ = "local_admin_regions"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    region_id = Column(UUID(as_uuid=True), ForeignKey("admin_regions.id", ondelete="CASCADE"), primary_key=True)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="local_admin_regions")
    region = relationship("AdminRegion", back_populates="local_admins")


class AdminRegion(Base):
    __tablename__ = "admin_regions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False, index=True)
    pin_code = Column(String(20), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    local_admins = relationship("LocalAdminRegion", back_populates="region", cascade="all, delete-orphan")
    verification_requests = relationship("VerificationRequest", back_populates="region")

    def __repr__(self):
        return f"<AdminRegion(id={self.id}, name={self.name})>"

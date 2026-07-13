"""
CommunityConnect Backend - User Model
"""

import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
from app.models.enums import UserRole


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone_number = Column(String(15), unique=True, nullable=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole, name="user_role"), nullable=False, default=UserRole.unverified)
    is_active = Column(Boolean, nullable=False, default=True)
    preferred_language = Column(String(10), nullable=False, default="en")
    verified_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Aadhar verification fields
    aadhar_number = Column(String(12), nullable=True, index=True)
    aadhar_card_url = Column(String(512), nullable=True)
    aadhar_verified_at = Column(DateTime(timezone=True), nullable=True)
    aadhar_data_delete_at = Column(DateTime(timezone=True), nullable=True)

    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    verification_request = relationship("VerificationRequest", back_populates="target_user", uselist=False, cascade="all, delete-orphan")
    local_admin_regions = relationship("LocalAdminRegion", back_populates="user", cascade="all, delete-orphan")
    approvals = relationship("VerificationApproval", back_populates="approver_user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="actor", cascade="all, delete-orphan")
    membership = relationship("Membership", back_populates="user", uselist=False, cascade="all, delete-orphan")

    # Legal agreements
    terms_accepted_at = Column(DateTime(timezone=True), nullable=True)
    nda_accepted_at = Column(DateTime(timezone=True), nullable=True)

    # Registration metadata
    ip_address = Column(String(45), nullable=True)

    def __repr__(self):
        return f"<User(id={self.id}, phone_number={self.phone_number}, role={self.role})>"

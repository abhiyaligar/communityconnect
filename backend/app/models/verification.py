"""
CommunityConnect Backend - Verification System Models
"""

import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum as SQLEnum, Text, CheckConstraint, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
from app.models.enums import VerificationStatus


class VerificationRequest(Base):
    __tablename__ = "verification_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    region_id = Column(UUID(as_uuid=True), ForeignKey("admin_regions.id", ondelete="SET NULL"), nullable=True)
    family_member_profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    status = Column(SQLEnum(VerificationStatus, name="verification_status"), nullable=False, default=VerificationStatus.pending)
    escalated = Column(Boolean, nullable=False, default=False)
    escalation_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    target_user = relationship("User", back_populates="verification_request", foreign_keys=[target_user_id])
    region = relationship("AdminRegion", back_populates="verification_requests", foreign_keys=[region_id])
    family_member = relationship("Profile", back_populates="verification_vouch_requests", foreign_keys=[family_member_profile_id])
    approvals = relationship("VerificationApproval", back_populates="verification_request", cascade="all, delete-orphan")


class VerificationApproval(Base):
    __tablename__ = "verification_approvals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    verification_request_id = Column(UUID(as_uuid=True), ForeignKey("verification_requests.id", ondelete="CASCADE"), nullable=False)
    approver_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    approver_profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=True)
    approver_role = Column(String(50), nullable=False) # 'community_admin', 'local_admin', 'family_member'
    decision = Column(String(20), nullable=False) # 'approved', 'rejected'
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    verification_request = relationship("VerificationRequest", back_populates="approvals", foreign_keys=[verification_request_id])
    approver_user = relationship("User", back_populates="approvals", foreign_keys=[approver_user_id])
    approver_profile = relationship("Profile", back_populates="verification_approvals", foreign_keys=[approver_profile_id])

    __table_args__ = (
        UniqueConstraint("verification_request_id", "approver_user_id", name="uq_approval_per_admin"),
        CheckConstraint(
            "(approver_user_id IS NOT NULL AND approver_profile_id IS NULL) OR "
            "(approver_user_id IS NULL AND approver_profile_id IS NOT NULL)",
            name="chk_approver_source"
        ),
    )

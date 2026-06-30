"""
CommunityConnect Backend - Matrimonial Module Models
"""

import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum as SQLEnum, Text, UniqueConstraint, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
from app.models.enums import ConnectionRequestStatus


class MatrimonyProfile(Base):
    __tablename__ = "matrimony_profiles"

    profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True)
    opted_in = Column(Boolean, nullable=False, default=False)
    double_approval_required = Column(Boolean, nullable=False, default=False)
    family_co_approver_profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    about_me = Column(Text, nullable=True)
    education = Column(String(255), nullable=True)
    family_background = Column(Text, nullable=True)
    hobbies = Column(Text, nullable=True)
    preferences = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    profile = relationship("Profile", back_populates="matrimony_profile", foreign_keys=[profile_id])
    family_co_approver = relationship("Profile", foreign_keys=[family_co_approver_profile_id])


class ConnectionRequest(Base):
    __tablename__ = "connection_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sender_profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    receiver_profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    status = Column(SQLEnum(ConnectionRequestStatus, name="connection_request_status"), nullable=False, default=ConnectionRequestStatus.pending_self_approval)
    self_approved_at = Column(DateTime(timezone=True), nullable=True)
    family_approved_at = Column(DateTime(timezone=True), nullable=True)
    family_co_approver_profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    sender = relationship("Profile", foreign_keys=[sender_profile_id])
    receiver = relationship("Profile", foreign_keys=[receiver_profile_id])
    family_co_approver = relationship("Profile", foreign_keys=[family_co_approver_profile_id])

    __table_args__ = (
        UniqueConstraint("sender_profile_id", "receiver_profile_id", name="unique_sender_receiver"),
        CheckConstraint("sender_profile_id <> receiver_profile_id", name="chk_different_parties"),
    )

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
    
    # Physical
    height_cm = Column(String(10), nullable=True)
    body_type = Column(String(50), nullable=True)
    complexion = Column(String(50), nullable=True)
    
    # Education
    highest_qualification = Column(String(100), nullable=True)
    field_of_study = Column(String(255), nullable=True)
    institution = Column(String(255), nullable=True)
    
    # Professional
    employment_type = Column(String(100), nullable=True)
    job_title = Column(String(255), nullable=True)
    income_range = Column(String(100), nullable=True)
    work_location = Column(String(255), nullable=True)
    
    # Horoscope & Community
    gotra = Column(String(100), nullable=True)
    rashi = Column(String(50), nullable=True)
    nakshatra = Column(String(100), nullable=True)
    manglik_status = Column(String(50), nullable=True)
    birth_time = Column(String(20), nullable=True)
    birth_place = Column(String(255), nullable=True)
    
    # Family Background
    father_name = Column(String(100), nullable=True)
    father_occupation = Column(String(100), nullable=True)
    mother_name = Column(String(100), nullable=True)
    mother_occupation = Column(String(100), nullable=True)
    brothers_count = Column(String(10), nullable=True)
    brothers_marital_status = Column(String(50), nullable=True)
    sisters_count = Column(String(10), nullable=True)
    sisters_marital_status = Column(String(50), nullable=True)
    family_type = Column(String(50), nullable=True)
    family_values = Column(String(50), nullable=True)
    family_financial_status = Column(String(50), nullable=True)
    
    # Lifestyle
    diet = Column(String(50), nullable=True)
    smoking = Column(String(50), nullable=True)
    drinking = Column(String(50), nullable=True)
    physical_activity = Column(String(50), nullable=True)
    
    # About Me
    about_me = Column(Text, nullable=True)
    hobbies = Column(JSONB, nullable=True) # List of strings
    languages = Column(JSONB, nullable=True) # List of strings
    
    # Media
    additional_photos = Column(JSONB, nullable=True) # List of URLs
    
    # Preferences & Privacy
    preferences = Column(JSONB, nullable=True)
    visibility = Column(String(50), nullable=True, default="all_verified")
    
    # Approvals
    double_approval_required = Column(Boolean, nullable=False, default=False)
    family_co_approver_profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    
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

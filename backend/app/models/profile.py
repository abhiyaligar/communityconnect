"""
CommunityConnect Backend - Member Profile Model
"""

import uuid
from sqlalchemy import Column, String, Date, Boolean, DateTime, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
from app.models.enums import Gender, MaritalStatus


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), unique=True, nullable=True)
    family_unit_id = Column(UUID(as_uuid=True), ForeignKey("family_units.id", ondelete="SET NULL"), nullable=True)
    full_name = Column(String(100), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(SQLEnum(Gender, name="gender"), nullable=False)
    marital_status = Column(SQLEnum(MaritalStatus, name="marital_status"), nullable=False, default=MaritalStatus.single)
    profile_photo_url = Column(String(512), nullable=False)
    contact_number = Column(String(15), nullable=True)
    address = Column(Text, nullable=False)
    occupation = Column(String(100), nullable=True)
    is_memorial = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="profile", foreign_keys=[user_id])
    family_unit = relationship("FamilyUnit", back_populates="members", foreign_keys=[family_unit_id])

    # Matrimony profile
    matrimony_profile = relationship(
        "MatrimonyProfile",
        foreign_keys="[MatrimonyProfile.profile_id]",
        back_populates="profile",
        uselist=False,
        cascade="all, delete-orphan"
    )

    # Memorial record
    memorial_record = relationship(
        "MemorialRecord",
        foreign_keys="[MemorialRecord.profile_id]",
        back_populates="profile",
        uselist=False,
        cascade="all, delete-orphan"
    )

    # Verification references
    verification_vouch_requests = relationship("VerificationRequest", back_populates="family_member")
    verification_approvals = relationship("VerificationApproval", back_populates="approver_profile")

    def __repr__(self):
        return f"<Profile(id={self.id}, full_name={self.full_name}, is_memorial={self.is_memorial})>"

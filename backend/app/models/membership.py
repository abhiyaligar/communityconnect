"""
CommunityConnect Backend - Membership Model

Tracks user membership/subscription status.
Used to control access to the application.
"""

import uuid
from datetime import date
from sqlalchemy import Column, String, Date, Enum as SQLEnum, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
import enum


class MembershipStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"


class Membership(Base):
    __tablename__ = "memberships"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    username = Column(String(30), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(SQLEnum(MembershipStatus, name="membership_status"), nullable=False, default=MembershipStatus.active)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="membership", uselist=False)

    def __repr__(self):
        return f"<Membership(user_id={self.user_id}, status={self.status})>"

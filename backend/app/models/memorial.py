"""
CommunityConnect Backend - Memorial Records Model
"""

import uuid
from sqlalchemy import Column, Date, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base


class MemorialRecord(Base):
    __tablename__ = "memorial_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), unique=True, nullable=False)
    date_of_death = Column(Date, nullable=False)
    announced_by_profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    verified_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    announcement_notes = Column(Text, nullable=True)
    archived_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    profile = relationship("Profile", back_populates="memorial_record", foreign_keys=[profile_id])
    announced_by = relationship("Profile", foreign_keys=[announced_by_profile_id])
    verified_by = relationship("User", foreign_keys=[verified_by_user_id])

    def __repr__(self):
        return f"<MemorialRecord(id={self.id}, profile_id={self.profile_id})>"

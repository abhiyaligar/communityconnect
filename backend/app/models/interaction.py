"""
CommunityConnect Backend - Matrimonial Interaction Models
"""

import uuid
from sqlalchemy import Column, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base


class ProfileLike(Base):
    __tablename__ = "profile_likes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    liked_profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user_profile = relationship("Profile", foreign_keys=[user_profile_id])
    liked_profile = relationship("Profile", foreign_keys=[liked_profile_id])

    __table_args__ = (
        UniqueConstraint("user_profile_id", "liked_profile_id", name="uq_user_liked_profile"),
    )

    def __repr__(self):
        return f"<ProfileLike(user_profile_id={self.user_profile_id}, liked_profile_id={self.liked_profile_id})>"


class ProfileDislike(Base):
    __tablename__ = "profile_dislikes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    disliked_profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user_profile = relationship("Profile", foreign_keys=[user_profile_id])
    disliked_profile = relationship("Profile", foreign_keys=[disliked_profile_id])

    __table_args__ = (
        UniqueConstraint("user_profile_id", "disliked_profile_id", name="uq_user_disliked_profile"),
    )

    def __repr__(self):
        return f"<ProfileDislike(user_profile_id={self.user_profile_id}, disliked_profile_id={self.disliked_profile_id})>"

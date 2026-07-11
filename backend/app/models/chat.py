"""
CommunityConnect Backend - Chat Module Models
"""

import uuid
from sqlalchemy import Column, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sender_profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    receiver_profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    # Relationships
    sender = relationship("Profile", foreign_keys=[sender_profile_id])
    receiver = relationship("Profile", foreign_keys=[receiver_profile_id])

    def __repr__(self):
        return f"<ChatMessage(id={self.id}, sender_profile_id={self.sender_profile_id}, receiver_profile_id={self.receiver_profile_id}, is_read={self.is_read})>"

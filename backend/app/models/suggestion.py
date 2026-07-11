"""
CommunityConnect Backend - Suggestion & Bug Report Model
"""

import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
import enum


class SuggestionType(str, enum.Enum):
    suggestion = "suggestion"
    bug_report = "bug_report"


class Suggestion(Base):
    __tablename__ = "suggestions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    type = Column(SQLEnum(SuggestionType, name="suggestion_type"), nullable=False, default=SuggestionType.suggestion)
    subject = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])

    def __repr__(self):
        return f"<Suggestion(id={self.id}, type={self.type}, subject={self.subject})>"

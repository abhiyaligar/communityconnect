"""
CommunityConnect Backend - System Audit Log Model
"""

import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(50), nullable=False) # e.g. PROFILE_UPDATE, ROLE_CHANGE
    target_type = Column(String(50), nullable=False) # e.g. profiles, users
    target_id = Column(UUID(as_uuid=True), nullable=False)
    old_values = Column(JSONB, nullable=True)
    new_values = Column(JSONB, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    actor = relationship("User", back_populates="audit_logs", foreign_keys=[actor_user_id])

    def __repr__(self):
        return f"<AuditLog(id={self.id}, action={self.action}, target_type={self.target_type})>"

"""
CommunityConnect Backend - Family Unit Model
"""

import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base


class FamilyUnit(Base):
    __tablename__ = "family_units"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    # Circular reference resolved via use_alter=True
    family_head_id = Column(
        UUID(as_uuid=True),
        ForeignKey("profiles.id", ondelete="SET NULL", use_alter=True, name="fk_family_head"),
        nullable=True
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    members = relationship(
        "Profile",
        foreign_keys="[Profile.family_unit_id]",
        back_populates="family_unit",
        cascade="all"
    )
    family_head = relationship(
        "Profile",
        foreign_keys=[family_head_id],
        post_update=True
    )

    def __repr__(self):
        return f"<FamilyUnit(id={self.id}, name={self.name})>"

"""
CommunityConnect Backend - Matrimony Preference Model
"""

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base


class MatrimonyPreference(Base):
    __tablename__ = "matrimony_preferences"

    profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True)

    # Each field has strict (must-match) and preferred (nice-to-have) tiers
    # null or empty list = any/all

    strict_rashi = Column(JSONB, nullable=True)
    preferred_rashi = Column(JSONB, nullable=True)
    strict_nakshatra = Column(JSONB, nullable=True)
    preferred_nakshatra = Column(JSONB, nullable=True)
    strict_gotra = Column(JSONB, nullable=True)
    preferred_gotra = Column(JSONB, nullable=True)
    strict_sub_caste = Column(JSONB, nullable=True)
    preferred_sub_caste = Column(JSONB, nullable=True)

    strict_income_min = Column(String(50), nullable=True)
    strict_income_max = Column(String(50), nullable=True)
    preferred_income = Column(String(50), nullable=True)

    strict_age_min = Column(Integer, nullable=True)
    strict_age_max = Column(Integer, nullable=True)
    preferred_age_min = Column(Integer, nullable=True)
    preferred_age_max = Column(Integer, nullable=True)

    strict_height_min = Column(Integer, nullable=True)
    strict_height_max = Column(Integer, nullable=True)
    preferred_height_min = Column(Integer, nullable=True)
    preferred_height_max = Column(Integer, nullable=True)

    strict_weight_min = Column(Integer, nullable=True)
    strict_weight_max = Column(Integer, nullable=True)
    preferred_weight_min = Column(Integer, nullable=True)
    preferred_weight_max = Column(Integer, nullable=True)

    strict_diet = Column(JSONB, nullable=True)
    preferred_diet = Column(JSONB, nullable=True)

    manglik = Column(String(50), nullable=True, default="any")

    strict_education = Column(JSONB, nullable=True)
    preferred_education = Column(JSONB, nullable=True)

    strict_employment = Column(JSONB, nullable=True)
    preferred_employment = Column(JSONB, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    profile = relationship("Profile", back_populates="matrimony_preference")

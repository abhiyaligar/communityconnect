"""
CommunityConnect Backend - Matrimony Preference Schemas
"""

from typing import Optional, List
from pydantic import BaseModel
from uuid import UUID


class MatrimonyPreferenceCreate(BaseModel):
    strict_rashi: Optional[List[str]] = None
    preferred_rashi: Optional[List[str]] = None
    strict_nakshatra: Optional[List[str]] = None
    preferred_nakshatra: Optional[List[str]] = None
    strict_gotra: Optional[List[str]] = None
    preferred_gotra: Optional[List[str]] = None
    strict_sub_caste: Optional[List[str]] = None
    preferred_sub_caste: Optional[List[str]] = None

    strict_income_min: Optional[str] = None
    strict_income_max: Optional[str] = None
    preferred_income: Optional[str] = None

    strict_age_min: Optional[int] = None
    strict_age_max: Optional[int] = None
    preferred_age_min: Optional[int] = None
    preferred_age_max: Optional[int] = None

    strict_height_min: Optional[int] = None
    strict_height_max: Optional[int] = None
    preferred_height_min: Optional[int] = None
    preferred_height_max: Optional[int] = None

    strict_weight_min: Optional[int] = None
    strict_weight_max: Optional[int] = None
    preferred_weight_min: Optional[int] = None
    preferred_weight_max: Optional[int] = None

    strict_diet: Optional[List[str]] = None
    preferred_diet: Optional[List[str]] = None

    manglik: Optional[str] = "any"

    strict_education: Optional[List[str]] = None
    preferred_education: Optional[List[str]] = None

    strict_employment: Optional[List[str]] = None
    preferred_employment: Optional[List[str]] = None


class MatrimonyPreferenceOut(BaseModel):
    profile_id: UUID
    strict_rashi: Optional[list] = None
    preferred_rashi: Optional[list] = None
    strict_nakshatra: Optional[list] = None
    preferred_nakshatra: Optional[list] = None
    strict_gotra: Optional[list] = None
    preferred_gotra: Optional[list] = None
    strict_sub_caste: Optional[list] = None
    preferred_sub_caste: Optional[list] = None
    strict_income_min: Optional[str] = None
    strict_income_max: Optional[str] = None
    preferred_income: Optional[str] = None
    strict_age_min: Optional[int] = None
    strict_age_max: Optional[int] = None
    preferred_age_min: Optional[int] = None
    preferred_age_max: Optional[int] = None
    strict_height_min: Optional[int] = None
    strict_height_max: Optional[int] = None
    preferred_height_min: Optional[int] = None
    preferred_height_max: Optional[int] = None
    strict_weight_min: Optional[int] = None
    strict_weight_max: Optional[int] = None
    preferred_weight_min: Optional[int] = None
    preferred_weight_max: Optional[int] = None
    strict_diet: Optional[list] = None
    preferred_diet: Optional[list] = None
    manglik: Optional[str] = "any"
    strict_education: Optional[list] = None
    preferred_education: Optional[list] = None
    strict_employment: Optional[list] = None
    preferred_employment: Optional[list] = None

    class Config:
        from_attributes = True

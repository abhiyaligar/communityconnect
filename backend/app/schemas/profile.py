"""
CommunityConnect Backend - Profile & Matrimony Schemas
"""

from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List
from datetime import date

# -----------------
# Onboarding Schema
# -----------------
class ProfileOnboard(BaseModel):
    # Core Profile
    full_name: str
    date_of_birth: date
    gender: str
    marital_status: str
    phone_number: str
    address: str
    profile_photo_url: str = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"
    
    # Matrimony Opt-in
    create_matrimony: bool = False
    
    # Optional Matrimony Fields
    height_cm: Optional[str] = None
    body_type: Optional[str] = None
    complexion: Optional[str] = None
    highest_qualification: Optional[str] = None
    field_of_study: Optional[str] = None
    institution: Optional[str] = None
    employment_type: Optional[str] = None
    job_title: Optional[str] = None
    income_range: Optional[str] = None
    work_location: Optional[str] = None
    gotra: Optional[str] = None
    rashi: Optional[str] = None
    nakshatra: Optional[str] = None
    manglik_status: Optional[str] = None
    birth_time: Optional[str] = None
    birth_place: Optional[str] = None
    father_name: Optional[str] = None
    father_occupation: Optional[str] = None
    mother_name: Optional[str] = None
    mother_occupation: Optional[str] = None
    brothers_count: Optional[str] = None
    brothers_marital_status: Optional[str] = None
    sisters_count: Optional[str] = None
    sisters_marital_status: Optional[str] = None
    family_type: Optional[str] = None
    family_values: Optional[str] = None
    family_financial_status: Optional[str] = None
    diet: Optional[str] = None
    smoking: Optional[str] = None
    drinking: Optional[str] = None
    physical_activity: Optional[str] = None
    hobbies: List[str] = []
    languages: List[str] = []
    additional_photos: List[str] = []
    visibility: str = "public"
    
    class Config:
        json_schema_extra = {
            "example": {
                "full_name": "Ramesh Kumar",
                "date_of_birth": "1995-05-15",
                "gender": "male",
                "marital_status": "single",
                "phone_number": "+919876543210",
                "address": "123 Main St, Mumbai",
                "create_matrimony": True,
                "height_cm": "175",
                "highest_qualification": "bachelors",
                "employment_type": "employed"
            }
        }

# -----------------
# Update Schemas
# -----------------
class MatrimonyProfileUpdate(BaseModel):
    # Physical
    height_cm: Optional[str] = None
    body_type: Optional[str] = None
    complexion: Optional[str] = None
    
    # Professional
    highest_qualification: Optional[str] = None
    field_of_study: Optional[str] = None
    institution: Optional[str] = None
    employment_type: Optional[str] = None
    job_title: Optional[str] = None
    income_range: Optional[str] = None
    work_location: Optional[str] = None
    
    # Horoscope
    gotra: Optional[str] = None
    rashi: Optional[str] = None
    nakshatra: Optional[str] = None
    manglik_status: Optional[str] = None
    birth_time: Optional[str] = None
    birth_place: Optional[str] = None
    
    # Family
    father_name: Optional[str] = None
    father_occupation: Optional[str] = None
    mother_name: Optional[str] = None
    mother_occupation: Optional[str] = None
    brothers_count: Optional[str] = None
    brothers_marital_status: Optional[str] = None
    sisters_count: Optional[str] = None
    sisters_marital_status: Optional[str] = None
    family_type: Optional[str] = None
    family_values: Optional[str] = None
    family_financial_status: Optional[str] = None
    
    # Lifestyle & About
    diet: Optional[str] = None
    smoking: Optional[str] = None
    drinking: Optional[str] = None
    physical_activity: Optional[str] = None
    about_me: Optional[str] = None
    hobbies: Optional[List[str]] = None
    languages: Optional[List[str]] = None
    
    # Media & Settings
    additional_photos: Optional[List[str]] = None
    visibility: Optional[str] = None

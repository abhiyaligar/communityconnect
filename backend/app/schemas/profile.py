
# CommunityConnect Backend - Profile & Matrimony Schemas

from pydantic import BaseModel, HttpUrl, Field, field_validator, model_validator, ConfigDict
from typing import Optional, List
from datetime import date, timedelta
from uuid import UUID
import re
from app.models.enums import Rashi

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
    region_id: Optional[UUID] = None
    profile_photo_url: str = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"
    aadhar_number: str
    aadhar_card_url: str
    
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
    sub_caste: Optional[str] = None
    company_name: Optional[str] = None
    
    # Social
    social_links: Optional[dict] = None
    
    # Username
    username: Optional[str] = None

    @field_validator("aadhar_number")
    @classmethod
    def validate_aadhar_number(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Aadhar number is compulsory.")
        digits = v.strip()
        if not digits.isdigit() or len(digits) != 12:
            raise ValueError("Aadhar number must be exactly 12 digits.")
        return digits

    @field_validator("aadhar_card_url")
    @classmethod
    def validate_aadhar_card_url(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Aadhar card image upload is compulsory.")
        return v.strip()

    @field_validator("birth_time")
    @classmethod
    def validate_birth_time(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        pattern = r"^(1[0-2]|0?[1-9]):[0-5][0-9]\s?(AM|PM|am|pm)$"
        if not re.match(pattern, v.strip()):
            raise ValueError("Birth time must be in 12-hour format (e.g. '02:30 PM' or '2:30 PM').")
        return v.strip().upper()

    @field_validator("rashi")
    @classmethod
    def validate_rashi(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        try:
            Rashi(v.lower())
        except ValueError:
            valid = [e.value for e in Rashi]
            raise ValueError(f"Invalid Rashi. Must be one of: {', '.join(valid)}")
        return v.lower()

    @field_validator("date_of_birth")
    @classmethod
    def validate_date_of_birth(cls, v: date) -> date:
        year_str = str(v.year)
        if len(year_str) != 4:
            raise ValueError("Invalid year in date of birth. Must be a 4-digit year.")
        if v >= date.today():
            raise ValueError("Date of birth cannot be in the future.")
        min_age = date.today() - timedelta(days=18 * 365)
        if v > min_age:
            raise ValueError("You must be at least 18 years old to register.")
        return v

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, v: str) -> str:
        if not v:
            return v
        digits = v.replace("+91", "").replace("-", "").replace(" ", "")
        if not digits.isdigit() or len(digits) != 10:
            raise ValueError("Phone number must be exactly 10 digits.")
        return v

    @model_validator(mode="after")
    def validate_onboard_requirements(self) -> 'ProfileOnboard':
        if not self.profile_photo_url or self.profile_photo_url == "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde":
            raise ValueError("A profile photo upload is compulsory. Please upload a profile photo to proceed.")
        
        socials = self.social_links or {}
        active_socials = {k: v for k, v in socials.items() if v and str(v).strip()}
        if not active_socials:
            raise ValueError("At least one social media link is compulsory to proceed.")
        
        is_employed = False
        if self.create_matrimony and self.employment_type in ["employed", "self_employed", "business"]:
            is_employed = True
        
        if is_employed:
            linkedin_url = active_socials.get("linkedin")
            if not linkedin_url or not str(linkedin_url).strip():
                raise ValueError("LinkedIn verification profile link is compulsory for employed, self-employed, or business candidates.")
            
            if "linkedin.com" not in str(linkedin_url).lower():
                raise ValueError("A valid LinkedIn profile URL is required (e.g. https://www.linkedin.com/in/username).")
                
        return self
    
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
#-----------------
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
    company_name: Optional[str] = None
    income_range: Optional[str] = None
    work_location: Optional[str] = None
    
    # Horoscope
    gotra: Optional[str] = None
    sub_caste: Optional[str] = None
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
    
    # Double Approval
    double_approval_required: Optional[bool] = None
    family_co_approver_profile_id: Optional[UUID] = None

class SocialLinksUpdate(BaseModel):
    social_links: dict

class UsernameUpdate(BaseModel):
    username: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        v = v.lower().strip()
        if not re.match(r"^[a-z0-9_]{3,20}$", v):
            raise ValueError("Username must be 3-20 characters and contain only lowercase letters, numbers, and underscores.")
        return v

class ProfileUpdate(BaseModel):
    address: Optional[str] = None
    occupation: Optional[str] = None
    profile_photo_url: Optional[str] = None
    contact_number: Optional[str] = None
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    social_links: Optional[dict] = None


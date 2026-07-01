"""
CommunityConnect Backend - Admin Management Schemas
"""

from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, field_validator
import re

from datetime import date
from app.models.enums import UserRole


class AdminCreate(BaseModel):
    phone_number: str = Field(..., description="Phone number in E.164 format")
    email: Optional[str] = Field(None, description="Optional admin email")
    password: str = Field(..., min_length=8, description="Admin password (fallback auth)")
    role: UserRole = Field(..., description="Must be community_admin or local_admin")
    full_name: str = Field(..., min_length=2, max_length=100)
    address: str = Field(..., min_length=5)
    region_id: Optional[UUID] = Field(None, description="Assigned region ID for local_admin")

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        if not re.match(r"^\+[1-9]\d{1,14}$", v):
            raise ValueError("Phone number must be in E.164 format (e.g. +919999999999)")
        return v

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: UserRole) -> UserRole:
        if v not in [UserRole.community_admin, UserRole.local_admin]:
            raise ValueError("Role must be either community_admin or local_admin")
        return v


class ProfileAdminUpdate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    date_of_birth: date
    gender: str
    marital_status: str
    address: str = Field(..., min_length=5)
    occupation: Optional[str] = None
    profile_photo_url: str
    role: UserRole
    is_active: bool


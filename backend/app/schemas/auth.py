"""
CommunityConnect Backend - Authentication Schemas
"""

from typing import Optional
from pydantic import BaseModel, Field, field_validator
import re


class OTPRequest(BaseModel):
    phone_number: str = Field(..., description="Phone number in international E.164 format")

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        # Regex matching E.164 format: + followed by 1 to 15 digits
        if not re.match(r"^\+[1-9]\d{1,14}$", v):
            raise ValueError("Phone number must be in E.164 format (e.g. +919999999999)")
        return v


class OTPVerify(BaseModel):
    phone_number: str = Field(..., description="Phone number in international E.164 format")
    code: str = Field(..., min_length=6, max_length=6, description="6-digit verification code")

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        if not re.match(r"^\+[1-9]\d{1,14}$", v):
            raise ValueError("Phone number must be in E.164 format (e.g. +919999999999)")
        return v


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    registered: bool = True
    role: Optional[str] = None
    user_id: Optional[str] = None

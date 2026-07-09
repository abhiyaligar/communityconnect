"""
CommunityConnect Backend - Authentication Schemas
"""

from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class EmailRegister(BaseModel):
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., min_length=8, description="Strong password")


class EmailVerify(BaseModel):
    email: EmailStr = Field(..., description="User's email address")
    code: str = Field(..., min_length=6, max_length=6, description="6-digit verification code")
    password: str = Field(..., min_length=8, description="User's password")


class UserLogin(BaseModel):
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., description="User's password")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    registered: bool = True
    role: Optional[str] = None
    user_id: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered user email address")


class ResetPasswordRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered user email address")
    code: str = Field(..., min_length=6, max_length=6, description="6-digit password reset verification code")
    new_password: str = Field(..., min_length=8, description="New strong password")


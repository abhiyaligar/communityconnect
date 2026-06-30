"""
CommunityConnect Backend - User Schemas

Pydantic schemas for request/response validation of user data.
"""

from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


# --- Request Schemas ---

class UserCreate(BaseModel):
    email: str
    username: str
    password: str
    full_name: Optional[str] = None


class UserUpdate(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    password: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


# --- Response Schemas ---

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None

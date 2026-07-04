from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class ConnectionRequestCreate(BaseModel):
    receiver_profile_id: UUID

class ConnectionAction(BaseModel):
    action: str  # "approve" or "reject"

class ProfileMinOut(BaseModel):
    id: UUID
    full_name: str
    profile_photo_url: str
    gender: str
    username: Optional[str] = None

    class Config:
        from_attributes = True

class ConnectionRequestOut(BaseModel):
    id: UUID
    sender_profile_id: UUID
    receiver_profile_id: UUID
    status: str
    self_approved_at: Optional[datetime] = None
    family_approved_at: Optional[datetime] = None
    family_co_approver_profile_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    
    sender: Optional[ProfileMinOut] = None
    receiver: Optional[ProfileMinOut] = None
    family_co_approver: Optional[ProfileMinOut] = None
    
    class Config:
        from_attributes = True


class CoApproverAction(BaseModel):
    action: str  # "accept" or "decline"

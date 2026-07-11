from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.schemas.matrimony import ProfileMinOut

class ChatMessageCreate(BaseModel):
    receiver_profile_id: UUID
    content: str

class ChatMessageOut(BaseModel):
    id: UUID
    sender_profile_id: UUID
    receiver_profile_id: UUID
    content: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ChatSessionOut(BaseModel):
    profile: ProfileMinOut
    last_message: Optional[ChatMessageOut] = None
    unread_count: int

    class Config:
        from_attributes = True

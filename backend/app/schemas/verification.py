"""
CommunityConnect Backend - Verification Schemas
"""

from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class VerificationReview(BaseModel):
    decision: str = Field(..., description="Must be approved or rejected")
    comments: Optional[str] = Field(None, max_length=500)


class EscalationRequest(BaseModel):
    reason: str = Field(..., min_length=5, max_length=500)

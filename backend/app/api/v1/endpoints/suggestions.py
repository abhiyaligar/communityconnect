"""
CommunityConnect Backend - Suggestion & Bug Report Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_user, RoleChecker
from app.models.user import User
from app.models.enums import UserRole
from app.models.suggestion import Suggestion, SuggestionType

router = APIRouter()


class SuggestionCreate(BaseModel):
    type: str
    subject: str
    description: str


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_suggestion(
    payload: SuggestionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit a suggestion or bug report.
    """
    if payload.type not in ("suggestion", "bug_report"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Type must be 'suggestion' or 'bug_report'."
        )

    if not payload.subject or not payload.subject.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subject is required."
        )

    if not payload.description or not payload.description.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Description is required."
        )

    suggestion = Suggestion(
        user_id=current_user.id,
        type=SuggestionType(payload.type),
        subject=payload.subject.strip(),
        description=payload.description.strip(),
    )
    db.add(suggestion)
    await db.commit()
    await db.refresh(suggestion)

    return {
        "message": "Thank you for your feedback! We'll review it shortly.",
        "id": str(suggestion.id),
        "type": suggestion.type.value,
    }


@router.get("")
async def list_suggestions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.community_admin]))
):
    """
    List all suggestions and bug reports. Community admin only.
    """
    stmt = (
        select(Suggestion)
        .options(selectinload(Suggestion.user))
        .order_by(Suggestion.created_at.desc())
    )
    result = await db.execute(stmt)
    suggestions = result.scalars().all()

    return [
        {
            "id": str(s.id),
            "type": s.type.value,
            "subject": s.subject,
            "description": s.description,
            "submitted_by": {
                "id": str(s.user.id),
                "full_name": s.user.full_name,
                "username": s.user.username,
                "email": s.user.email,
            },
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }
        for s in suggestions
    ]

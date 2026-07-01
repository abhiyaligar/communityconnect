"""
CommunityConnect Backend - Profiles Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.profile import Profile

router = APIRouter()


@router.get("/me", status_code=status.HTTP_200_OK)
async def get_my_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves the logged-in user's profile and database status.
    Called on session initialization by frontend to verify current role.
    """
    stmt = select(Profile).where(Profile.user_id == current_user.id)
    result = await db.execute(stmt)
    profile = result.scalars().first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found for this user account."
        )

    return {
        "id": str(current_user.id),
        "role": current_user.role.value,
        "full_name": profile.full_name,
        "date_of_birth": profile.date_of_birth,
        "gender": profile.gender.value,
        "marital_status": profile.marital_status.value,
        "profile_photo_url": profile.profile_photo_url,
        "contact_number": profile.contact_number,
        "address": profile.address,
        "occupation": profile.occupation
    }

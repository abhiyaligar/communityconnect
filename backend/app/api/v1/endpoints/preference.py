"""
CommunityConnect Backend — Matrimony Preference Endpoints

Routes (prefix: /api/v1/matrimony):
  GET    /preferences     Get current user's matrimony preferences
  POST   /preferences     Create or update matrimony preferences (upsert)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.profile import Profile
from app.models.preference import MatrimonyPreference
from app.schemas.preference import MatrimonyPreferenceCreate, MatrimonyPreferenceOut

router = APIRouter()


@router.get("/preferences", response_model=MatrimonyPreferenceOut)
async def get_my_preferences(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = (
        select(Profile)
        .where(Profile.user_id == current_user.id)
        .options(selectinload(Profile.matrimony_preference))
    )
    result = await db.execute(stmt)
    profile = result.scalars().first()

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")

    pref = profile.matrimony_preference
    if not pref:
        raise HTTPException(status_code=404, detail="Preferences not found. Please set your preferences first.")

    return pref


@router.post("/preferences", status_code=status.HTTP_200_OK)
async def save_preferences(
    payload: MatrimonyPreferenceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = (
        select(Profile)
        .where(Profile.user_id == current_user.id)
        .options(selectinload(Profile.matrimony_preference))
    )
    result = await db.execute(stmt)
    profile = result.scalars().first()

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")

    # Upsert: update existing or create new
    pref = profile.matrimony_preference
    if not pref:
        pref = MatrimonyPreference(profile_id=profile.id)

    for field in [
        "strict_rashi", "preferred_rashi",
        "strict_nakshatra", "preferred_nakshatra",
        "strict_gotra", "preferred_gotra",
        "strict_sub_caste", "preferred_sub_caste",
        "strict_diet", "preferred_diet",
        "strict_education", "preferred_education",
        "strict_employment", "preferred_employment",
    ]:
        val = getattr(payload, field, None)
        if val is not None:
            setattr(pref, field, val)

    for field in [
        "strict_income_min", "strict_income_max", "preferred_income",
        "manglik",
    ]:
        val = getattr(payload, field, None)
        if val is not None:
            setattr(pref, field, val)

    for field in [
        "strict_age_min", "strict_age_max",
        "preferred_age_min", "preferred_age_max",
        "strict_height_min", "strict_height_max",
        "preferred_height_min", "preferred_height_max",
        "strict_weight_min", "strict_weight_max",
        "preferred_weight_min", "preferred_weight_max",
    ]:
        val = getattr(payload, field, None)
        if val is not None:
            setattr(pref, field, val)

    if not profile.matrimony_preference:
        db.add(pref)

    await db.commit()
    await db.refresh(pref)

    return {"message": "Preferences saved successfully."}

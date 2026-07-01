"""
CommunityConnect Backend - Matrimony Operations Endpoints
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.api.deps import get_current_user, RoleChecker
from app.models.user import User
from app.models.profile import Profile
from app.models.matrimony import MatrimonyProfile
from app.models.enums import UserRole, Gender

router = APIRouter()


@router.get("/matches", status_code=status.HTTP_200_OK)
async def get_matrimony_matches(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.community_admin, UserRole.local_admin, UserRole.verified_adult]))
):
    """
    Returns all matrimony profiles that have opted in.
    Validates that the requesting user is also opted in to matrimony.
    """
    # 1. Fetch current user's profile and matrimony
    stmt_me = (
        select(Profile)
        .where(Profile.user_id == current_user.id)
        .options(selectinload(Profile.matrimony_profile))
    )
    result_me = await db.execute(stmt_me)
    my_profile = result_me.scalars().first()

    if not my_profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")

    # 2. Check if current user is opted in to matrimony
    if not my_profile.matrimony_profile or not my_profile.matrimony_profile.opted_in:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="You must opt-in to Matrimony to view matches. Please update your profile."
        )

    # 3. Determine target gender
    target_gender = None
    if my_profile.gender == Gender.male:
        target_gender = Gender.female
    elif my_profile.gender == Gender.female:
        target_gender = Gender.male

    # 4. Fetch all matches (opted in, not the current user)
    query = (
        select(MatrimonyProfile)
        .join(Profile, MatrimonyProfile.profile_id == Profile.id)
        .where(
            MatrimonyProfile.opted_in == True,
            MatrimonyProfile.profile_id != my_profile.id
        )
    )

    if target_gender:
        query = query.where(Profile.gender == target_gender)

    stmt = query.options(selectinload(MatrimonyProfile.profile))
    
    result = await db.execute(stmt)
    matches = result.scalars().all()

    response_data = []
    for mat in matches:
        prof = mat.profile
        
        # Serialize enums properly
        gender = prof.gender.value if prof.gender else None
        marital = prof.marital_status.value if prof.marital_status else None
        
        # Physical
        body_type = mat.body_type.value if hasattr(mat.body_type, "value") else mat.body_type
        complexion = mat.complexion.value if hasattr(mat.complexion, "value") else mat.complexion
        
        # Professional
        highest_qualification = mat.highest_qualification.value if hasattr(mat.highest_qualification, "value") else mat.highest_qualification
        employment_type = mat.employment_type.value if hasattr(mat.employment_type, "value") else mat.employment_type
        income_range = mat.income_range.value if hasattr(mat.income_range, "value") else mat.income_range
        
        # Astro
        manglik = mat.manglik_status.value if hasattr(mat.manglik_status, "value") else mat.manglik_status
        
        # Lifestyle
        diet = mat.diet.value if hasattr(mat.diet, "value") else mat.diet
        smoking = mat.smoking.value if hasattr(mat.smoking, "value") else mat.smoking
        drinking = mat.drinking.value if hasattr(mat.drinking, "value") else mat.drinking
        physical_activity = mat.physical_activity.value if hasattr(mat.physical_activity, "value") else mat.physical_activity

        response_data.append({
            "profile_id": str(mat.profile_id),
            "about_me": mat.about_me,
            "hobbies": mat.hobbies,
            "languages": mat.languages,
            "profile": {
                "full_name": prof.full_name,
                "date_of_birth": prof.date_of_birth,
                "gender": gender,
                "marital_status": marital,
                "profile_photo_url": prof.profile_photo_url,
                "contact_number": prof.contact_number,
                "address": prof.address,
                "occupation": prof.occupation
            },
            "matrimony_details": {
                "height_cm": mat.height_cm,
                "body_type": body_type,
                "complexion": complexion,
                "highest_qualification": highest_qualification,
                "field_of_study": mat.field_of_study,
                "institution": mat.institution,
                "employment_type": employment_type,
                "job_title": mat.job_title,
                "income_range": income_range,
                "work_location": mat.work_location,
                "gotra": mat.gotra,
                "rashi": mat.rashi,
                "nakshatra": mat.nakshatra,
                "manglik_status": manglik,
                "diet": diet,
                "smoking": smoking,
                "drinking": drinking,
                "physical_activity": physical_activity
            }
        })

    return response_data

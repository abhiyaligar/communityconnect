"""
CommunityConnect Backend - Profiles Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.profile import Profile
from app.models.matrimony import MatrimonyProfile
from app.models.enums import (
    Gender, MaritalStatus, BodyType, Complexion, EducationLevel,
    EmploymentType, IncomeRange, ManglikStatus, Diet, ActivityLevel, ProfileVisibility
)
from app.schemas.profile import ProfileOnboard, MatrimonyProfileUpdate

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
    stmt = (
        select(Profile)
        .where(Profile.user_id == current_user.id)
        .options(selectinload(Profile.matrimony_profile))
    )
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
        "address": profile.address,
        "occupation": profile.occupation,
        "matrimony": {
            "opted_in": profile.matrimony_profile.opted_in if profile.matrimony_profile else False,
            "height_cm": profile.matrimony_profile.height_cm if profile.matrimony_profile else None,
            "body_type": profile.matrimony_profile.body_type if profile.matrimony_profile else None,
            "complexion": profile.matrimony_profile.complexion if profile.matrimony_profile else None,
            "highest_qualification": profile.matrimony_profile.highest_qualification if profile.matrimony_profile else None,
            "field_of_study": profile.matrimony_profile.field_of_study if profile.matrimony_profile else None,
            "institution": profile.matrimony_profile.institution if profile.matrimony_profile else None,
            "employment_type": profile.matrimony_profile.employment_type if profile.matrimony_profile else None,
            "job_title": profile.matrimony_profile.job_title if profile.matrimony_profile else None,
            "income_range": profile.matrimony_profile.income_range if profile.matrimony_profile else None,
            "work_location": profile.matrimony_profile.work_location if profile.matrimony_profile else None,
            "gotra": profile.matrimony_profile.gotra if profile.matrimony_profile else None,
            "rashi": profile.matrimony_profile.rashi if profile.matrimony_profile else None,
            "nakshatra": profile.matrimony_profile.nakshatra if profile.matrimony_profile else None,
            "manglik_status": profile.matrimony_profile.manglik_status if profile.matrimony_profile else None,
            "birth_time": profile.matrimony_profile.birth_time if profile.matrimony_profile else None,
            "birth_place": profile.matrimony_profile.birth_place if profile.matrimony_profile else None,
            "father_name": profile.matrimony_profile.father_name if profile.matrimony_profile else None,
            "father_occupation": profile.matrimony_profile.father_occupation if profile.matrimony_profile else None,
            "mother_name": profile.matrimony_profile.mother_name if profile.matrimony_profile else None,
            "mother_occupation": profile.matrimony_profile.mother_occupation if profile.matrimony_profile else None,
            "brothers_count": profile.matrimony_profile.brothers_count if profile.matrimony_profile else None,
            "brothers_marital_status": profile.matrimony_profile.brothers_marital_status if profile.matrimony_profile else None,
            "sisters_count": profile.matrimony_profile.sisters_count if profile.matrimony_profile else None,
            "sisters_marital_status": profile.matrimony_profile.sisters_marital_status if profile.matrimony_profile else None,
            "family_type": profile.matrimony_profile.family_type if profile.matrimony_profile else None,
            "family_values": profile.matrimony_profile.family_values if profile.matrimony_profile else None,
            "family_financial_status": profile.matrimony_profile.family_financial_status if profile.matrimony_profile else None,
            "diet": profile.matrimony_profile.diet if profile.matrimony_profile else None,
            "smoking": profile.matrimony_profile.smoking if profile.matrimony_profile else None,
            "drinking": profile.matrimony_profile.drinking if profile.matrimony_profile else None,
            "physical_activity": profile.matrimony_profile.physical_activity if profile.matrimony_profile else None,
            "about_me": profile.matrimony_profile.about_me if profile.matrimony_profile else None,
            "hobbies": profile.matrimony_profile.hobbies if profile.matrimony_profile else [],
            "languages": profile.matrimony_profile.languages if profile.matrimony_profile else [],
            "additional_photos": profile.matrimony_profile.additional_photos if profile.matrimony_profile else [],
            "visibility": profile.matrimony_profile.visibility if profile.matrimony_profile else "public"
        }
    }


@router.post("/onboard", status_code=status.HTTP_201_CREATED)
async def onboard_profile(
    payload: ProfileOnboard,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Handles the massive profile onboarding payload.
    Creates a Profile, and if opted-in, a MatrimonyProfile.
    Changes the user's role to 'pending' to trigger admin verification.
    """
    # 1. Check if profile already exists
    stmt = select(Profile).where(Profile.user_id == current_user.id)
    result = await db.execute(stmt)
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Profile already exists.")

    # 2. Parse Core Enums safely
    try:
        gender_val = Gender(payload.gender.lower())
        marital_val = MaritalStatus(payload.marital_status.lower())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 3. Create Core Profile
    new_profile = Profile(
        user_id=current_user.id,
        full_name=payload.full_name,
        date_of_birth=payload.date_of_birth,
        gender=gender_val,
        marital_status=marital_val,
        contact_number=payload.phone_number,
        address=payload.address,
        profile_photo_url=payload.profile_photo_url,
        is_memorial=False,
    )
    db.add(new_profile)
    await db.flush()

    # 4. Create Matrimony Profile if opted in
    if payload.create_matrimony:
        # Helper to parse enums if provided
        def safe_enum(enum_class, value):
            if not value: return None
            try: return enum_class(value.lower())
            except ValueError: return None # Gracefully ignore or raise 400

        matrimony_prof = MatrimonyProfile(
            profile_id=new_profile.id,
            opted_in=True,
            
            # Physical
            height_cm=payload.height_cm,
            body_type=safe_enum(BodyType, payload.body_type),
            complexion=safe_enum(Complexion, payload.complexion),
            
            # Professional
            highest_qualification=safe_enum(EducationLevel, payload.highest_qualification),
            field_of_study=payload.field_of_study,
            institution=payload.institution,
            employment_type=safe_enum(EmploymentType, payload.employment_type),
            job_title=payload.job_title,
            income_range=safe_enum(IncomeRange, payload.income_range),
            work_location=payload.work_location,
            
            # Horoscope
            gotra=payload.gotra,
            rashi=payload.rashi,
            nakshatra=payload.nakshatra,
            manglik_status=safe_enum(ManglikStatus, payload.manglik_status),
            birth_time=payload.birth_time,
            birth_place=payload.birth_place,
            
            # Family
            father_name=payload.father_name,
            father_occupation=payload.father_occupation,
            mother_name=payload.mother_name,
            mother_occupation=payload.mother_occupation,
            brothers_count=payload.brothers_count,
            brothers_marital_status=payload.brothers_marital_status,
            sisters_count=payload.sisters_count,
            sisters_marital_status=payload.sisters_marital_status,
            family_type=payload.family_type,
            family_values=payload.family_values,
            family_financial_status=payload.family_financial_status,
            
            # Lifestyle
            diet=safe_enum(Diet, payload.diet),
            smoking=payload.smoking,
            drinking=payload.drinking,
            physical_activity=safe_enum(ActivityLevel, payload.physical_activity),
            hobbies=payload.hobbies,
            languages=payload.languages,
            
            # Media & Prefs
            additional_photos=payload.additional_photos,
            visibility=safe_enum(ProfileVisibility, payload.visibility) or ProfileVisibility.all_verified
        )
        db.add(matrimony_prof)

    # 5. Create Verification Request
    from app.models.verification import VerificationRequest
    from app.models.enums import VerificationStatus
    ver_req = VerificationRequest(
        target_user_id=current_user.id,
        status=VerificationStatus.pending,
        escalated=False
    )
    db.add(ver_req)

    # 6. Update user role
    # Assuming UserRole.pending exists, if not just keep unverified.
    # The actual schema has UserRole.unverified, UserRole.member. We'll keep it unverified until approved.
    
    await db.commit()
    
    return {"message": "Onboarding completed successfully. Please wait for admin approval."}


@router.put("/me/matrimony", status_code=status.HTTP_200_OK)
async def update_matrimony_profile(
    payload: MatrimonyProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Updates or creates a matrimony profile for the current user.
    """
    # 1. Fetch Profile
    stmt = (
        select(Profile)
        .where(Profile.user_id == current_user.id)
        .options(selectinload(Profile.matrimony_profile))
    )
    result = await db.execute(stmt)
    profile = result.scalars().first()

    if not profile:
        raise HTTPException(status_code=404, detail="Core profile not found. Please complete onboarding.")

    # 2. Get or Create MatrimonyProfile
    mat_prof = profile.matrimony_profile
    is_new = False
    
    if not mat_prof:
        mat_prof = MatrimonyProfile(profile_id=profile.id, opted_in=True)
        is_new = True

    # Helper to parse enums safely
    def safe_enum(enum_class, value):
        if not value: return None
        try: return enum_class(value.lower())
        except ValueError: return None

    # 3. Update fields if provided in payload
    update_data = payload.model_dump(exclude_unset=True)
    
    # We must handle enum mappings for certain fields if they are in the dict
    enum_mappings = {
        'diet': Diet,
        'physical_activity': ActivityLevel,
        'visibility': ProfileVisibility
    }

    for key, value in update_data.items():
        if key in enum_mappings and value is not None:
            setattr(mat_prof, key, safe_enum(enum_mappings[key], value))
        else:
            setattr(mat_prof, key, value)

    if is_new:
        db.add(mat_prof)
        
    await db.commit()
    return {"message": "Matrimony profile updated successfully."}

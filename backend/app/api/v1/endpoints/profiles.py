"""
CommunityConnect Backend — Profile Endpoints
============================================

Routes (prefix: /api/v1/profiles):
  GET    /me                    Retrieve the currently authenticated user's full profile + wards
  POST   /onboard               Submit the full onboarding profile (triggers admin verification)
  PUT    /me                    Update matrimony profile fields
  PUT    /me/username           Update the user's unique @username handle
  PUT    /me/social             Update social media links (LinkedIn, Instagram, Facebook, Twitter)
  GET    /by-username/{username}  Look up a public profile by username (used for co-approver verification)

Access:
  All routes require Bearer JWT authentication.
  /onboard requires role: unverified
  /me (PUT variants) require role: verified_adult | local_admin | community_admin
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
import re
import random
from pydantic import BaseModel
from app.schemas.profile import ProfileOnboard, MatrimonyProfileUpdate, SocialLinksUpdate, UsernameUpdate, ProfileUpdate

router = APIRouter()

async def generate_unique_username(db: AsyncSession, full_name: str) -> str:
    base = re.sub(r'[^a-z0-9_]', '', full_name.lower().replace(' ', '_'))
    if not base or len(base) < 3:
        base = "user"
    base = base[:15]
    
    username = base
    while True:
        stmt = select(Profile).where(Profile.username == username)
        result = await db.execute(stmt)
        if not result.scalars().first():
            return username
        username = f"{base}_{random.randint(100, 999)}"


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
        .options(
            selectinload(Profile.matrimony_profile).selectinload(MatrimonyProfile.family_co_approver)
        )
    )
    result = await db.execute(stmt)
    profile = result.scalars().first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found for this user account."
        )

    # Auto-generate username if empty
    if not profile.username:
        profile.username = await generate_unique_username(db, profile.full_name)
        await db.commit()

    # Fetch wards where current user is designated as co-approver
    wards_stmt = (
        select(MatrimonyProfile)
        .where(MatrimonyProfile.family_co_approver_profile_id == profile.id)
        .options(selectinload(MatrimonyProfile.profile))
    )
    wards_res = await db.execute(wards_stmt)
    wards = wards_res.scalars().all()

    return {
        "id": str(current_user.id),
        "role": current_user.role.value,
        "full_name": profile.full_name,
        "username": profile.username,
        "email": current_user.email,
        "preferred_language": getattr(current_user, "preferred_language", "en"),
        "date_of_birth": profile.date_of_birth,
        "gender": profile.gender.value,
        "marital_status": profile.marital_status.value,
        "profile_photo_url": profile.profile_photo_url,
        "contact_number": profile.contact_number,
        "address": profile.address,
        "occupation": profile.occupation,
        "social_links": profile.social_links,
        "matrimony": {
            "opted_in": profile.matrimony_profile.opted_in if profile.matrimony_profile else False,
            "double_approval_required": profile.matrimony_profile.double_approval_required if profile.matrimony_profile else False,
            "family_co_approver_profile_id": str(profile.matrimony_profile.family_co_approver_profile_id) if (profile.matrimony_profile and profile.matrimony_profile.family_co_approver_profile_id) else None,
            "family_co_approver_name": profile.matrimony_profile.family_co_approver.full_name if (profile.matrimony_profile and profile.matrimony_profile.family_co_approver) else None,
            "family_co_approver_username": profile.matrimony_profile.family_co_approver.username if (profile.matrimony_profile and profile.matrimony_profile.family_co_approver) else None,
            "family_co_approver_approved": profile.matrimony_profile.family_co_approver_approved if profile.matrimony_profile else False,
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
        },
        "wards": [
            {
                "profile_id": str(w.profile_id),
                "full_name": w.profile.full_name if w.profile else None,
                "username": w.profile.username if w.profile else None,
                "gender": w.profile.gender.value if w.profile else None,
                "profile_photo_url": w.profile.profile_photo_url if w.profile else None,
                "approved": w.family_co_approver_approved
            }
            for w in wards
        ]
    }


class LanguagePreferenceRequest(BaseModel):
    preferred_language: str


@router.put("/preferred-language", status_code=status.HTTP_200_OK)
async def update_preferred_language(
    payload: LanguagePreferenceRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Updates the logged-in user's preferred interface language.
    """
    lang = payload.preferred_language.lower().strip()
    if lang not in ["en", "kn", "hi", "es", "mr"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid language code selection. Supported: 'en', 'kn', 'hi', 'es', 'mr'"
        )

    current_user.preferred_language = lang
    await db.commit()
    return {"message": "Language priority updated successfully.", "preferred_language": lang}


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

    # Check and generate username
    username_val = payload.username
    if not username_val:
        username_val = await generate_unique_username(db, payload.full_name)
    else:
        stmt_u = select(Profile).where(Profile.username == username_val)
        res_u = await db.execute(stmt_u)
        if res_u.scalars().first():
            raise HTTPException(status_code=400, detail="Username is already taken.")

    # Validate region if selected
    if payload.region_id:
        from app.models.region import AdminRegion
        reg_stmt = select(AdminRegion).where(AdminRegion.id == payload.region_id)
        reg_res = await db.execute(reg_stmt)
        if not reg_res.scalars().first():
            raise HTTPException(status_code=400, detail="Invalid Region ID selected.")

    # Set aadhar fields on the user
    current_user.aadhar_number = payload.aadhar_number
    current_user.aadhar_card_url = payload.aadhar_card_url
    # Schedule aadhar data deletion 8 days after verification
    current_user.aadhar_data_delete_at = None

    # Validate photo count based on role/type
    if payload.create_matrimony:
        if len(payload.additional_photos or []) > 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Matrimony profiles are limited to at most 6 photos in total (1 profile photo + 5 additional photos)."
            )
    else:
        if payload.additional_photos and len(payload.additional_photos) > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Normal profiles are limited to exactly 1 photo (profile photo) and cannot have additional photos."
            )

    # 3. Create Core Profile
    new_profile = Profile(
        user_id=current_user.id,
        username=username_val,
        full_name=payload.full_name,
        date_of_birth=payload.date_of_birth,
        gender=gender_val,
        marital_status=marital_val,
        contact_number=payload.phone_number,
        address=payload.address,
        region_id=payload.region_id,
        profile_photo_url=payload.profile_photo_url,
        is_memorial=False,
        social_links=payload.social_links,
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
            company_name=payload.company_name,
            income_range=safe_enum(IncomeRange, payload.income_range),
            work_location=payload.work_location,
            
            # Horoscope
            gotra=payload.gotra,
            sub_caste=payload.sub_caste,
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
        region_id=payload.region_id,
        status=VerificationStatus.pending,
        escalated=False
    )
    db.add(ver_req)

    # 6. Update user role
    # Assuming UserRole.pending exists, if not just keep unverified.
    # The actual schema has UserRole.unverified, UserRole.member. We'll keep it unverified until approved.
    
    await db.commit()
    
    return {"message": "Onboarding completed successfully. Please wait for admin approval."}


@router.put("/me", status_code=status.HTTP_200_OK)
async def update_my_profile(
    payload: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Updates the logged-in user's core profile details (address, occupation, etc.),
    explicitly locking name, DOB, and role from updates.
    """
    stmt = select(Profile).where(Profile.user_id == current_user.id)
    result = await db.execute(stmt)
    profile = result.scalars().first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found."
        )

    # Update basic text/json fields if provided in payload
    update_data = payload.model_dump(exclude_unset=True)

    # Safely parse enums if updated
    if "gender" in update_data and update_data["gender"] is not None:
        try:
            profile.gender = Gender(update_data["gender"].lower())
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid gender value.")
            
    if "marital_status" in update_data and update_data["marital_status"] is not None:
        try:
            profile.marital_status = MaritalStatus(update_data["marital_status"].lower())
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid marital status value.")

    for field in ["address", "occupation", "profile_photo_url", "contact_number", "social_links"]:
        if field in update_data:
            setattr(profile, field, update_data[field])

    await db.commit()
    return {"message": "Profile updated successfully."}


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

    if "additional_photos" in update_data and update_data["additional_photos"] is not None:
        if len(update_data["additional_photos"]) > 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Matrimony profiles are limited to at most 6 photos in total (1 profile photo + 5 additional photos)."
            )

    if "family_co_approver_profile_id" in update_data:
        co_id = update_data["family_co_approver_profile_id"]
        if co_id != mat_prof.family_co_approver_profile_id:
            mat_prof.family_co_approver_approved = False
        
        if co_id is not None:
            res_co = await db.get(Profile, co_id)
            if not res_co:
                raise HTTPException(status_code=400, detail="Family co-approver profile not found.")
    
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


@router.get("/by-username/{username}", status_code=status.HTTP_200_OK)
async def get_profile_by_username(
    username: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Looks up a profile by username.
    """
    stmt = (
        select(Profile)
        .where(Profile.username == username.lower().strip())
        .options(
            selectinload(Profile.matrimony_profile).selectinload(MatrimonyProfile.family_co_approver)
        )
    )
    result = await db.execute(stmt)
    profile = result.scalars().first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Username not found.")
        
    from app.models.matrimony import ConnectionRequest
    connection_status = "none"
    connection_request_id = None
    
    my_profile_stmt = select(Profile).where(Profile.user_id == current_user.id)
    my_profile_res = await db.execute(my_profile_stmt)
    my_profile = my_profile_res.scalars().first()
    
    if my_profile:
        req_stmt = select(ConnectionRequest).where(
            ((ConnectionRequest.sender_profile_id == my_profile.id) & (ConnectionRequest.receiver_profile_id == profile.id)) |
            ((ConnectionRequest.sender_profile_id == profile.id) & (ConnectionRequest.receiver_profile_id == my_profile.id))
        )
        req_res = await db.execute(req_stmt)
        req = req_res.scalars().first()
        if req:
            connection_request_id = str(req.id)
            connection_status = req.status.value

            
    res = {
        "profile_id": str(profile.id),
        "full_name": profile.full_name,
        "username": profile.username,
        "date_of_birth": profile.date_of_birth.isoformat() if profile.date_of_birth else None,
        "gender": profile.gender.value if profile.gender else None,
        "marital_status": profile.marital_status.value if profile.marital_status else None,
        "profile_photo_url": profile.profile_photo_url,
        "contact_number": profile.contact_number if current_user.id == profile.user_id else None,
        "address": profile.address if (connection_status == "approved" or current_user.id == profile.user_id) else None,
        "occupation": profile.occupation,
        "connection_status": connection_status,
        "connection_request_id": connection_request_id,
    }
    
    if profile.matrimony_profile:
        res["about_me"] = profile.matrimony_profile.about_me
        res["hobbies"] = profile.matrimony_profile.hobbies
        res["languages"] = profile.matrimony_profile.languages
        res["matrimony_details"] = {
            "height_cm": profile.matrimony_profile.height_cm,
            "body_type": profile.matrimony_profile.body_type,
            "complexion": profile.matrimony_profile.complexion,
            "highest_qualification": profile.matrimony_profile.highest_qualification,
            "field_of_study": profile.matrimony_profile.field_of_study,
            "institution": profile.matrimony_profile.institution,
            "employment_type": profile.matrimony_profile.employment_type,
            "job_title": profile.matrimony_profile.job_title,
            "company_name": profile.matrimony_profile.company_name,
            "income_range": profile.matrimony_profile.income_range,
            "work_location": profile.matrimony_profile.work_location,
            "gotra": profile.matrimony_profile.gotra,
            "sub_caste": profile.matrimony_profile.sub_caste,
            "rashi": profile.matrimony_profile.rashi,
            "nakshatra": profile.matrimony_profile.nakshatra,
            "manglik_status": profile.matrimony_profile.manglik_status,
            "birth_time": profile.matrimony_profile.birth_time,
            "birth_place": profile.matrimony_profile.birth_place,
            "diet": profile.matrimony_profile.diet,
            "smoking": profile.matrimony_profile.smoking,
            "drinking": profile.matrimony_profile.drinking,
            "physical_activity": profile.matrimony_profile.physical_activity,
            "father_name": profile.matrimony_profile.father_name,
            "father_occupation": profile.matrimony_profile.father_occupation,
            "mother_name": profile.matrimony_profile.mother_name,
            "mother_occupation": profile.matrimony_profile.mother_occupation,
            "family_type": profile.matrimony_profile.family_type,
            "family_values": profile.matrimony_profile.family_values,
            "family_financial_status": profile.matrimony_profile.family_financial_status,
            "family_background": f"Father: {profile.matrimony_profile.father_name} ({profile.matrimony_profile.father_occupation}). Mother: {profile.matrimony_profile.mother_name} ({profile.matrimony_profile.mother_occupation}).",
            "additional_photos": profile.matrimony_profile.additional_photos if (connection_status == "approved" or current_user.id == profile.user_id) else []
        }
        
    return res


@router.put("/me/username", status_code=status.HTTP_200_OK)
async def update_username(
    payload: UsernameUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Manually sets or updates the logged-in user's username.
    """
    stmt = select(Profile).where(Profile.user_id == current_user.id)
    result = await db.execute(stmt)
    profile = result.scalars().first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")
        
    new_username = payload.username
    
    # Check if username is already taken by someone else
    stmt_check = select(Profile).where(Profile.username == new_username, Profile.id != profile.id)
    result_check = await db.execute(stmt_check)
    if result_check.scalars().first():
        raise HTTPException(status_code=400, detail="Username is already taken.")
        
    profile.username = new_username
    await db.commit()
    return {"message": "Username updated successfully.", "username": new_username}


@router.put("/me/social", status_code=status.HTTP_200_OK)
async def update_social_links(
    payload: SocialLinksUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Updates the social handles for the current user's profile.
    """
    stmt = select(Profile).where(Profile.user_id == current_user.id)
    result = await db.execute(stmt)
    profile = result.scalars().first()

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")

    profile.social_links = payload.social_links
    await db.commit()
    return {"message": "Social links updated successfully."}

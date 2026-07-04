"""
CommunityConnect Backend - Administrative Endpoints
"""

from datetime import date
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.security import hash_password
from app.db.session import get_db
from app.api.deps import RoleChecker
from app.models.user import User
from app.models.profile import Profile
from app.models.region import AdminRegion, LocalAdminRegion
from app.models.verification import VerificationRequest
from app.models.matrimony import MatrimonyProfile
from app.models.enums import UserRole, Gender, MaritalStatus, VerificationStatus
from app.schemas.admin import AdminCreate, ProfileAdminUpdate

router = APIRouter()


@router.post("/create-admin", status_code=status.HTTP_201_CREATED)
async def create_administrator(
    request: AdminCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(RoleChecker([UserRole.community_admin]))
):
    """
    Creates a new administrator account (either community_admin or local_admin).
    - Can only be called by an existing community_admin.
    - Password is encrypted.
    - Automatically creates a corresponding verified Profile.
    - Scopes local_admin to a specific AdminRegion if region_id is provided.
    """
    # 1. Check if user already exists
    stmt = select(User).where(User.phone_number == request.phone_number)
    result = await db.execute(stmt)
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this phone number already exists."
        )

    # 2. If local_admin and region_id is supplied, verify region exists
    if request.role == UserRole.local_admin and request.region_id:
        reg_stmt = select(AdminRegion).where(AdminRegion.id == request.region_id)
        reg_res = await db.execute(reg_stmt)
        region = reg_res.scalars().first()
        if not region:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assigned Admin Region not found."
            )

    # 3. Create User record
    hashed_pwd = hash_password(request.password)
    user = User(
        phone_number=request.phone_number,
        email=request.email,
        password_hash=hashed_pwd,
        role=request.role,
        is_active=True
    )
    db.add(user)
    await db.flush() # Populate user.id

    # 4. Create Profile (Admins profiles are immediately active and verified)
    profile = Profile(
        user_id=user.id,
        full_name=request.full_name,
        date_of_birth=date(1980, 1, 1), # Default placeholder DOB for admin
        gender=Gender.other,
        marital_status=MaritalStatus.single,
        profile_photo_url="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde", # Default avatar
        contact_number=request.phone_number,
        address=request.address,
        is_memorial=False
    )
    db.add(profile)
    await db.flush()

    # 5. Map Local Admin to Region if provided
    if request.role == UserRole.local_admin and request.region_id:
        mapping = LocalAdminRegion(
            user_id=user.id,
            region_id=request.region_id
        )
        db.add(mapping)

    await db.commit()

    return {
        "message": f"Administrator ({request.role.value}) created successfully.",
        "user_id": str(user.id),
        "phone_number": user.phone_number,
        "role": user.role.value
    }


@router.get("/dashboard", status_code=status.HTTP_200_OK)
async def get_admin_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(RoleChecker([UserRole.community_admin, UserRole.local_admin]))
):
    """
    Returns summary statistics for the administration dashboard.
    """
    # 1. Total users
    tot_stmt = select(func.count(User.id))
    tot_res = await db.execute(tot_stmt)
    total_users = tot_res.scalar() or 0

    # 2. Verified users
    ver_stmt = select(func.count(User.id)).where(User.role != UserRole.unverified)
    ver_res = await db.execute(ver_stmt)
    verified_users = ver_res.scalar() or 0

    # 3. Pending requests
    pend_stmt = select(func.count(VerificationRequest.id)).where(VerificationRequest.status == VerificationStatus.pending)
    pend_res = await db.execute(pend_stmt)
    pending_verifications = pend_res.scalar() or 0

    # 4. Matrimony opted-in
    mat_stmt = select(func.count(MatrimonyProfile.profile_id)).where(MatrimonyProfile.opted_in == True)
    mat_res = await db.execute(mat_stmt)
    matrimony_opt_ins = mat_res.scalar() or 0

    return {
        "total_users": total_users,
        "verified_users": verified_users,
        "pending_verifications": pending_verifications,
        "matrimony_opt_ins": matrimony_opt_ins
    }


@router.get("/users", status_code=status.HTTP_200_OK)
async def list_all_users(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(RoleChecker([UserRole.community_admin, UserRole.local_admin]))
):
    """
    Returns a list of all users and profiles inside the system.
    """
    stmt = select(Profile).join(User, Profile.user_id == User.id).options(selectinload(Profile.user))
    result = await db.execute(stmt)
    profiles = result.scalars().all()

    response_data = []
    for prof in profiles:
        response_data.append({
            "profile_id": str(prof.id),
            "user_id": str(prof.user_id) if prof.user_id else None,
            "full_name": prof.full_name,
            "username": prof.username,
            "date_of_birth": prof.date_of_birth,
            "gender": prof.gender.value,
            "marital_status": prof.marital_status.value,
            "profile_photo_url": prof.profile_photo_url,
            "contact_number": prof.contact_number,
            "address": prof.address,
            "occupation": prof.occupation,
            "is_memorial": prof.is_memorial,
            "user": {
                "role": prof.user.role.value if prof.user else None,
                "is_active": prof.user.is_active if prof.user else None,
                "phone_number": prof.user.phone_number if prof.user else None
            } if prof.user else None
        })
    return response_data


@router.put("/users/{user_id}", status_code=status.HTTP_200_OK)
async def update_user_profile_admin(
    user_id: uuid.UUID,
    request: ProfileAdminUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(RoleChecker([UserRole.community_admin]))
):
    """
    Allows a Community Admin to overwrite any profile field or user status/role directly.
    """
    # 1. Fetch User
    stmt = select(User).where(User.id == user_id).options(selectinload(User.profile))
    result = await db.execute(stmt)
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    profile = user.profile
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found for this user.")

    # 2. Resolve Enums
    try:
        gender_enum = Gender(request.gender.lower())
        marital_enum = MaritalStatus(request.marital_status.lower())
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid enum values supplied.")

    # 3. Update User
    user.role = request.role
    user.is_active = request.is_active

    # 4. Update Profile
    profile.full_name = request.full_name
    profile.date_of_birth = request.date_of_birth
    profile.gender = gender_enum
    profile.marital_status = marital_enum
    profile.address = request.address
    profile.occupation = request.occupation
    profile.profile_photo_url = request.profile_photo_url

    await db.commit()
    return {"message": "User and profile details updated successfully."}


@router.get("/matrimony", status_code=status.HTTP_200_OK)
async def list_all_matrimony_profiles(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(RoleChecker([UserRole.community_admin, UserRole.local_admin]))
):
    """
    Returns a list of all opted-in matrimonial profiles in the system.
    """
    stmt = select(MatrimonyProfile).where(MatrimonyProfile.opted_in == True).options(selectinload(MatrimonyProfile.profile))
    result = await db.execute(stmt)
    mat_profiles = result.scalars().all()

    response_data = []
    for mat in mat_profiles:
        prof = mat.profile
        response_data.append({
            "profile_id": str(mat.profile_id),
            "about_me": mat.about_me,
            "education": mat.highest_qualification,
            "family_background": f"Father: {mat.father_name or '—'} ({mat.father_occupation or '—'}), Mother: {mat.mother_name or '—'} ({mat.mother_occupation or '—'})",
            "hobbies": mat.hobbies,
            "preferences": mat.preferences,
            "profile": {
                "full_name": prof.full_name if prof else None,
                "date_of_birth": prof.date_of_birth if prof else None,
                "gender": prof.gender.value if prof else None,
                "marital_status": prof.marital_status.value if prof else None,
                "profile_photo_url": prof.profile_photo_url if prof else None,
                "contact_number": prof.contact_number if prof else None,
                "address": prof.address if prof else None,
                "occupation": prof.occupation if prof else None,
            } if prof else None
        })
    return response_data


@router.delete("/users/{user_id}", status_code=status.HTTP_200_OK)
async def delete_user_account_admin(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(RoleChecker([UserRole.community_admin]))
):
    """
    Permanent deletion of user account and associated profile/matrimony details.
    """
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    await db.delete(user)
    await db.commit()
    return {"message": "User account and all associated profile details deleted successfully."}

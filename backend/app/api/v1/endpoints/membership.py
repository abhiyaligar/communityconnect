"""
CommunityConnect Backend — Membership Endpoints

Routes (prefix: /api/v1/membership):
  GET   /me        Retrieve the current user's membership status
  POST  /create    Create/assign a membership for a user (admin only)

Access:
  GET /me requires Bearer JWT authentication.
  POST /create requires community_admin role.
"""

from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_user, RoleChecker
from app.models.user import User
from app.models.profile import Profile
from app.models.membership import Membership, MembershipStatus
from app.models.enums import UserRole

router = APIRouter()


class CreateMembershipRequest(BaseModel):
    user_id: str
    username: str
    start_date: date
    end_date: date
    status: str = "active"


@router.get("/me", status_code=status.HTTP_200_OK)
async def get_my_membership(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns the current user's membership details.
    """
    stmt = select(Membership).where(Membership.user_id == current_user.id)
    result = await db.execute(stmt)
    membership = result.scalars().first()

    if not membership:
        return {
            "has_membership": False,
            "status": None,
            "start_date": None,
            "end_date": None,
        }

    return {
        "has_membership": True,
        "status": membership.status.value,
        "start_date": membership.start_date.isoformat() if membership.start_date else None,
        "end_date": membership.end_date.isoformat() if membership.end_date else None,
    }


@router.post("/create", status_code=status.HTTP_201_CREATED)
async def create_membership(
    payload: CreateMembershipRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.community_admin, UserRole.local_admin]))
):
    """
    Creates a membership record for a user. Admin only.
    """
    user_stmt = select(User).where(User.id == payload.user_id)
    user_res = await db.execute(user_stmt)
    user = user_res.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    existing_stmt = select(Membership).where(Membership.user_id == user.id)
    existing_res = await db.execute(existing_stmt)
    if existing_res.scalars().first():
        raise HTTPException(status_code=400, detail="User already has a membership.")

    try:
        status_val = MembershipStatus(payload.status.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid membership status. Use 'active' or 'inactive'.")

    membership = Membership(
        user_id=user.id,
        username=payload.username,
        start_date=payload.start_date,
        end_date=payload.end_date,
        status=status_val,
    )
    db.add(membership)
    await db.commit()
    await db.refresh(membership)

    return {
        "message": "Membership created successfully.",
        "membership_id": str(membership.id),
    }


class UpdateMembershipRequest(BaseModel):
    start_date: date | None = None
    end_date: date | None = None
    status: str | None = None


@router.put("/update", status_code=status.HTTP_200_OK)
async def update_membership(
    user_id: str,
    payload: UpdateMembershipRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.community_admin]))
):
    """
    Update a user's membership validity and status. Community admin only.
    """
    stmt = select(Membership).where(Membership.user_id == user_id)
    result = await db.execute(stmt)
    membership = result.scalars().first()

    if not membership:
        raise HTTPException(status_code=404, detail="Membership not found for this user.")

    if payload.start_date is not None:
        membership.start_date = payload.start_date
    if payload.end_date is not None:
        membership.end_date = payload.end_date
    if payload.status is not None:
        try:
            membership.status = MembershipStatus(payload.status.lower())
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid membership status. Use 'active' or 'inactive'.")

    await db.commit()
    await db.refresh(membership)

    return {
        "message": "Membership updated successfully.",
        "membership_id": str(membership.id),
        "start_date": membership.start_date.isoformat() if membership.start_date else None,
        "end_date": membership.end_date.isoformat() if membership.end_date else None,
        "status": membership.status.value,
    }


@router.get("/admin/user/{user_id}", status_code=status.HTTP_200_OK)
async def get_user_membership_admin(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.community_admin]))
):
    """
    Fetch a specific user's membership. Community admin only.
    """
    stmt = select(Membership).where(Membership.user_id == user_id)
    result = await db.execute(stmt)
    membership = result.scalars().first()

    if not membership:
        return {
            "has_membership": False,
            "status": None,
            "start_date": None,
            "end_date": None,
        }

    return {
        "has_membership": True,
        "status": membership.status.value,
        "start_date": membership.start_date.isoformat() if membership.start_date else None,
        "end_date": membership.end_date.isoformat() if membership.end_date else None,
    }


class MembershipUserResponse(BaseModel):
    user_id: str
    full_name: str
    username: str | None = None
    profile_photo_url: str | None = None
    role: str
    membership: dict | None = None


@router.get("/admin/list", response_model=List[MembershipUserResponse])
async def list_users_with_membership(
    search: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.community_admin, UserRole.local_admin]))
):
    """
    List all users with their membership info. Supports search by name/username.
    Admin only.
    """
    stmt = (
        select(Profile)
        .join(User, Profile.user_id == User.id)
        .options(selectinload(Profile.user).selectinload(User.membership))
        .order_by(Profile.full_name)
    )

    if search:
        stmt = stmt.where(
            or_(
                Profile.full_name.ilike(f"%{search}%"),
                Profile.username.ilike(f"%{search}%"),
            )
        )

    if current_user.role == UserRole.local_admin:
        from app.models.region import LocalAdminRegion
        reg_stmt = select(LocalAdminRegion.region_id).where(LocalAdminRegion.user_id == current_user.id)
        reg_res = await db.execute(reg_stmt)
        region_ids = reg_res.scalars().all()
        if not region_ids:
            return []
        stmt = stmt.where(Profile.region_id.in_(region_ids))

    stmt = stmt.offset(offset).limit(limit)
    result = await db.execute(stmt)
    profiles = result.scalars().all()

    response = []
    for prof in profiles:
        mem = None
        user_mem = prof.user.membership if prof.user else None
        if user_mem:
            mem = {
                "has_membership": True,
                "status": user_mem.status.value,
                "start_date": user_mem.start_date.isoformat() if user_mem.start_date else None,
                "end_date": user_mem.end_date.isoformat() if user_mem.end_date else None,
            }
        response.append(MembershipUserResponse(
            user_id=str(prof.user_id),
            full_name=prof.full_name,
            username=prof.username,
            profile_photo_url=prof.profile_photo_url,
            role=prof.user.role.value if prof.user else "",
            membership=mem,
        ))
    return response

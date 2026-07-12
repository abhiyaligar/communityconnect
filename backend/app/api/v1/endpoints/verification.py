"""
CommunityConnect Backend - Verification Operations Endpoints
"""

import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any


from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func as sqlfunc

from app.db.session import get_db
from app.api.deps import get_current_user, RoleChecker
from app.models.user import User
from app.models.profile import Profile
from app.models.region import LocalAdminRegion
from app.models.verification import VerificationRequest, VerificationApproval
from app.models.enums import UserRole, VerificationStatus
from app.schemas.verification import VerificationReview, EscalationRequest
from app.utils.email import send_verification_status_email

router = APIRouter()


@router.get("/pending", status_code=status.HTTP_200_OK)
async def get_pending_verifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.community_admin, UserRole.local_admin]))
):
    """
    Returns pending verification requests.
    - For community_admin: Returns all pending/escalated requests.
    - For local_admin: Returns requests scoped only to their assigned region.
    """
    if current_user.role == UserRole.community_admin:
        # Fetch all pending, local_approved, or escalated requests
        stmt = (
            select(VerificationRequest)
            .where(VerificationRequest.status.in_([
                VerificationStatus.pending,
                VerificationStatus.local_approved,
                VerificationStatus.escalated
            ]))
            .options(
                selectinload(VerificationRequest.target_user).selectinload(User.profile).selectinload(Profile.matrimony_profile),
                selectinload(VerificationRequest.target_user).selectinload(User.local_admin_regions),
                selectinload(VerificationRequest.region),
                selectinload(VerificationRequest.approvals)
            )
        )
    else:
        # Local Admin: Get their assigned regions
        reg_stmt = select(LocalAdminRegion.region_id).where(LocalAdminRegion.user_id == current_user.id)
        reg_res = await db.execute(reg_stmt)
        region_ids = reg_res.scalars().all()

        if not region_ids:
            return []

        # Filter verification requests by local admin's region
        stmt = (
            select(VerificationRequest)
            .where(
                VerificationRequest.status == VerificationStatus.pending,
                VerificationRequest.region_id.in_(region_ids)
            )
            .options(
                selectinload(VerificationRequest.target_user).selectinload(User.profile).selectinload(Profile.matrimony_profile),
                selectinload(VerificationRequest.target_user).selectinload(User.local_admin_regions),
                selectinload(VerificationRequest.region),
                selectinload(VerificationRequest.approvals)
            )
        )

    result = await db.execute(stmt)
    requests = result.scalars().all()

    response_data = []
    for req in requests:
        user_profile = req.target_user.profile if req.target_user else None
        matrimony = user_profile.matrimony_profile if user_profile else None
        
        # Calculate approvals count for local admin targets
        approval_count = len([a for a in req.approvals if a.decision == "approved" and a.approver_role == "local_admin"])
        
        # Determine target role based on role or mapping
        is_ladmin = req.target_user.role == UserRole.local_admin or (
            req.target_user.role == UserRole.unverified and len(req.target_user.local_admin_regions) > 0
        )
        target_role_val = "local_admin" if is_ladmin else req.target_user.role.value
        
        # Mask aadhar number: show only last 4 digits
    aadhar_raw = req.target_user.aadhar_number if req.target_user else None
    aadhar_masked = f"XXXX XXXX {aadhar_raw[-4:]}" if aadhar_raw and len(aadhar_raw) == 12 else None

    response_data.append({
            "request_id": str(req.id),
            "user_id": str(req.target_user_id),
            "status": req.status.value,
            "escalated": req.escalated,
            "escalation_reason": req.escalation_reason,
            "created_at": req.created_at,
            "target_role": target_role_val,
            "approval_count": approval_count,
            "region_name": req.region.name if req.region else None,
            "profile": {
                "full_name": user_profile.full_name if user_profile else None,
                "date_of_birth": user_profile.date_of_birth if user_profile else None,
                "gender": user_profile.gender.value if user_profile else None,
                "profile_photo_url": user_profile.profile_photo_url if user_profile else None,
                "contact_number": user_profile.contact_number if user_profile else None,
                "address": user_profile.address if user_profile else None,
                "occupation": user_profile.occupation if user_profile else None,
                "social_links": user_profile.social_links if user_profile else None,
                "aadhar_number": aadhar_masked,
                "aadhar_card_url": req.target_user.aadhar_card_url if req.target_user else None,
            } if user_profile else None,
            "matrimony": {
                "opted_in": matrimony.opted_in if matrimony else False,
                "height_cm": matrimony.height_cm if matrimony else None,
                "employment_type": matrimony.employment_type if matrimony and matrimony.employment_type else None,
                "company_name": matrimony.company_name if matrimony and matrimony.company_name else None,
                "gotra": matrimony.gotra if matrimony else None,
                "sub_caste": matrimony.sub_caste if matrimony else None,
                "highest_qualification": matrimony.highest_qualification if matrimony and matrimony.highest_qualification else None,
                "rashi": matrimony.rashi if matrimony else None,
                "nakshatra": matrimony.nakshatra if matrimony else None,
                "manglik_status": matrimony.manglik_status if matrimony else None,
                "birth_time": matrimony.birth_time if matrimony else None,
                "birth_place": matrimony.birth_place if matrimony else None,
                "father_name": matrimony.father_name if matrimony else None,
                "mother_name": matrimony.mother_name if matrimony else None,
                "family_values": matrimony.family_values if matrimony else None,
            } if matrimony else None
        })

    return response_data


@router.post("/{request_id}/approve", status_code=status.HTTP_200_OK)
async def approve_verification(
    request_id: uuid.UUID,
    review: VerificationReview,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.community_admin, UserRole.local_admin]))
):
    """
    Submits an approval vote or final verification approval for a request.
    - If called by Community Admin: Immediately approves the user.
    - If called by Local Admin for regular member: Approves the user.
    - If verifying another Local Admin: Increments approval count (needs >= 4 peer approvals).
    """
    stmt = (
        select(VerificationRequest)
        .where(VerificationRequest.id == request_id)
        .options(
            selectinload(VerificationRequest.target_user).selectinload(User.local_admin_regions),
            selectinload(VerificationRequest.target_user).selectinload(User.profile),
        )
    )
    result = await db.execute(stmt)
    req = result.scalars().first()

    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Verification request not found.")

    target_user = req.target_user

    if current_user.id == req.target_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot approve your own verification request."
        )

    # Create Approval Record
    approval = VerificationApproval(
        verification_request_id=req.id,
        approver_user_id=current_user.id,
        approver_role=current_user.role.value,
        decision="approved",
        comments=review.comments
    )
    db.add(approval)

    # Determine if target user is a local admin candidate (role local_admin OR unverified with regional mapping)
    is_local_admin_candidate = (
        target_user.role == UserRole.local_admin or
        (target_user.role == UserRole.unverified and len(target_user.local_admin_regions) > 0)
    )

    # Determine final role
    target_role = UserRole.local_admin if is_local_admin_candidate else UserRole.verified_adult

    now = datetime.now(timezone.utc)

    if current_user.role == UserRole.community_admin:
        # Super Admin approval is final
        req.status = VerificationStatus.approved
        target_user.role = target_role
        target_user.verified_at = now
    else:
        # Local Admin approval
        if is_local_admin_candidate:
            # Requires peer verification (minimum 4 admins)
            votes_stmt = select(sqlfunc.count(sqlfunc.distinct(VerificationApproval.approver_user_id))).where(
                VerificationApproval.verification_request_id == req.id,
                VerificationApproval.decision == "approved",
                VerificationApproval.approver_role == "local_admin"
            )
            votes_res = await db.execute(votes_stmt)
            vote_count = votes_res.scalar() or 0

            if vote_count >= 4:
                req.status = VerificationStatus.approved
                target_user.role = UserRole.local_admin
                target_user.verified_at = now
            else:
                req.status = VerificationStatus.local_approved
        else:
            # Regular user: one local admin approval is final
            req.status = VerificationStatus.approved
            target_user.role = target_role
            target_user.verified_at = now

    # Schedule aadhar data deletion 8 days after verification
    if req.status == VerificationStatus.approved:
        target_user.aadhar_verified_at = now
        target_user.aadhar_data_delete_at = now + timedelta(days=8)

        # Send approval email
        full_name = target_user.profile.full_name if target_user.profile else target_user.email.split("@")[0].replace(".", " ").title()
        try:
            await send_verification_status_email(target_user.email, full_name, "approved")
        except Exception:
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send approval email to {target_user.email}")

    await db.commit()
    return {"message": "Verification approval recorded successfully."}


@router.post("/{request_id}/reject", status_code=status.HTTP_200_OK)
async def reject_verification(
    request_id: uuid.UUID,
    review: VerificationReview,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.community_admin, UserRole.local_admin]))
):
    """
    Rejects the verification request and leaves the account locked as unverified.
    """
    stmt = (
        select(VerificationRequest)
        .where(VerificationRequest.id == request_id)
        .options(
            selectinload(VerificationRequest.target_user).selectinload(User.profile)
        )
    )
    result = await db.execute(stmt)
    req = result.scalars().first()

    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Verification request not found.")

    # Record rejection audit
    approval = VerificationApproval(
        verification_request_id=req.id,
        approver_user_id=current_user.id,
        approver_role=current_user.role.value,
        decision="rejected",
        comments=review.comments
    )
    db.add(approval)

    req.status = VerificationStatus.rejected
    req.target_user.role = UserRole.unverified

    # Send rejection email
    target_user = req.target_user
    full_name = target_user.profile.full_name if target_user.profile else target_user.email.split("@")[0].replace(".", " ").title()
    try:
        await send_verification_status_email(target_user.email, full_name, "rejected", review.comments)
    except Exception:
        logger.error(f"Failed to send rejection email to {target_user.email}")

    await db.commit()
    return {"message": "Verification request rejected."}


@router.post("/cleanup-aadhar", status_code=status.HTTP_200_OK)
async def cleanup_expired_aadhar_data(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.community_admin]))
):
    """
    Cleans up aadhar data for users whose 8-day deletion period has passed.
    Should be called periodically (e.g., via cron) to purge expired aadhar data.
    """
    now = datetime.now(timezone.utc)
    stmt = select(User).where(
        User.aadhar_data_delete_at.isnot(None),
        User.aadhar_data_delete_at <= now
    )
    result = await db.execute(stmt)
    users = result.scalars().all()

    count = 0
    for user in users:
        user.aadhar_number = None
        user.aadhar_card_url = None
        user.aadhar_verified_at = None
        user.aadhar_data_delete_at = None
        count += 1

    await db.commit()
    return {"message": f"Cleaned up aadhar data for {count} user(s)."}


@router.post("/{request_id}/escalate", status_code=status.HTTP_200_OK)
async def escalate_verification(
    request_id: uuid.UUID,
    escalation: EscalationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.local_admin]))
):
    """
    Escalates a regional dispute to the Community Admin.
    - Only callable by Local Admins.
    """
    stmt = select(VerificationRequest).where(VerificationRequest.id == request_id)
    result = await db.execute(stmt)
    req = result.scalars().first()

    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Verification request not found.")

    req.status = VerificationStatus.escalated
    req.escalated = True
    req.escalation_reason = escalation.reason

    await db.commit()
    return {"message": "Verification request escalated to Community Admin."}

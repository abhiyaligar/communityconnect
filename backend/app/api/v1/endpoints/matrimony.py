"""
CommunityConnect Backend — Matrimony Endpoints
===============================================

Routes (prefix: /api/v1/matrimony):
  GET    /matches                                     Browse opted-in matrimony profiles (paginated, guardian-aware)
  GET    /requests                                    List incoming & outgoing connection requests
  POST   /requests                                    Send a new connection request to a profile
  POST   /requests/{request_id}/action               Approve or reject an incoming connection request
  GET    /co-approver-invitations                    List pending guardian co-approver invitations
  POST   /co-approver-invitations/{profile_id}/action  Accept or decline a guardian invitation
  POST   /guardian-recommendations                   Guardian recommends a profile for a ward
  DELETE /guardian-recommendations                   Guardian removes a recommendation
  GET    /guardian-recommendations                   List all recommendations made by this guardian
  GET    /my-recommendations                         List all recommendations received by this ward

Access:
  All routes require Bearer JWT authentication.
  /matches requires role: verified_adult | local_admin | community_admin
"""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.api.deps import get_current_user, RoleChecker, require_active_membership
from app.models.user import User
from app.models.profile import Profile
from app.models.interaction import ProfileDislike
from app.models.matrimony import MatrimonyProfile, ConnectionRequest, GuardianRecommendation
from app.models.preference import MatrimonyPreference
from app.models.enums import UserRole, Gender, ConnectionRequestStatus
from sqlalchemy import or_, and_, select, exists
from sqlalchemy.sql import func
from app.schemas.matrimony import ConnectionRequestCreate, ConnectionAction, ConnectionRequestOut, CoApproverAction

router = APIRouter()


@router.get("/matches", status_code=status.HTTP_200_OK)
async def get_matrimony_matches(
    page: int = 1,
    limit: int = 10,
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

    # 2. Check if current user is opted in to matrimony OR is an approved guardian of someone
    is_opted_in = my_profile.matrimony_profile and my_profile.matrimony_profile.opted_in
    
    # Query confirmed wards
    wards_stmt = (
        select(MatrimonyProfile)
        .where(
            MatrimonyProfile.family_co_approver_profile_id == my_profile.id,
            MatrimonyProfile.family_co_approver_approved == True
        )
        .options(selectinload(MatrimonyProfile.profile))
    )
    wards_res = await db.execute(wards_stmt)
    approved_wards = wards_res.scalars().all()

    if not is_opted_in and not approved_wards:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="You must opt-in to Matrimony or be a confirmed family guardian to view matches. Please update your profile."
        )

    # 3. Determine target genders
    target_genders = []
    if is_opted_in:
        if my_profile.gender == Gender.male:
            target_genders.append(Gender.female)
        elif my_profile.gender == Gender.female:
            target_genders.append(Gender.male)
    else:
        # Determine target genders based on ward genders
        has_male_ward = any(w.profile.gender == Gender.male for w in approved_wards if w.profile)
        has_female_ward = any(w.profile.gender == Gender.female for w in approved_wards if w.profile)
        if has_male_ward:
            target_genders.append(Gender.female)
        if has_female_ward:
            target_genders.append(Gender.male)

    # 4. Fetch all matches (opted in, not the current user)
    # Exclude profiles already requested (as sender or receiver) and disliked profiles
    requested_exists = exists(ConnectionRequest).where(
        or_(
            and_(
                ConnectionRequest.sender_profile_id == my_profile.id,
                ConnectionRequest.receiver_profile_id == MatrimonyProfile.profile_id,
            ),
            and_(
                ConnectionRequest.receiver_profile_id == my_profile.id,
                ConnectionRequest.sender_profile_id == MatrimonyProfile.profile_id,
            ),
        )
    )

    disliked_exists = exists(ProfileDislike).where(
        and_(
            ProfileDislike.user_profile_id == my_profile.id,
            ProfileDislike.disliked_profile_id == MatrimonyProfile.profile_id,
        )
    )

    query = (
        select(MatrimonyProfile)
        .join(Profile, MatrimonyProfile.profile_id == Profile.id)
        .where(
            MatrimonyProfile.opted_in == True,
            MatrimonyProfile.profile_id != my_profile.id,
            ~requested_exists,
            ~disliked_exists,
        )
    )

    if target_genders:
        query = query.where(Profile.gender.in_(target_genders))

    query = query.order_by(func.random())

    offset_val = (page - 1) * limit
    query = query.offset(offset_val).limit(limit)

    stmt = query.options(selectinload(MatrimonyProfile.profile))
    
    result = await db.execute(stmt)
    matches = result.scalars().all()

    # 4.1. Apply preference-based strict filtering
    pref_stmt = (
        select(MatrimonyPreference)
        .where(MatrimonyPreference.profile_id == my_profile.id)
    )
    pref_res = await db.execute(pref_stmt)
    preference = pref_res.scalars().first()

    if preference:
        def matches_pref(target: MatrimonyProfile) -> bool:
            p = target.profile
            if not p:
                return False

            # Rashi
            if preference.strict_rashi and target.rashi:
                if target.rashi.lower() not in [r.lower() for r in preference.strict_rashi]:
                    return False

            # Nakshatra
            if preference.strict_nakshatra and target.nakshatra:
                if target.nakshatra.lower() not in [n.lower() for n in preference.strict_nakshatra]:
                    return False

            # Gotra
            if preference.strict_gotra and target.gotra:
                if target.gotra.lower() not in [g.lower() for g in preference.strict_gotra]:
                    return False

            # Sub caste
            if preference.strict_sub_caste and target.sub_caste:
                if target.sub_caste.lower() not in [s.lower() for s in preference.strict_sub_caste]:
                    return False

            # Diet
            if preference.strict_diet and target.diet:
                if target.diet.lower() not in [d.lower() for d in preference.strict_diet]:
                    return False

            # Education
            if preference.strict_education and target.highest_qualification:
                if target.highest_qualification.lower() not in [e.lower() for e in preference.strict_education]:
                    return False

            # Employment
            if preference.strict_employment and target.employment_type:
                if target.employment_type.lower() not in [e.lower() for e in preference.strict_employment]:
                    return False

            # Manglik
            if preference.manglik and preference.manglik != "any" and target.manglik_status:
                if target.manglik_status.lower() != preference.manglik.lower():
                    return False

            return True

        matches = [m for m in matches if matches_pref(m)]

    # 4.5. Fetch all connection requests involving current user's profile OR their wards' profiles
    ward_ids = [w.profile_id for w in approved_wards]
    search_profile_ids = [my_profile.id] + ward_ids

    stmt_reqs = select(ConnectionRequest).where(
        or_(
            ConnectionRequest.sender_profile_id.in_(search_profile_ids),
            ConnectionRequest.receiver_profile_id.in_(search_profile_ids)
        )
    )
    result_reqs = await db.execute(stmt_reqs)
    reqs = result_reqs.scalars().all()

    # 4.6. Fetch guardian recommendations if caller is a guardian
    my_recs = []
    if approved_wards:
        rec_stmt = select(GuardianRecommendation).where(
            GuardianRecommendation.guardian_profile_id == my_profile.id
        )
        rec_res = await db.execute(rec_stmt)
        my_recs = rec_res.scalars().all()

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

        # Connection status check
        req = None
        for p_id in search_profile_ids:
            req = next((r for r in reqs if (r.sender_profile_id == p_id and r.receiver_profile_id == prof.id) or (r.sender_profile_id == prof.id and r.receiver_profile_id == p_id)), None)
            if req:
                break

        connection_status = "none"
        connection_request_id = None
        is_connected = False

        if req:
            connection_status = req.status.value
            connection_request_id = str(req.id)
            is_connected = req.status == ConnectionRequestStatus.approved

        # Data masking
        contact_number = None
        address = prof.address if is_connected else "Hidden until connected"
        additional_photos = mat.additional_photos if is_connected else []

        # Guardian recommendation info
        recommended_for_ward_ids = [
            str(r.ward_profile_id) for r in my_recs if r.recommended_profile_id == prof.id
        ]
        is_recommended_by_guardian = len(recommended_for_ward_ids) > 0

        response_data.append({
            "profile_id": str(mat.profile_id),
            "is_recommended_by_guardian": is_recommended_by_guardian,
            "recommended_for_ward_ids": recommended_for_ward_ids,
            "about_me": mat.about_me,
            "hobbies": mat.hobbies,
            "languages": mat.languages,
            "connection_status": connection_status,
            "connection_request_id": connection_request_id,
            "profile": {
                "full_name": prof.full_name,
                "date_of_birth": prof.date_of_birth,
                "gender": gender,
                "marital_status": marital,
                "profile_photo_url": prof.profile_photo_url,
                "contact_number": contact_number,
                "address": address,
                "occupation": prof.occupation,
                "username": prof.username
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
                "physical_activity": physical_activity,
                "father_name": mat.father_name,
                "father_occupation": mat.father_occupation,
                "mother_name": mat.mother_name,
                "mother_occupation": mat.mother_occupation,
                "brothers_count": mat.brothers_count,
                "brothers_marital_status": mat.brothers_marital_status,
                "sisters_count": mat.sisters_count,
                "sisters_marital_status": mat.sisters_marital_status,
                "family_type": mat.family_type,
                "family_values": mat.family_values,
                "family_financial_status": mat.family_financial_status,
                "family_background": f"Father: {mat.father_name or '—'} ({mat.father_occupation or '—'}), Mother: {mat.mother_name or '—'} ({mat.mother_occupation or '—'})",
                "additional_photos": additional_photos
            }
        })

    return response_data


@router.post("/requests", status_code=status.HTTP_201_CREATED)
async def create_connection_request(
    payload: ConnectionRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: User = Depends(require_active_membership)
):
    """
    Creates a new matrimonial connection request. Requires active membership (admins bypass).
    """
    # 1. Fetch sender profile
    stmt_sender = (
        select(Profile)
        .where(Profile.user_id == current_user.id)
        .options(selectinload(Profile.matrimony_profile))
    )
    result_sender = await db.execute(stmt_sender)
    sender = result_sender.scalars().first()

    if not sender or not sender.matrimony_profile or not sender.matrimony_profile.opted_in:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must have an opted-in Matrimony profile to connect."
        )

    # 2. Fetch receiver profile
    stmt_receiver = (
        select(Profile)
        .where(Profile.id == payload.receiver_profile_id)
        .options(selectinload(Profile.matrimony_profile))
    )
    result_receiver = await db.execute(stmt_receiver)
    receiver = result_receiver.scalars().first()

    if not receiver or not receiver.matrimony_profile or not receiver.matrimony_profile.opted_in:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target Matrimony profile not found."
        )

    if sender.id == receiver.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot connect with yourself."
        )

    # 3. Check for existing request
    stmt_check = select(ConnectionRequest).where(
        or_(
            and_(ConnectionRequest.sender_profile_id == sender.id, ConnectionRequest.receiver_profile_id == receiver.id),
            and_(ConnectionRequest.sender_profile_id == receiver.id, ConnectionRequest.receiver_profile_id == sender.id)
        )
    )
    result_check = await db.execute(stmt_check)
    if result_check.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A connection request already exists between you."
        )

    # 4. Handle double approval settings from receiver
    co_approver_id = None
    if receiver.matrimony_profile.double_approval_required:
        if not receiver.matrimony_profile.family_co_approver_approved:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The recipient has not finalized their family co-approver settings."
            )
        co_approver_id = receiver.matrimony_profile.family_co_approver_profile_id

    # 5. Create ConnectionRequest
    req = ConnectionRequest(
        sender_profile_id=sender.id,
        receiver_profile_id=receiver.id,
        status=ConnectionRequestStatus.pending_self_approval,
        family_co_approver_profile_id=co_approver_id
    )
    db.add(req)
    await db.commit()

    return {"message": "Connection request sent successfully."}


@router.get("/requests", response_model=dict)
async def get_connection_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns incoming and outgoing connection requests.
    """
    stmt_me = select(Profile).where(Profile.user_id == current_user.id)
    result_me = await db.execute(stmt_me)
    profile = result_me.scalars().first()

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")

    # 1. Incoming requests: Receiver is me, or Family co-approver is me
    stmt_incoming = (
        select(ConnectionRequest)
        .where(
            or_(
                ConnectionRequest.receiver_profile_id == profile.id,
                ConnectionRequest.family_co_approver_profile_id == profile.id
            )
        )
        .options(
            selectinload(ConnectionRequest.sender),
            selectinload(ConnectionRequest.receiver),
            selectinload(ConnectionRequest.family_co_approver)
        )
    )
    result_incoming = await db.execute(stmt_incoming)
    incoming = result_incoming.scalars().all()

    # 2. Outgoing requests: Sender is me
    stmt_outgoing = (
        select(ConnectionRequest)
        .where(ConnectionRequest.sender_profile_id == profile.id)
        .options(
            selectinload(ConnectionRequest.sender),
            selectinload(ConnectionRequest.receiver),
            selectinload(ConnectionRequest.family_co_approver)
        )
    )
    result_outgoing = await db.execute(stmt_outgoing)
    outgoing = result_outgoing.scalars().all()

    # Helper to serialize request
    def serialize_req(r):
        return {
            "id": str(r.id),
            "sender_profile_id": str(r.sender_profile_id),
            "receiver_profile_id": str(r.receiver_profile_id),
            "status": r.status.value,
            "self_approved_at": r.self_approved_at.isoformat() if r.self_approved_at else None,
            "family_approved_at": r.family_approved_at.isoformat() if r.family_approved_at else None,
            "family_co_approver_profile_id": str(r.family_co_approver_profile_id) if r.family_co_approver_profile_id else None,
            "created_at": r.created_at.isoformat(),
            "updated_at": r.updated_at.isoformat(),
            "sender": {
                "id": str(r.sender.id),
                "full_name": r.sender.full_name,
                "profile_photo_url": r.sender.profile_photo_url,
                "gender": r.sender.gender.value,
                "username": r.sender.username
            } if r.sender else None,
            "receiver": {
                "id": str(r.receiver.id),
                "full_name": r.receiver.full_name,
                "profile_photo_url": r.receiver.profile_photo_url,
                "gender": r.receiver.gender.value,
                "username": r.receiver.username
            } if r.receiver else None,
            "family_co_approver": {
                "id": str(r.family_co_approver.id),
                "full_name": r.family_co_approver.full_name,
                "profile_photo_url": r.family_co_approver.profile_photo_url,
                "gender": r.family_co_approver.gender.value,
                "username": r.family_co_approver.username
            } if r.family_co_approver else None
        }

    return {
        "incoming": [serialize_req(r) for r in incoming],
        "outgoing": [serialize_req(r) for r in outgoing]
    }


@router.post("/requests/{request_id}/action")
async def action_connection_request(
    request_id: UUID,
    payload: ConnectionAction,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Handles approving or rejecting a connection request.
    Can be called by the receiver (for self-approval) or the designated co-approver.
    """
    # 1. Fetch request
    stmt = select(ConnectionRequest).where(ConnectionRequest.id == request_id)
    result = await db.execute(stmt)
    req = result.scalars().first()

    if not req:
        raise HTTPException(status_code=404, detail="Connection request not found.")

    # 2. Fetch my profile
    stmt_me = select(Profile).where(Profile.user_id == current_user.id)
    result_me = await db.execute(stmt_me)
    profile = result_me.scalars().first()

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")

    is_receiver = req.receiver_profile_id == profile.id
    is_co_approver = req.family_co_approver_profile_id == profile.id

    if not is_receiver and not is_co_approver:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to perform actions on this request."
        )

    # 3. Handle action
    action = payload.action.lower().strip()

    if action == "approve":
        if is_receiver:
            if req.status != ConnectionRequestStatus.pending_self_approval:
                raise HTTPException(status_code=400, detail="Request is not pending your approval.")
            
            # If family co-approval is required, advance to family approval step
            if req.family_co_approver_profile_id:
                req.status = ConnectionRequestStatus.pending_family_approval
            else:
                req.status = ConnectionRequestStatus.approved
            
            req.self_approved_at = func.now()
        
        elif is_co_approver:
            if req.status != ConnectionRequestStatus.pending_family_approval:
                raise HTTPException(status_code=400, detail="Request is not pending family approval.")
            
            req.status = ConnectionRequestStatus.approved
            req.family_approved_at = func.now()

    elif action == "reject":
        if is_receiver:
            if req.status != ConnectionRequestStatus.pending_self_approval:
                raise HTTPException(status_code=400, detail="Request is not pending your approval.")
            req.status = ConnectionRequestStatus.declined_by_self
        elif is_co_approver:
            if req.status != ConnectionRequestStatus.pending_family_approval:
                raise HTTPException(status_code=400, detail="Request is not pending family approval.")
            req.status = ConnectionRequestStatus.declined_by_family

    else:
        raise HTTPException(status_code=400, detail="Invalid action. Must be 'approve' or 'reject'.")

    await db.commit()
    return {"message": f"Request has been {action}d successfully.", "status": req.status.value}


@router.delete("/requests/{request_id}", status_code=status.HTTP_200_OK)
async def cancel_connection_request(
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cancels / withdraws an outgoing connection request.
    Only the original sender can cancel their own request.
    """
    stmt = select(ConnectionRequest).where(ConnectionRequest.id == request_id)
    result = await db.execute(stmt)
    req = result.scalars().first()

    if not req:
        raise HTTPException(status_code=404, detail="Connection request not found.")

    stmt_me = select(Profile).where(Profile.user_id == current_user.id)
    result_me = await db.execute(stmt_me)
    profile = result_me.scalars().first()

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")

    if req.sender_profile_id != profile.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the sender can cancel a connection request."
        )

    if req.status == ConnectionRequestStatus.approved:
        raise HTTPException(status_code=400, detail="Cannot cancel an already approved request.")

    await db.delete(req)
    await db.commit()
    return {"message": "Connection request cancelled successfully."}


@router.get("/co-approver-invitations", response_model=List[dict])
async def get_co_approver_invitations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns list of matrimony profiles that have requested this user as co-approver (pending confirmation).
    """
    profile_stmt = select(Profile).where(Profile.user_id == current_user.id)
    profile_res = await db.execute(profile_stmt)
    profile = profile_res.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")

    stmt = (
        select(MatrimonyProfile)
        .where(
            MatrimonyProfile.family_co_approver_profile_id == profile.id,
            MatrimonyProfile.family_co_approver_approved == False
        )
        .options(selectinload(MatrimonyProfile.profile))
    )
    result = await db.execute(stmt)
    invitations = result.scalars().all()

    out = []
    for inv in invitations:
        out.append({
            "profile_id": str(inv.profile_id),
            "full_name": inv.profile.full_name if inv.profile else None,
            "username": inv.profile.username if inv.profile else None,
            "profile_photo_url": inv.profile.profile_photo_url if inv.profile else None,
            "gender": inv.profile.gender.value if inv.profile else None,
        })
    return out


@router.post("/co-approver-invitations/{sender_profile_id}/action", status_code=status.HTTP_200_OK)
async def action_co_approver_invitation(
    sender_profile_id: UUID,
    payload: CoApproverAction,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Accept or decline co-approver invitations.
    """
    profile_stmt = select(Profile).where(Profile.user_id == current_user.id)
    profile_res = await db.execute(profile_stmt)
    profile = profile_res.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")

    stmt = select(MatrimonyProfile).where(
        MatrimonyProfile.profile_id == sender_profile_id,
        MatrimonyProfile.family_co_approver_profile_id == profile.id
    )
    result = await db.execute(stmt)
    mat_prof = result.scalars().first()
    if not mat_prof:
        raise HTTPException(status_code=404, detail="Co-approver invitation not found.")

    action = payload.action.lower().strip()
    if action == "accept":
        mat_prof.family_co_approver_approved = True
        message = "Co-approver invitation accepted."
    elif action == "decline":
        mat_prof.family_co_approver_profile_id = None
        mat_prof.family_co_approver_approved = False
        message = "Co-approver invitation declined."
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Must be 'accept' or 'decline'.")

    await db.commit()
    return {"message": message}


# ─────────────────────────────────────────────────
#  GUARDIAN RECOMMENDATIONS
# ─────────────────────────────────────────────────

from pydantic import BaseModel as BaseModel

class GuardianRecommendationCreate(BaseModel):
    ward_profile_id: UUID
    recommended_profile_id: UUID

class GuardianRecommendationRemove(BaseModel):
    ward_profile_id: UUID
    recommended_profile_id: UUID


@router.post("/guardian-recommendations", status_code=status.HTTP_201_CREATED)
async def add_guardian_recommendation(
    payload: GuardianRecommendationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Guardian recommends a matrimony profile for one of their wards.
    Validates that the caller is an approved co-approver for the given ward.
    """
    # 1. Fetch caller profile
    stmt_me = select(Profile).where(Profile.user_id == current_user.id)
    result_me = await db.execute(stmt_me)
    my_profile = result_me.scalars().first()
    if not my_profile:
        raise HTTPException(status_code=404, detail="Profile not found.")

    # 2. Confirm caller is approved guardian for this ward
    ward_mat_stmt = select(MatrimonyProfile).where(
        MatrimonyProfile.profile_id == payload.ward_profile_id,
        MatrimonyProfile.family_co_approver_profile_id == my_profile.id,
        MatrimonyProfile.family_co_approver_approved == True
    )
    ward_mat_res = await db.execute(ward_mat_stmt)
    ward_mat = ward_mat_res.scalars().first()
    if not ward_mat:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not an approved guardian for this ward."
        )

    # 3. Prevent self-recommendation
    if payload.recommended_profile_id == payload.ward_profile_id:
        raise HTTPException(status_code=400, detail="Cannot recommend the ward for themselves.")

    # 4. Check duplicate
    dup_stmt = select(GuardianRecommendation).where(
        GuardianRecommendation.guardian_profile_id == my_profile.id,
        GuardianRecommendation.ward_profile_id == payload.ward_profile_id,
        GuardianRecommendation.recommended_profile_id == payload.recommended_profile_id
    )
    dup_res = await db.execute(dup_stmt)
    if dup_res.scalars().first():
        raise HTTPException(status_code=400, detail="You have already recommended this profile for this ward.")

    # 5. Create recommendation
    rec = GuardianRecommendation(
        guardian_profile_id=my_profile.id,
        ward_profile_id=payload.ward_profile_id,
        recommended_profile_id=payload.recommended_profile_id
    )
    db.add(rec)
    await db.commit()
    return {"message": "Profile recommended successfully."}


@router.delete("/guardian-recommendations", status_code=status.HTTP_200_OK)
async def remove_guardian_recommendation(
    payload: GuardianRecommendationRemove,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Guardian removes a previously made recommendation.
    """
    stmt_me = select(Profile).where(Profile.user_id == current_user.id)
    result_me = await db.execute(stmt_me)
    my_profile = result_me.scalars().first()
    if not my_profile:
        raise HTTPException(status_code=404, detail="Profile not found.")

    stmt = select(GuardianRecommendation).where(
        GuardianRecommendation.guardian_profile_id == my_profile.id,
        GuardianRecommendation.ward_profile_id == payload.ward_profile_id,
        GuardianRecommendation.recommended_profile_id == payload.recommended_profile_id
    )
    result = await db.execute(stmt)
    rec = result.scalars().first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found.")

    await db.delete(rec)
    await db.commit()
    return {"message": "Recommendation removed."}


@router.get("/guardian-recommendations", status_code=status.HTTP_200_OK)
async def get_my_guardian_recommendations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns all recommendations this user (as guardian) has made for their wards.
    Grouped with full candidate profile details.
    """
    stmt_me = select(Profile).where(Profile.user_id == current_user.id)
    result_me = await db.execute(stmt_me)
    my_profile = result_me.scalars().first()
    if not my_profile:
        raise HTTPException(status_code=404, detail="Profile not found.")

    stmt = (
        select(GuardianRecommendation)
        .where(GuardianRecommendation.guardian_profile_id == my_profile.id)
        .options(
            selectinload(GuardianRecommendation.ward),
            selectinload(GuardianRecommendation.candidate)
        )
        .order_by(GuardianRecommendation.created_at.desc())
    )
    result = await db.execute(stmt)
    recs = result.scalars().all()

    out = []
    for r in recs:
        out.append({
            "id": str(r.id),
            "ward_profile_id": str(r.ward_profile_id),
            "ward_name": r.ward.full_name if r.ward else None,
            "ward_photo": r.ward.profile_photo_url if r.ward else None,
            "recommended_profile_id": str(r.recommended_profile_id),
            "candidate": {
                "full_name": r.candidate.full_name if r.candidate else None,
                "username": r.candidate.username if r.candidate else None,
                "profile_photo_url": r.candidate.profile_photo_url if r.candidate else None,
                "gender": r.candidate.gender.value if r.candidate else None,
                "occupation": r.candidate.occupation if r.candidate else None,
            } if r.candidate else None,
            "created_at": r.created_at.isoformat()
        })
    return out


@router.get("/my-recommendations", status_code=status.HTTP_200_OK)
async def get_recommendations_for_me(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns all profiles recommended for this user (as ward) by their guardian.
    Includes full matrimony profile details + connection status.
    """
    stmt_me = (
        select(Profile)
        .where(Profile.user_id == current_user.id)
        .options(selectinload(Profile.matrimony_profile))
    )
    result_me = await db.execute(stmt_me)
    my_profile = result_me.scalars().first()
    if not my_profile:
        raise HTTPException(status_code=404, detail="Profile not found.")

    # Fetch all recommendations for me
    stmt = (
        select(GuardianRecommendation)
        .where(GuardianRecommendation.ward_profile_id == my_profile.id)
        .options(
            selectinload(GuardianRecommendation.guardian),
            selectinload(GuardianRecommendation.candidate).selectinload(Profile.matrimony_profile)
        )
        .order_by(GuardianRecommendation.created_at.desc())
    )
    result = await db.execute(stmt)
    recs = result.scalars().all()

    # Fetch my existing connection requests to compute connection_status
    req_stmt = select(ConnectionRequest).where(
        or_(
            ConnectionRequest.sender_profile_id == my_profile.id,
            ConnectionRequest.receiver_profile_id == my_profile.id
        )
    )
    req_res = await db.execute(req_stmt)
    my_reqs = req_res.scalars().all()

    out = []
    for r in recs:
        cand = r.candidate
        if not cand:
            continue

        # Compute connection status
        req = next(
            (rq for rq in my_reqs if rq.sender_profile_id == cand.id or rq.receiver_profile_id == cand.id),
            None
        )
        connection_status = req.status.value if req else "none"
        connection_request_id = str(req.id) if req else None

        mat = cand.matrimony_profile
        entry = {
            "recommendation_id": str(r.id),
            "recommended_by": {
                "guardian_name": r.guardian.full_name if r.guardian else None,
                "guardian_photo": r.guardian.profile_photo_url if r.guardian else None,
            },
            "profile_id": str(cand.id),
            "connection_status": connection_status,
            "connection_request_id": connection_request_id,
            "profile": {
                "full_name": cand.full_name,
                "date_of_birth": cand.date_of_birth.isoformat() if cand.date_of_birth else None,
                "gender": cand.gender.value if cand.gender else None,
                "marital_status": cand.marital_status.value if cand.marital_status else None,
                "profile_photo_url": cand.profile_photo_url,
                "occupation": cand.occupation,
                "username": cand.username,
            },
            "matrimony_details": {
                "height_cm": mat.height_cm,
                "body_type": mat.body_type,
                "complexion": mat.complexion,
                "highest_qualification": mat.highest_qualification,
                "employment_type": mat.employment_type,
                "income_range": mat.income_range,
                "gotra": mat.gotra,
                "rashi": mat.rashi,
                "nakshatra": mat.nakshatra,
                "manglik_status": mat.manglik_status,
                "about_me": mat.about_me,
            } if mat else None,
        }
        out.append(entry)

    return out


@router.post("/dislike", status_code=status.HTTP_201_CREATED)
async def dislike_profile(
    target_profile_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.verified_adult])),
):
    result = await db.execute(
        select(Profile).where(Profile.user_id == current_user.id)
    )
    my_profile = result.scalars().first()
    if not my_profile:
        raise HTTPException(status_code=404, detail="Profile not found.")

    existing = await db.execute(
        select(ProfileDislike).where(
            ProfileDislike.user_profile_id == my_profile.id,
            ProfileDislike.disliked_profile_id == target_profile_id,
        )
    )
    if existing.scalars().first():
        return {"message": "Already disliked."}

    dislike = ProfileDislike(
        user_profile_id=my_profile.id,
        disliked_profile_id=target_profile_id,
    )
    db.add(dislike)
    await db.commit()
    return {"message": "Profile disliked."}

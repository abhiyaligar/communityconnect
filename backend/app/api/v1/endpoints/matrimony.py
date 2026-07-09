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
from app.api.deps import get_current_user, RoleChecker
from app.models.user import User
from app.models.profile import Profile
from app.models.matrimony import MatrimonyProfile, ConnectionRequest
from app.models.enums import UserRole, Gender, ConnectionRequestStatus
from sqlalchemy import or_, and_, select
from sqlalchemy.sql import func
from app.schemas.matrimony import ConnectionRequestCreate, ConnectionAction, ConnectionRequestOut, CoApproverAction

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
    query = (
        select(MatrimonyProfile)
        .join(Profile, MatrimonyProfile.profile_id == Profile.id)
        .where(
            MatrimonyProfile.opted_in == True,
            MatrimonyProfile.profile_id != my_profile.id
        )
    )

    if target_genders:
        query = query.where(Profile.gender.in_(target_genders))

    stmt = query.options(selectinload(MatrimonyProfile.profile))
    
    result = await db.execute(stmt)
    matches = result.scalars().all()

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
        contact_number = prof.contact_number if is_connected else None
        address = prof.address if is_connected else "Hidden until connected"
        additional_photos = mat.additional_photos if is_connected else []

        response_data.append({
            "profile_id": str(mat.profile_id),
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
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new matrimonial connection request.
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

"""
CommunityConnect Backend - Chat Endpoints
"""

import re
import html
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import or_, and_, func

from app.db.session import get_db
from app.api.deps import get_current_user, RoleChecker
from app.core.limiter import limiter
from app.models.user import User
from app.models.profile import Profile
from app.models.matrimony import ConnectionRequest
from app.models.enums import ConnectionRequestStatus, UserRole
from app.models.chat import ChatMessage
from app.schemas.chat import ChatMessageCreate, ChatMessageOut, ChatSessionOut

router = APIRouter()


def sanitize_message(text: str) -> str:
    """
    Screens and redacts phone numbers, ZIP/PIN codes, and address keywords from message content.
    """
    if not text:
        return text

    # 1. Regex to match phone numbers (e.g. 8 to 15 digits, optionally separated by spaces, dashes, dots, or parentheses)
    # Matches digit sequences with separators that have between 8 and 15 digits in total.
    phone_pattern = re.compile(
        r'\+?\d[\d\s\-\(\)]{7,15}\d'
    )
    text = phone_pattern.sub("[REDACTED PHONE]", text)
    
    # 2. Regex to match Indian PIN codes (6-digit starting with 1-9) and US Zip codes (5-digit)
    pin_pattern = re.compile(r'\b[1-9]\d{2}\s?\d{3}\b')
    text = pin_pattern.sub("[REDACTED PIN]", text)

    # 3. Common address keywords and street numbers
    address_keywords = [
        r"street", r"road", r"lane", r"sector", r"apartment", r"apt", 
        r"building", r"house no", r"h\.no", r"flat no",
        r"nagar", r"colony", r"bazar", r"pincode", r"pin code"
    ]
    # For each keyword, match the keyword itself and any following numbers, hash signs, or single character/word identifiers (like 'Building A', 'Flat 4B')
    for keyword in address_keywords:
        pattern = re.compile(rf'\b{keyword}\b(?:\s*(?:no\.?|number)?\s*#?\s*\d*\w*)?', re.IGNORECASE)
        text = pattern.sub("[REDACTED ADDRESS]", text)

    # 4. Escape HTML to prevent XSS
    text = html.escape(text)
        
    return text


async def check_connection(
    profile_a_id: UUID,
    profile_b_id: UUID,
    db: AsyncSession
) -> bool:
    """
    Verifies if there is an approved matrimonial connection between two profiles.
    """
    stmt = select(ConnectionRequest).where(
        and_(
            or_(
                and_(ConnectionRequest.sender_profile_id == profile_a_id, ConnectionRequest.receiver_profile_id == profile_b_id),
                and_(ConnectionRequest.sender_profile_id == profile_b_id, ConnectionRequest.receiver_profile_id == profile_a_id)
            ),
            ConnectionRequest.status == ConnectionRequestStatus.approved
        )
    )
    result = await db.execute(stmt)
    return result.scalars().first() is not None


@router.get("/sessions", response_model=List[ChatSessionOut])
async def get_chat_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.verified_adult, UserRole.local_admin, UserRole.community_admin]))
):
    """
    Returns list of connected profiles (approved connections only) with their last message and unread count.
    """
    # 1. Fetch current user's profile
    stmt_me = select(Profile).where(Profile.user_id == current_user.id)
    result_me = await db.execute(stmt_me)
    my_profile = result_me.scalars().first()
    if not my_profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")

    # 2. Fetch all approved connection requests involving current user's profile
    stmt_connections = select(ConnectionRequest).where(
        and_(
            or_(
                ConnectionRequest.sender_profile_id == my_profile.id,
                ConnectionRequest.receiver_profile_id == my_profile.id
            ),
            ConnectionRequest.status == ConnectionRequestStatus.approved
        )
    ).options(
        selectinload(ConnectionRequest.sender),
        selectinload(ConnectionRequest.receiver)
    )
    result_connections = await db.execute(stmt_connections)
    connections = result_connections.scalars().all()

    sessions = []
    for conn in connections:
        other_profile = conn.receiver if conn.sender_profile_id == my_profile.id else conn.sender
        if not other_profile:
            continue
        
        # Fetch last message
        stmt_last_msg = select(ChatMessage).where(
            or_(
                and_(ChatMessage.sender_profile_id == my_profile.id, ChatMessage.receiver_profile_id == other_profile.id),
                and_(ChatMessage.sender_profile_id == other_profile.id, ChatMessage.receiver_profile_id == my_profile.id)
            )
        ).order_by(ChatMessage.created_at.desc()).limit(1)
        result_last_msg = await db.execute(stmt_last_msg)
        last_msg = result_last_msg.scalars().first()

        # Fetch unread count (messages sent by other_profile to my_profile)
        stmt_unread_count = select(func.count(ChatMessage.id)).where(
            and_(
                ChatMessage.sender_profile_id == other_profile.id,
                ChatMessage.receiver_profile_id == my_profile.id,
                ChatMessage.is_read == False
            )
        )
        result_unread_count = await db.execute(stmt_unread_count)
        unread_count = result_unread_count.scalar() or 0

        sessions.append({
            "profile": {
                "id": other_profile.id,
                "full_name": other_profile.full_name,
                "profile_photo_url": other_profile.profile_photo_url,
                "gender": other_profile.gender.value if other_profile.gender else None,
                "username": other_profile.username
            },
            "last_message": last_msg,
            "unread_count": unread_count
        })

    # Sort sessions: chats with last messages first (most recent first), then alphabetical by full name
    sessions.sort(key=lambda s: (s["last_message"].created_at if s["last_message"] else datetime.min.replace(tzinfo=timezone.utc), s["profile"]["full_name"]), reverse=True)
    return sessions


@router.get("/{profile_id}/messages", response_model=List[ChatMessageOut])
async def get_chat_messages(
    profile_id: UUID,
    limit: int = Query(50, ge=1, le=200, description="Max messages to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.verified_adult, UserRole.local_admin, UserRole.community_admin]))
):
    """
    Returns paginated messages with the given profile, sorted by created_at. Marks all incoming messages from this profile as read.
    """
    # 1. Fetch current user profile
    stmt_me = select(Profile).where(Profile.user_id == current_user.id)
    result_me = await db.execute(stmt_me)
    my_profile = result_me.scalars().first()
    if not my_profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")

    # 2. Verify connection
    is_connected = await check_connection(my_profile.id, profile_id, db)
    if not is_connected:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="You can only chat with approved matrimonial connections."
        )

    # 3. Mark incoming messages as read
    stmt_mark_read = select(ChatMessage).where(
        and_(
            ChatMessage.sender_profile_id == profile_id,
            ChatMessage.receiver_profile_id == my_profile.id,
            ChatMessage.is_read == False
        )
    )
    result_unread = await db.execute(stmt_mark_read)
    unread_messages = result_unread.scalars().all()
    for msg in unread_messages:
        msg.is_read = True
    if unread_messages:
        await db.commit()

    # 4. Fetch paginated messages
    stmt_messages = select(ChatMessage).where(
        or_(
            and_(ChatMessage.sender_profile_id == my_profile.id, ChatMessage.receiver_profile_id == profile_id),
            and_(ChatMessage.sender_profile_id == profile_id, ChatMessage.receiver_profile_id == my_profile.id)
        )
    ).order_by(ChatMessage.created_at.desc()).offset(offset).limit(limit)
    result_messages = await db.execute(stmt_messages)
    messages = list(reversed(result_messages.scalars().all()))

    return messages


@router.post("/messages", response_model=ChatMessageOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def send_chat_message(
    request: Request,
    payload: ChatMessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.verified_adult, UserRole.local_admin, UserRole.community_admin]))
):
    """
    Creates and sends a new message. Validate connection approval first. Sanitize/redact contact numbers and addresses.
    """
    # 1. Fetch current user profile
    stmt_me = select(Profile).where(Profile.user_id == current_user.id)
    result_me = await db.execute(stmt_me)
    my_profile = result_me.scalars().first()
    if not my_profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")

    # 2. Verify connection
    is_connected = await check_connection(my_profile.id, payload.receiver_profile_id, db)
    if not is_connected:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="You can only send messages to approved matrimonial connections."
        )

    # 3. Sanitize content
    sanitized_content = sanitize_message(payload.content)

    # 4. Create message
    msg = ChatMessage(
        sender_profile_id=my_profile.id,
        receiver_profile_id=payload.receiver_profile_id,
        content=sanitized_content,
        is_read=False
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)

    return msg


@router.post("/{profile_id}/read")
async def mark_messages_read(
    profile_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.verified_adult, UserRole.local_admin, UserRole.community_admin]))
):
    """
    Explicitly marks all incoming messages from profile_id as read.
    """
    # Fetch my profile
    stmt_me = select(Profile).where(Profile.user_id == current_user.id)
    result_me = await db.execute(stmt_me)
    my_profile = result_me.scalars().first()
    if not my_profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")

    # Mark all incoming as read
    stmt_mark_read = select(ChatMessage).where(
        and_(
            ChatMessage.sender_profile_id == profile_id,
            ChatMessage.receiver_profile_id == my_profile.id,
            ChatMessage.is_read == False
        )
    )
    result_unread = await db.execute(stmt_mark_read)
    unread_messages = result_unread.scalars().all()
    for msg in unread_messages:
        msg.is_read = True
    
    if unread_messages:
        await db.commit()

    return {"message": "Messages marked as read."}

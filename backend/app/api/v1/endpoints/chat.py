"""
CommunityConnect Backend - Chat Endpoints
"""

import re
from typing import List
from uuid import UUID
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import or_, and_, func

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.profile import Profile
from app.models.matrimony import ConnectionRequest
from app.models.enums import ConnectionRequestStatus
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
        r'\+?\(?\d\)?(?:\s*[-.\(\)]?\s*\d){7,14}\b'
    )
    text = phone_pattern.sub("[REDACTED PHONE]", text)
    
    # 2. Regex to match potential 6-digit Indian PIN codes or 5-digit US Zip codes
    pin_pattern = re.compile(r'\b\d{5,6}\b')
    text = pin_pattern.sub("[REDACTED PIN]", text)

    # 3. Common address keywords and street numbers
    address_keywords = [
        r"street", r"road", r"lane", r"sector", r"apartment", r"apt", 
        r"building", r"house no", r"h\.no", r"flat no", r"cross", 
        r"nagar", r"colony", r"bazar", r"pincode", r"pin code"
    ]
    # For each keyword, match the keyword itself and any following numbers, hash signs, or single character/word identifiers (like 'Building A', 'Flat 4B')
    for keyword in address_keywords:
        pattern = re.compile(rf'\b{keyword}\b(?:\s*(?:no\.?|number)?\s*#?\s*\d*\w*)?', re.IGNORECASE)
        text = pattern.sub("[REDACTED ADDRESS]", text)
        
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
    current_user: User = Depends(get_current_user)
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
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns all messages with the given profile, sorted by created_at. Marks all incoming messages from this profile as read.
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

    # 4. Fetch all messages
    stmt_messages = select(ChatMessage).where(
        or_(
            and_(ChatMessage.sender_profile_id == my_profile.id, ChatMessage.receiver_profile_id == profile_id),
            and_(ChatMessage.sender_profile_id == profile_id, ChatMessage.receiver_profile_id == my_profile.id)
        )
    ).order_by(ChatMessage.created_at.asc())
    result_messages = await db.execute(stmt_messages)
    messages = result_messages.scalars().all()

    return messages


@router.post("/messages", response_model=ChatMessageOut, status_code=status.HTTP_201_CREATED)
async def send_chat_message(
    payload: ChatMessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
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
    current_user: User = Depends(get_current_user)
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

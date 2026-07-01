"""
CommunityConnect Backend - Authentication Endpoints
"""

from datetime import timedelta, date
from typing import Dict, Any
import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import settings
from app.core.security import create_jwt_token, decode_jwt_token
from app.db.session import get_db
from app.models.user import User
from app.models.profile import Profile
from app.schemas.auth import OTPRequest, OTPVerify, TokenResponse, UserRegister
from app.services.otp import generate_otp, verify_otp, check_otp_rate_limit, send_otp_sms
from app.models.enums import Gender, UserRole, MaritalStatus, VerificationStatus
from app.models.verification import VerificationRequest

router = APIRouter()


@router.post("/otp/send", status_code=status.HTTP_200_OK)
async def send_otp(request: OTPRequest):
    """
    Sends a 6-digit OTP to the requested phone number.
    Applies a rate limit of 3 requests per 15 minutes.
    """
    phone = request.phone_number

    # 1. Enforce rate limiting
    if check_otp_rate_limit(phone):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many OTP requests. Please wait 15 minutes."
        )

    # 2. Generate OTP and store hashed representation
    otp = generate_otp(phone)

    # 3. Dispatch SMS OTP
    sms_sent = await send_otp_sms(phone, otp)
    if not sms_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send SMS OTP. Please try again."
        )

    return {"message": "Verification code sent successfully."}


@router.post("/otp/verify", response_model=TokenResponse)
async def verify_code(request: OTPVerify, response: Response, db: AsyncSession = Depends(get_db)):
    """
    Verifies the supplied OTP.
    - If new number: Returns temp token to allow registration.
    - If existing number: Returns JWT access token & sets HttpOnly refresh cookie.
    """
    phone = request.phone_number
    code = request.code

    # 1. Verify OTP code
    if not verify_otp(phone, code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code."
        )

    # 2. Check database for existing user
    stmt = select(User).where(User.phone_number == phone)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not registered. Please sign up first."
        )

    # User exists — generate authentication tokens
    access_token = create_jwt_token(
        {"sub": str(user.id), "role": user.role.value}
    )
    refresh_token = create_jwt_token(
        {"sub": str(user.id), "type": "refresh"},
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )

    # Set secure HttpOnly cookie for Refresh Token
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
        samesite="lax",
        secure=True if settings.ENVIRONMENT == "production" else False
    )

    return TokenResponse(
        access_token=access_token,
        registered=True,
        role=user.role.value,
        user_id=str(user.id)
    )


@router.post("/token/refresh", response_model=TokenResponse)
async def refresh_tokens(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    """
    Refreshes the access token using the HttpOnly refresh token cookie.
    """
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is missing."
        )

    payload = decode_jwt_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token."
        )

    user_id = payload.get("sub")
    stmt = select(User).where(User.id == uuid.UUID(user_id))
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive or not found."
        )

    # Generate new tokens
    access_token = create_jwt_token(
        {"sub": str(user.id), "role": user.role.value}
    )
    new_refresh_token = create_jwt_token(
        {"sub": str(user.id), "type": "refresh"},
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )

    # Update secure HttpOnly refresh cookie
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
        samesite="lax",
        secure=True if settings.ENVIRONMENT == "production" else False
    )

    return TokenResponse(
        access_token=access_token,
        registered=True,
        role=user.role.value,
        user_id=str(user.id)
    )


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(response: Response):
    """
    Clears the HttpOnly refresh token cookie on the client.
    """
    response.delete_cookie(key="refresh_token")
    return {"detail": "Logged out successfully."}


@router.post("/register", response_model=TokenResponse)
async def register_member(request: UserRegister, response: Response, db: AsyncSession = Depends(get_db)):
    """
    Registers a new member:
    - Verifies the OTP code.
    - Creates the User and Profile records.
    - Logs them in and returns JWT access tokens.
    """
    phone = request.phone_number
    code = request.code

    # 1. Verify OTP code
    if not verify_otp(phone, code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code."
        )

    # 2. Check if user already exists
    stmt = select(User).where(User.phone_number == phone)
    result = await db.execute(stmt)
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number is already registered. Please sign in."
        )

    # 3. Resolve Enum values from input strings safely
    try:
        gender_enum = Gender(request.gender.lower())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid gender value. Allowed: {', '.join([e.value for e in Gender])}"
        )

    try:
        marital_enum = MaritalStatus(request.marital_status.lower())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid marital status. Allowed: {', '.join([e.value for e in MaritalStatus])}"
        )

    # 4. Create User (Unverified state)
    user = User(
        phone_number=phone,
        role=UserRole.unverified,
        is_active=True
    )
    db.add(user)
    await db.flush() # Populate user.id

    # 5. Create Profile
    profile = Profile(
        user_id=user.id,
        full_name=request.full_name,
        date_of_birth=request.date_of_birth,
        gender=gender_enum,
        marital_status=marital_enum,
        profile_photo_url=request.profile_photo_url,
        contact_number=phone,
        address=request.address,
        is_memorial=False
    )
    db.add(profile)
    await db.flush() # Populate profile.id

    # 6. Create Verification Request
    verification_req = VerificationRequest(
        target_user_id=user.id,
        status=VerificationStatus.pending,
        escalated=False
    )
    db.add(verification_req)
    await db.commit()

    # 6. Generate authentication tokens
    access_token = create_jwt_token(
        {"sub": str(user.id), "role": user.role.value}
    )
    refresh_token = create_jwt_token(
        {"sub": str(user.id), "type": "refresh"},
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )

    # Set secure HttpOnly cookie for Refresh Token
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
        samesite="lax",
        secure=True if settings.ENVIRONMENT == "production" else False
    )

    return TokenResponse(
        access_token=access_token,
        registered=True,
        role=user.role.value,
        user_id=str(user.id)
      )

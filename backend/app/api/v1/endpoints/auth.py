"""
CommunityConnect Backend - Authentication Endpoints
"""

from datetime import timedelta, datetime, timezone
import uuid
import secrets

from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import settings
from app.core.security import create_jwt_token, decode_jwt_token, verify_password, hash_password
from app.db.session import get_db
from app.models.user import User
from app.models.email_verification import EmailVerification
from app.schemas.auth import TokenResponse, UserLogin
from app.schemas.user import UserCreate
from pydantic import BaseModel, EmailStr
from app.utils.email import send_verification_email

router = APIRouter()


class EmailOTPRequest(BaseModel):
    email: EmailStr
    password: str

class EmailOTPVerify(BaseModel):
    email: EmailStr
    code: str
    password: str


@router.post("/register/email", status_code=status.HTTP_200_OK)
async def register_email(request: EmailOTPRequest, db: AsyncSession = Depends(get_db)):
    """
    Step 1: User provides email and password.
    We check if the email is already verified/registered.
    If not, we send a 6-digit OTP to the email.
    """
    email = request.email.lower()
    
    # 1. Check if user already exists
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    existing_user = result.scalars().first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered. Please log in."
        )

    # 2. Generate 6-digit OTP
    code = "".join(str(secrets.randbelow(10)) for _ in range(6))
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    # 3. Store OTP in database (upsert for simplicity)
    stmt = select(EmailVerification).where(EmailVerification.email == email)
    result = await db.execute(stmt)
    existing_verification = result.scalars().first()

    if existing_verification:
        existing_verification.code = code
        existing_verification.expires_at = expires_at
    else:
        new_verification = EmailVerification(
            email=email,
            code=code,
            expires_at=expires_at
        )
        db.add(new_verification)
        
    await db.commit()

    # 4. Send email (simulated if no SMTP credentials)
    await send_verification_email(email, code)

    return {"message": "Verification code sent successfully to your email."}


@router.post("/register/verify-email", response_model=TokenResponse)
async def verify_email_code(request: EmailOTPVerify, response: Response, db: AsyncSession = Depends(get_db)):
    """
    Step 2: User provides the OTP code sent to their email.
    If valid, we generate a temporary "unverified" User account and return access tokens.
    """
    email = request.email.lower()
    
    # 1. Verify OTP
    stmt = select(EmailVerification).where(EmailVerification.email == email)
    result = await db.execute(stmt)
    verification = result.scalars().first()

    if not verification or verification.code != request.code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code."
        )
        
    if verification.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired."
        )
        
    # 2. Check if User exists just in case
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    user = result.scalars().first()
    
    if not user:
        # Create unverified user
        from app.models.enums import UserRole
        user = User(
            email=email,
            password_hash=hash_password(request.password),
            role=UserRole.unverified,
            is_active=True
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
    # 3. Clean up OTP
    await db.delete(verification)
    await db.commit()

    # 4. Generate Tokens
    access_token = create_jwt_token(
        {"sub": str(user.id), "role": user.role.value}
    )
    refresh_token = create_jwt_token(
        {"sub": str(user.id), "type": "refresh"},
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )

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

@router.post("/login", response_model=TokenResponse)
async def login(request: UserLogin, response: Response, db: AsyncSession = Depends(get_db)):
    """
    Login with Email and Password.
    """
    email = request.email.lower()
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive."
        )

    # Generate new tokens
    access_token = create_jwt_token(
        {"sub": str(user.id), "role": user.role.value}
    )
    refresh_token = create_jwt_token(
        {"sub": str(user.id), "type": "refresh"},
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )

    # Update secure HttpOnly refresh cookie
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

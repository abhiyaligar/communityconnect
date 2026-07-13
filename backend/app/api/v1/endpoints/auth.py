"""
CommunityConnect Backend - Authentication Endpoints
"""

import hashlib
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
from app.models.profile import Profile
import httpx
from app.schemas.auth import TokenResponse, UserLogin, ForgotPasswordRequest, ResetPasswordRequest
from app.schemas.user import UserCreate
from pydantic import BaseModel, EmailStr
from app.utils.email import send_verification_email, send_reset_password_email, send_account_activation_email

from app.core.limiter import limiter

router = APIRouter()


def _hash_otp(code: str) -> str:
    return hashlib.sha256((code + settings.SECRET_KEY).encode("utf-8")).hexdigest()


class EmailOTPRequest(BaseModel):
    email: EmailStr
    password: str

class EmailOTPVerify(BaseModel):
    email: EmailStr
    code: str
    password: str


@router.post("/register/email", status_code=status.HTTP_200_OK)
@limiter.limit("5/minute")
async def register_email(payload: EmailOTPRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """
    Step 1: User provides email and password.
    We check if the email is already verified/registered.
    If not, we send a 6-digit OTP to the email.
    """
    email = payload.email.lower()
    
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
        # Check if 60 seconds have passed since the last OTP request
        now = datetime.now(timezone.utc)
        created_at = existing_verification.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        else:
            created_at = created_at.astimezone(timezone.utc)

        time_passed = now - created_at
        if time_passed.total_seconds() < 60:
            remaining = 60 - int(time_passed.total_seconds())
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {remaining} seconds before requesting a new OTP."
            )

        existing_verification.code = _hash_otp(code)
        existing_verification.expires_at = expires_at
        existing_verification.created_at = now
    else:
        new_verification = EmailVerification(
            email=email,
            code=_hash_otp(code),
            expires_at=expires_at
        )
        db.add(new_verification)
        
    await db.commit()


    # 4. Send email (simulated if no SMTP credentials)
    await send_verification_email(email, code)

    return {"message": "Verification code sent successfully to your email."}


@router.post("/register/verify-email", response_model=TokenResponse)
@limiter.limit("5/minute")
async def verify_email_code(payload: EmailOTPVerify, request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    """
    Step 2: User provides the OTP code sent to their email.
    If valid, we generate a temporary "unverified" User account and return access tokens.
    """
    email = payload.email.lower()
    
    # 1. Verify OTP
    stmt = select(EmailVerification).where(EmailVerification.email == email)
    result = await db.execute(stmt)
    verification = result.scalars().first()

    if not verification or verification.code != _hash_otp(payload.code):
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
    
    if user:
        await db.delete(verification)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered. Please log in."
        )
        
    # Create unverified user
    from app.models.enums import UserRole
    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        role=UserRole.unverified,
        is_active=True
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    # Auto-create free 1-month membership (skip community_admin)
    if user.role != UserRole.community_admin:
        from app.services.settings import get_setting
        setting_val = await get_setting(db, "auto_create_free_membership", "true")
        if setting_val.lower() == "true":
            from datetime import date, timedelta
            from app.models.membership import Membership, MembershipStatus
            membership = Membership(
                user_id=user.id,
                username=user.email.split("@")[0],
                start_date=date.today(),
                end_date=date.today() + timedelta(days=30),
                status=MembershipStatus.active,
            )
            db.add(membership)

    # 3. Clean up OTP
    await db.delete(verification)
    await db.commit()

    # 4. Send account activation email
    name = email.split("@")[0].replace(".", " ").title()
    await send_account_activation_email(email, name)

    # 5. Generate Tokens
    access_token = create_jwt_token(
        {"sub": str(user.id), "role": user.role.value, "type": "access"}
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
@limiter.limit("10/minute")
async def login(payload: UserLogin, request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    """
    Login with Email and Password.
    """
    email = payload.email.lower()
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user or not verify_password(payload.password, user.password_hash):
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
        {"sub": str(user.id), "role": user.role.value, "type": "access"}
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
        {"sub": str(user.id), "role": user.role.value, "type": "access"}
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


class GoogleCallbackRequest(BaseModel):
    code: str


@router.get("/google/url")
async def get_google_auth_url():
    """
    Returns the Google OAuth authorization URL.
    """
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_REDIRECT_URI:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth is not configured on the server."
        )
    
    url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?response_type=code"
        f"&client_id={settings.GOOGLE_CLIENT_ID}"
        f"&redirect_uri={settings.GOOGLE_REDIRECT_URI}"
        f"&scope=openid%20email%20profile"
        f"&access_type=offline"
        f"&prompt=select_account"
    )
    return {"url": url}


@router.post("/google/callback", response_model=TokenResponse)
async def google_callback(
    request: GoogleCallbackRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    Handles the Google OAuth authorization code exchange, logs in existing users,
    or registers new users automatically.
    """
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET or not settings.GOOGLE_REDIRECT_URI:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth is not configured on the server."
        )

    # 1. Exchange authorization code for tokens
    async with httpx.AsyncClient() as client:
        token_url = "https://oauth2.googleapis.com/token"
        data = {
            "code": request.code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code"
        }
        try:
            token_res = await client.post(token_url, data=data)
            token_res.raise_for_status()
        except httpx.HTTPStatusError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to authenticate with Google. Please try again."
            )
        
        token_data = token_res.json()
        google_access_token = token_data.get("access_token")
        if not google_access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google access token not found in response."
            )
        
        # 2. Fetch user profile information from Google
        userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
        headers = {"Authorization": f"Bearer {google_access_token}"}
        try:
            userinfo_res = await client.get(userinfo_url, headers=headers)
            userinfo_res.raise_for_status()
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to retrieve user information from Google."
            )
        user_info = userinfo_res.json()
        
    email = user_info.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email not provided by Google account."
        )
    email = email.lower()

    # 3. Authenticate or register the user
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    user = result.scalars().first()
    
    if not user:
        # Create a new user with verified email role and random secure password hash
        random_password = secrets.token_urlsafe(32)
        from app.models.enums import UserRole
        user = User(
            email=email,
            password_hash=hash_password(random_password),
            role=UserRole.unverified,
            is_active=True
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)

        # Auto-create free 1-month membership (skip community_admin)
        if user.role != UserRole.community_admin:
            from app.services.settings import get_setting
            setting_val = await get_setting(db, "auto_create_free_membership", "true")
            if setting_val.lower() == "true":
                from datetime import date, timedelta
                from app.models.membership import Membership, MembershipStatus
                membership = Membership(
                    user_id=user.id,
                    username=user.email.split("@")[0],
                    start_date=date.today(),
                    end_date=date.today() + timedelta(days=30),
                    status=MembershipStatus.active,
                )
                db.add(membership)
                await db.commit()
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive."
        )

    # Check if this user already completed profile onboarding
    stmt_p = select(Profile).where(Profile.user_id == user.id)
    res_p = await db.execute(stmt_p)
    has_profile = res_p.scalars().first() is not None

    # 4. Generate system access and refresh tokens
    access_token = create_jwt_token(
        {"sub": str(user.id), "role": user.role.value, "type": "access"}
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
        registered=has_profile,
        role=user.role.value,
        user_id=str(user.id)
    )


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(
    request: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Step 1 of password reset: validates email and sends a 6-digit OTP code to email.
    """
    email = request.email.lower()
    
    # 1. Verify user exists — always return 200 to prevent account enumeration
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    user = result.scalars().first()
    
    if not user or not user.is_active:
        return {"message": "If an account exists with this email, a password reset code has been sent."}
        
    # 2. Generate 6-digit OTP code
    code = "".join(str(secrets.randbelow(10)) for _ in range(6))
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    # 3. Store code in EmailVerification table (upsert)
    stmt_v = select(EmailVerification).where(EmailVerification.email == email)
    result_v = await db.execute(stmt_v)
    existing_verification = result_v.scalars().first()

    if existing_verification:
        # Check if 60 seconds have passed since the last password reset request
        now = datetime.now(timezone.utc)
        created_at = existing_verification.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        else:
            created_at = created_at.astimezone(timezone.utc)

        time_passed = now - created_at
        if time_passed.total_seconds() < 60:
            remaining = 60 - int(time_passed.total_seconds())
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {remaining} seconds before requesting a new code."
            )

        existing_verification.code = _hash_otp(code)
        existing_verification.expires_at = expires_at
        existing_verification.created_at = now
    else:
        new_verification = EmailVerification(
            email=email,
            code=_hash_otp(code),
            expires_at=expires_at
        )
        db.add(new_verification)
        
    await db.commit()

    # 4. Send email containing OTP
    await send_reset_password_email(email, code)

    return {"message": "A password reset code has been sent successfully to your email."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    request: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Step 2 of password reset: validates OTP and sets the new password.
    """
    email = request.email.lower()
    
    # 1. Verify the OTP code is valid and has not expired
    stmt_v = select(EmailVerification).where(EmailVerification.email == email)
    result_v = await db.execute(stmt_v)
    verification = result_v.scalars().first()

    if not verification or verification.code != _hash_otp(request.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code."
        )
        
    if verification.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired."
        )

    # 2. Fetch the user
    stmt_u = select(User).where(User.email == email)
    result_u = await db.execute(stmt_u)
    user = result_u.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    # 3. Reset the password and clean up verification OTP code
    user.password_hash = hash_password(request.new_password)
    await db.delete(verification)
    await db.commit()

    return {"message": "Your password has been successfully reset. Please log in with your new password."}



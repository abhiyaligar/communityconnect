"""
CommunityConnect Backend - FastAPI API Dependencies

Contains JWT token validators, current user extractors,
and role-based access control (RBAC) checker dependencies.
"""

import uuid
from typing import List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import settings
from app.core.security import decode_jwt_token
from app.db.session import get_db
from app.models.user import User
from app.models.enums import UserRole


# Security schema for Extracting Bearer Token from Auth Header
security_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Decodes the Bearer JWT token from the Authorization header
    and retrieves the corresponding active user from the database.
    """
    token = credentials.credentials
    payload = decode_jwt_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if payload.get("type") not in (None, "access"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID format in token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    stmt = select(User).where(User.id == user_uuid)
    result = await db.execute(stmt)
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )
        
    return user


async def require_active_membership(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> User:
    if current_user.role in (UserRole.community_admin, UserRole.local_admin):
        return current_user

    from datetime import date
    from app.models.membership import Membership, MembershipStatus

    stmt = select(Membership).where(Membership.user_id == current_user.id)
    result = await db.execute(stmt)
    membership = result.scalars().first()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active membership required to access this feature."
        )

    if membership.status != MembershipStatus.active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your membership is not active."
        )

    if membership.end_date < date.today():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your membership has expired."
        )

    return current_user


class RoleChecker:
    """
    FastAPI dependency factory class to enforce RBAC requirements.
    Usage: Depends(RoleChecker([UserRole.community_admin, UserRole.local_admin]))
    """
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        # Check if user has one of the allowed roles
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Action forbidden: Insufficient administrative privileges."
            )
        return current_user

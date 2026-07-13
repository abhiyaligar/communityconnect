"""
CommunityConnect Backend - API v1 Router

Aggregates all v1 endpoint routers under a single prefix.
"""

from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, admin, verification, profiles, matrimony, uploads, chat, suggestions, membership, preference, legal

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
api_router.include_router(verification.router, prefix="/verification", tags=["Verification"])
api_router.include_router(profiles.router, prefix="/profiles", tags=["Profiles"])
api_router.include_router(matrimony.router, prefix="/matrimony", tags=["Matrimony"])
api_router.include_router(preference.router, prefix="/matrimony", tags=["Matrimony"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["Uploads"])
api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])
api_router.include_router(suggestions.router, prefix="/suggestions", tags=["Suggestions"])
api_router.include_router(membership.router, prefix="/membership", tags=["Membership"])
api_router.include_router(legal.router, prefix="/legal", tags=["Legal"])

# Future routers:
# api_router.include_router(users.router, prefix="/users", tags=["Users"])
# api_router.include_router(posts.router, prefix="/posts", tags=["Posts"])

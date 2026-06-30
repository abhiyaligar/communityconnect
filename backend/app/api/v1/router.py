"""
CommunityConnect Backend - API v1 Router

Aggregates all v1 endpoint routers under a single prefix.
"""

from fastapi import APIRouter
from app.api.v1.endpoints import health

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(health.router, prefix="/health", tags=["Health"])

# Future routers:
# api_router.include_router(users.router, prefix="/users", tags=["Users"])
# api_router.include_router(posts.router, prefix="/posts", tags=["Posts"])

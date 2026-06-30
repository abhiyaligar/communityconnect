"""
CommunityConnect Backend - Health Check Router

Provides a basic health-check endpoint to verify the API is running.
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health", tags=["Health"])
async def health_check():
    """Returns API health status."""
    return {
        "status": "healthy",
        "message": "CommunityConnect API is up and running 🚀",
    }

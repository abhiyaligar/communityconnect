"""
CommunityConnect Backend - Rate Limiter Configuration

Initializes and configures the slowapi rate limiter using Redis
as the centralized backend storage provider.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.config import settings

# Initialize the global Limiter instance.
# It resolves the client's IP address dynamically using get_remote_address.
# Uses REDIS_URL for persistent, shared rate limiting across stateless Cloud Run instances.
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=settings.REDIS_URL,
)

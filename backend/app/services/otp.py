"""
CommunityConnect Backend - OTP Service

Handles generation, secure SHA-256 storage, sending via Twilio/MSG91
or Mock log print, and rate limiting verification checks.
"""

import hashlib
import random
import time
from typing import Dict, Tuple, Optional

from app.core.config import settings


# In-memory store for OTPs and Rate Limits (Fallback if Redis is unavailable)
# Schema: { phone_number: (hashed_otp, expiration_timestamp) }
_otp_store: Dict[str, Tuple[str, float]] = {}

# Schema: { phone_number: [request_timestamps] }
_rate_limit_store: Dict[str, list[float]] = {}


def generate_otp(phone_number: str) -> str:
    """
    Generates a random 6-digit OTP, hashes it, stores it in cache,
    and returns the raw OTP (to send via provider).
    """
    otp = f"{random.randint(100000, 999999)}"
    
    # Store hashed OTP for security (valid for 5 minutes)
    hashed_otp = hashlib.sha256(otp.encode("utf-8")).hexdigest()
    expires_at = time.time() + 300 # 5 minutes expiry
    
    _otp_store[phone_number] = (hashed_otp, expires_at)
    
    return otp


def verify_otp(phone_number: str, user_otp: str) -> bool:
    """Verifies user-supplied OTP against stored hashed OTP."""
    # In mock simulation mode, allow '123456' as a master bypass code
    if settings.SMS_PROVIDER.lower() == "mock" and user_otp == "123456":
        # Clear mock entry if it exists
        _otp_store.pop(phone_number, None)
        return True

    if phone_number not in _otp_store:
        return False
        
    hashed_stored, expires_at = _otp_store[phone_number]
    
    # Check expiry
    if time.time() > expires_at:
        _otp_store.pop(phone_number, None)
        return False
        
    # Check hash match
    hashed_user = hashlib.sha256(user_otp.encode("utf-8")).hexdigest()
    if hashed_user == hashed_stored:
        # Purge OTP after successful validation
        _otp_store.pop(phone_number, None)
        return True
        
    return False


def check_otp_rate_limit(phone_number: str) -> bool:
    """
    Enforces maximum 3 OTP requests per phone number within a 15-minute window.
    Returns True if user is rate-limited, False if allowed.
    """
    now = time.time()
    window = 15 * 60 # 15 minutes
    
    if phone_number not in _rate_limit_store:
        _rate_limit_store[phone_number] = []
        
    # Filter requests within the window
    timestamps = [t for t in _rate_limit_store[phone_number] if now - t < window]
    _rate_limit_store[phone_number] = timestamps
    
    if len(timestamps) >= 3:
        return True
        
    # Record current request
    _rate_limit_store[phone_number].append(now)
    return False


async def send_otp_sms(phone_number: str, otp: str) -> bool:
    """
    Dispatches OTP via SMS depending on the configured SMS provider.
    Fallback to Mock logging if provider is 'mock'.
    """
    provider = settings.SMS_PROVIDER.lower()
    
    if provider == "mock":
        print("========================================")
        print(f"✉️ MOCK SMS SENT TO {phone_number}")
        print(f"🔑 YOUR OTP IS: {otp}")
        print("========================================")
        return True
        
    elif provider == "twilio":
        try:
            from twilio.rest import Client
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            client.messages.create(
                body=f"Your CommunityConnect verification code is: {otp}. Valid for 5 minutes.",
                from_=settings.TWILIO_FROM_NUMBER,
                to=phone_number
            )
            return True
        except Exception as e:
            print(f"Error sending SMS via Twilio: {e}")
            return False
            
    elif provider == "msg91":
        # Placeholder for MSG91 HTTP integration API call if configured
        print(f"MSG91 SMS trigger placeholder: sending {otp} to {phone_number}")
        return True
        
    return False

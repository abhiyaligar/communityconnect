"""
CommunityConnect Backend - Email Utility

Handles sending SMTP emails. If credentials are not provided, it falls back
to simulating the email by logging it to the console.
"""

import logging
from typing import Optional
import aiosmtplib
from email.message import EmailMessage

logger = logging.getLogger(__name__)

# Temporary: In a real app these would come from app.core.config Settings
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = None  # Add standard gmail app password here in .env
SMTP_PASSWORD = None
FROM_EMAIL = "noreply@communityconnect.org"

async def send_verification_email(to_email: str, code: str) -> None:
    """
    Sends a 6-digit verification code to the user's email.
    """
    subject = "CommunityConnect - Your Verification Code"
    body = f"Your verification code is: {code}\n\nThis code will expire in 10 minutes."
    
    if not SMTP_USER or not SMTP_PASSWORD:
        # Simulation Mode
        logger.info(f"========== EMAIL SIMULATION ==========")
        logger.info(f"To: {to_email}")
        logger.info(f"Subject: {subject}")
        logger.info(f"Body:\n{body}")
        logger.info(f"======================================")
        return
        
    message = EmailMessage()
    message["From"] = FROM_EMAIL
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body)
    
    try:
        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            start_tls=True,
            username=SMTP_USER,
            password=SMTP_PASSWORD,
        )
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        # We don't raise the error so the user isn't completely blocked during dev
        logger.info(f"SIMULATION FALLBACK: Code is {code}")

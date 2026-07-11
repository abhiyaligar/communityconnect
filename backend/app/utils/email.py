"""
CommunityConnect Backend - Email Utility

Handles sending SMTP emails. If EMAIL_PROVIDER is "mock", it simulates
by logging to the console. If "smtp", it sends a real email.
"""

import logging
import aiosmtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_verification_email(to_email: str, code: str) -> None:
    subject = "CommunityConnect - Your Verification Code"
    body = f"Your verification code is: {code}\n\nThis code will expire in 10 minutes."

    if settings.EMAIL_PROVIDER.lower() == "mock":
        logger.info(f"========== EMAIL SIMULATION ==========")
        logger.info(f"To: {to_email}")
        logger.info(f"Subject: {subject}")
        logger.info(f"Body:\n{body}")
        logger.info(f"======================================")
        return

    if settings.EMAIL_PROVIDER.lower() == "smtp":
        message = EmailMessage()
        message["From"] = settings.FROM_EMAIL
        message["To"] = to_email
        message["Subject"] = subject
        message.set_content(body)

        try:
            await aiosmtplib.send(
                message,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                start_tls=True,
                username=settings.SMTP_USER,
                password=settings.SMTP_PASSWORD,
            )
            logger.info(f"Email sent successfully to {to_email}")
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            logger.info(f"SIMULATION FALLBACK: Email would have been sent to {to_email}")


async def send_reset_password_email(to_email: str, code: str) -> None:
    subject = "CommunityConnect - Reset Your Password"
    body = f"You requested to reset your password. Your password reset verification code is: {code}\n\nThis code will expire in 10 minutes."

    if settings.EMAIL_PROVIDER.lower() == "mock":
        logger.info(f"========== EMAIL SIMULATION ==========")
        logger.info(f"To: {to_email}")
        logger.info(f"Subject: {subject}")
        logger.info(f"Body:\n{body}")
        logger.info(f"======================================")
        return

    if settings.EMAIL_PROVIDER.lower() == "smtp":
        message = EmailMessage()
        message["From"] = settings.FROM_EMAIL
        message["To"] = to_email
        message["Subject"] = subject
        message.set_content(body)

        try:
            await aiosmtplib.send(
                message,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                start_tls=True,
                username=settings.SMTP_USER,
                password=settings.SMTP_PASSWORD,
            )
            logger.info(f"Password reset email sent successfully to {to_email}")
        except Exception as e:
            logger.error(f"Failed to send password reset email to {to_email}: {str(e)}")
            logger.info(f"SIMULATION FALLBACK: Password reset email would have been sent to {to_email}")


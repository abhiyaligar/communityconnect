"""
CommunityConnect Backend - Email Utility

Handles sending SMTP emails. If EMAIL_PROVIDER is "mock", it simulates
by logging to the console. If "smtp", it sends a real email.
"""

import logging
import aiosmtplib
from email.message import EmailMessage

from app.core.config import settings
from app.utils.email_templates import (
    activation_success_email,
    verification_approved_email,
    verification_rejected_email,
)

logger = logging.getLogger(__name__)


async def _send_email(to_email: str, subject: str, html_body: str, plain_body: str | None = None) -> None:
    if settings.EMAIL_PROVIDER.lower() == "mock":
        logger.info(f"========== EMAIL SIMULATION ==========")
        logger.info(f"To: {to_email}")
        logger.info(f"Subject: {subject}")
        logger.info(f"Body:\n{plain_body or html_body}")
        logger.info(f"======================================")
        return

    if settings.EMAIL_PROVIDER.lower() == "smtp":
        message = EmailMessage()
        message["From"] = settings.FROM_EMAIL
        message["To"] = to_email
        message["Subject"] = subject
        message.set_content(plain_body or html_body)
        message.add_alternative(html_body, subtype="html")

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


async def send_verification_email(to_email: str, code: str) -> None:
    subject = "Lad Matrimony - Your Verification Code"
    body = f"Your verification code is: {code}\n\nThis code will expire in 10 minutes."
    await _send_email(to_email, subject, body.replace("\n", "<br>"), body)


async def send_reset_password_email(to_email: str, code: str) -> None:
    subject = "Lad Matrimony - Reset Your Password"
    body = f"You requested to reset your password. Your password reset verification code is: {code}\n\nThis code will expire in 10 minutes."
    await _send_email(to_email, subject, body.replace("\n", "<br>"), body)


async def send_account_activation_email(to_email: str, full_name: str) -> None:
    subject = "Lad Matrimony - Account Activated Successfully"
    html = activation_success_email(full_name)
    plain = f"Hi {full_name}, your Lad Matrimony account has been successfully activated. Complete your profile and get verified to start matching!"
    await _send_email(to_email, subject, html, plain)


async def send_verification_status_email(to_email: str, full_name: str, status: str, reason: str | None = None) -> None:
    if status == "approved":
        subject = "Lad Matrimony - Profile Verified Successfully"
        html = verification_approved_email(full_name)
        plain = f"Hi {full_name}, your profile has been verified. You now have full access to Lad Matrimony features."
    else:
        subject = "Lad Matrimony - Verification Update"
        html = verification_rejected_email(full_name, reason)
        plain = f"Hi {full_name}, your profile verification could not be approved at this time.{' Reason: ' + reason if reason else ''}"
    await _send_email(to_email, subject, html, plain)


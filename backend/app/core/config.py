"""
CommunityConnect Backend - Core Configuration

Loads environment variables and provides app-wide settings
using Pydantic's BaseSettings for validation and type safety.
"""

from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import field_validator
import json


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "CommunityConnect"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/communityconnect"
    DATABASE_URL_SYNC: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/communityconnect"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT Auth
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # SMS OTP
    SMS_PROVIDER: str = "mock"
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_FROM_NUMBER: Optional[str] = None
    MSG91_AUTH_KEY: Optional[str] = None
    MSG91_TEMPLATE_ID: Optional[str] = None

    # Email SMTP
    EMAIL_PROVIDER: str = "mock"  # "mock" or "smtp"
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    FROM_EMAIL: str = "noreply@communityconnect.org"

    # File Storage
    STORAGE_PROVIDER: str = "local"
    UPLOAD_DIR: str = "./uploads"
    GCS_BUCKET_NAME: Optional[str] = None
    GCP_PROJECT_ID: Optional[str] = None
    GCP_SERVICE_ACCOUNT_JSON: Optional[str] = None

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return json.loads(v)
        return v

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore", # Allow extra variables without crashing
    }


# Singleton settings instance
settings = Settings()

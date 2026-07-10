"""
CommunityConnect Backend - FastAPI Application Entry Point

Creates and configures the FastAPI application with CORS,
routers, and startup/shutdown lifecycle events.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle manager for startup/shutdown events."""
    # --- Startup ---
    print(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"📖 Docs available at http://{settings.HOST}:{settings.PORT}/docs")
    
    # Auto-migration: Ensure database schema is in sync with latest changes
    from app.db.session import engine
    from sqlalchemy import text
    try:
        async with engine.begin() as conn:
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en';"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;"))
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS profile_likes (
                    id UUID PRIMARY KEY,
                    user_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
                    liked_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                    CONSTRAINT uq_user_liked_profile UNIQUE (user_profile_id, liked_profile_id)
                );
            """))
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS profile_dislikes (
                    id UUID PRIMARY KEY,
                    user_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
                    disliked_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                    CONSTRAINT uq_user_disliked_profile UNIQUE (user_profile_id, disliked_profile_id)
                );
            """))
        print("✅ Database schema verified (preferred_language, verified_at, profile_likes/dislikes tables ensured)")
    except Exception as e:
        print(f"⚠️ Error verifying schema: {e}")

        
    yield
    # --- Shutdown ---
    print(f"🛑 Shutting down {settings.APP_NAME}")


app = FastAPI(
    title=settings.APP_NAME,
    version="1.1.0",
    description=(
        "CommunityConnect — A platform to connect and empower local communities.\n\n"
        "## Features\n"
        "- **Community Profiles** — Member registration, admin verification, and profile management.\n"
        "- **Matrimony** — Opt-in matrimonial profiles with double-approval co-guardian system.\n"
        "- **Connection Requests** — Request-based matching with self & family approval workflow.\n"
        "- **Guardian System** — Non-matrimony users can browse matches as confirmed guardians.\n"
        "- **File Uploads** — Profile photo and document storage.\n"
        "- **Admin Panel** — User verification, escalation, and management.\n"
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

from app.core.limiter import limiter
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse

# Register limiter state for slowapi
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """Returns a standardized JSON response on rate limiting (HTTP 429)."""
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Please try again later."},
    )

# CORS Middleware — allow all origins (development mode)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://communityconnect-alpha.vercel.app",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
from fastapi.staticfiles import StaticFiles
import os

# Ensure local upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# Mount uploads static folder
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include API v1 routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint — API welcome message."""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "message": "Welcome to CommunityConnect API! 🌐",
    }

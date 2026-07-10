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

        
    yield
    # --- Shutdown ---
    print(f"🛑 Shutting down {settings.APP_NAME}")


app = FastAPI(
    title=settings.APP_NAME,
    version="1.2.0",
    description=(
        "CommunityConnect — A premium platform to connect and empower local communities.\n\n"
        "## Core Features\n"
        "- **Identity & Verification** — OTP Email registration, Password Recovery, and Admin verification workflows.\n"
        "- **Matrimony Network** — Detailed opt-in matrimonial profiles with dynamic swiper-based matchmaking.\n"
        "- **Connection Requests** — Two-way connection approvals with family co-guardian signoffs.\n"
        "- **Guardian Recommends** — Guardians can browse matches and shortlist recommendations for their wards.\n"
        "- **Profile Interactions** — Swipe tracking for likes and dislikes.\n"
        "- **Admin Panel** — Comprehensive user escalation, moderation, and verification management.\n"
        "- **Infrastructure** — Global rate-limiting backed by Redis and fully tracked Alembic migrations.\n"
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

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

# CORS Middleware — allow all origins (development mode)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

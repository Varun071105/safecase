from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.core.config import settings
from app.db.session import engine
from app.db.base import Base
from app.models import (
    User, ScamCategory, Complaint, ComplaintEvidence, ComplaintStatusHistory,
    InvestigationNote, BlacklistEntry, Notification, AuditLog, RefreshSession
)
from app.api.v1.router import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("safecase")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing SAFECASE Database schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database schema initialized successfully.")
    yield
    logger.info("SAFECASE shutting down...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Anti-Scam Complaint & Investigation Management System backend REST API",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include v1 endpoints
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "SAFECASE API",
        "version": settings.VERSION,
        "environment": "active"
    }

@app.get("/")
async def root():
    return {
        "portal": "SAFECASE — Anti-Scam Complaint & Investigation Management System",
        "api_docs": "/docs",
        "version": settings.VERSION
    }

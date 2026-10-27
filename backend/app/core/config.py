from pydantic_settings import BaseSettings
from typing import List, Optional
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "SAFECASE — Anti-Scam Complaint & Investigation Management System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "local-development-only-change-before-deploy")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day for dev/demo, configurable
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"
    
    # Database: Supports SQLite (built-in async) or PostgreSQL (postgresql+asyncpg://...)
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{BASE_DIR}/safecase.db")
    
    # Uploads Storage
    UPLOAD_DIR: str = os.getenv(
        "UPLOAD_DIR",
        "/tmp/safecase-uploads" if os.getenv("VERCEL") else str(BASE_DIR / "uploads")
    )
    MAX_UPLOAD_SIZE_MB: int = 15
    ALLOWED_EXTENSIONS: List[str] = ["png", "jpg", "jpeg", "pdf"]
    
    # Email settings
    SMTP_ENABLED: bool = os.getenv("SMTP_ENABLED", "false").lower() in ("true", "1")
    SMTP_HOST: Optional[str] = os.getenv("SMTP_HOST", "smtp.example.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: Optional[str] = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM: str = os.getenv("SMTP_FROM", "safecase-notifications@civicdesk.gov")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

if os.getenv("VERCEL"):
    if not os.getenv("SECRET_KEY"):
        raise RuntimeError("Set SECRET_KEY in the Vercel backend project environment.")
    if not os.getenv("DATABASE_URL", "").startswith("postgresql+asyncpg://"):
        raise RuntimeError(
            "Set DATABASE_URL to a persistent PostgreSQL URL using postgresql+asyncpg://."
        )

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

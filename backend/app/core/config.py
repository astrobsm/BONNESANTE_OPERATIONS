"""
BONNESANTE MEDICALS — ASAL Enterprise System
Core configuration module.
"""
import os
from pathlib import Path
from pydantic_settings import BaseSettings
from pydantic import field_validator
from functools import lru_cache
from typing import List

# Resolve .env path — works both locally (cwd=backend/) and on Vercel (cwd=repo root)
_backend_dir = Path(__file__).resolve().parent.parent.parent  # backend/
_env_file = _backend_dir / ".env" if (_backend_dir / ".env").exists() else ".env"


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "BONNESANTE ASAL Enterprise System"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database (Vercel Postgres / Neon / Supabase / local)
    DATABASE_URL: str = "postgresql+asyncpg://bonnesante:password@localhost:5432/bonnesante_db"

    @property
    def async_database_url(self) -> str:
        """Normalize any Postgres URL to use the asyncpg driver."""
        url = self.DATABASE_URL.strip()
        # Vercel/Neon gives postgres:// — convert to postgresql+asyncpg://
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://") and "+asyncpg" not in url:
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    # JWT Auth
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # Redis (optional — set to empty string to disable)
    REDIS_URL: str = ""

    # Strip trailing whitespace/newlines from all string env vars
    # (Vercel CLI can inject \r\n when piping values)
    @field_validator(
        "DATABASE_URL", "SECRET_KEY", "ALGORITHM", "ALLOWED_ORIGINS",
        "ENVIRONMENT", "REDIS_URL", "APP_NAME",
        mode="before",
    )
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        return v.strip() if isinstance(v, str) else v

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = str(_env_file)
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()

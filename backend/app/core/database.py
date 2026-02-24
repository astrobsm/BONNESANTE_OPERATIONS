"""
Database engine and session configuration.
Supports local PostgreSQL, Vercel Postgres (Neon), and Supabase.
"""
import ssl
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import get_settings

settings = get_settings()

_db_url = settings.async_database_url

# asyncpg doesn't understand ?sslmode=require — strip it and handle via connect_args
if "sslmode=" in _db_url:
    # Remove sslmode param from URL (asyncpg uses ssl connect_arg instead)
    import re
    _db_url = re.sub(r'[?&]sslmode=[^&]*', '', _db_url)
    # Clean up dangling ? or &
    _db_url = _db_url.rstrip('?').rstrip('&')

# Build connect_args for cloud Postgres providers
_connect_args: dict = {}
_is_cloud = any(host in _db_url for host in ["neon.tech", "supabase.com", ":6543/"])
if _is_cloud:
    # Neon & Supabase poolers need this
    _connect_args["prepared_statement_cache_size"] = 0
    # Cloud providers require SSL
    ssl_ctx = ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = ssl.CERT_NONE
    _connect_args["ssl"] = ssl_ctx

engine = create_async_engine(
    _db_url,
    echo=False,  # Set True only for debugging SQL queries locally
    pool_size=20 if not _is_cloud else 5,   # cloud has lower pool limits
    max_overflow=10 if not _is_cloud else 2,
    pool_pre_ping=True,
    connect_args=_connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

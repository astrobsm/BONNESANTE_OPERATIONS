"""
Database engine and session configuration.
Supports local PostgreSQL, Vercel Postgres (Neon), and Supabase.
Handles both long-running servers (uvicorn) and serverless (Vercel Functions).
"""
import os
import ssl
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool
from sqlalchemy.orm import DeclarativeBase
from app.core.config import get_settings

settings = get_settings()

_db_url = settings.async_database_url

# asyncpg doesn't understand ?sslmode=require — strip it and handle via connect_args
if "sslmode=" in _db_url:
    import re
    _db_url = re.sub(r'[?&]sslmode=[^&]*', '', _db_url)
    _db_url = _db_url.rstrip('?').rstrip('&')

# Build connect_args for cloud Postgres providers
_connect_args: dict = {}
_is_cloud = any(host in _db_url for host in ["neon.tech", "supabase.com", ":6543/"])
_is_serverless = os.environ.get("VERCEL", "").strip() == "1" or os.environ.get("AWS_LAMBDA_FUNCTION_NAME")

if _is_cloud:
    ssl_ctx = ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = ssl.CERT_NONE
    _connect_args["ssl"] = ssl_ctx
    # Neon requires this for connection pooling (PgBouncer)
    _connect_args["prepared_statement_cache_size"] = 0
    # Connection timeout — prevent serverless from hanging
    _connect_args["timeout"] = 10

if _is_serverless:
    # Serverless: Use NullPool to avoid connection pool issues
    engine = create_async_engine(
        _db_url,
        echo=False,
        poolclass=NullPool,
        connect_args=_connect_args,
    )
else:
    engine = create_async_engine(
        _db_url,
        echo=False,
        pool_size=5 if _is_cloud else 20,
        max_overflow=2 if _is_cloud else 10,
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

"""
BONNESANTE MEDICALS — ASAL Enterprise PWA System
Main FastAPI Application Entry Point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import get_settings
from app.core.database import engine, Base
from app.api import auth, inventory, sales, marketing, asal, disciplinary, kpi, sync

# Ensure ALL models are registered with Base.metadata
import app.models.user          # noqa: F401
import app.models.inventory     # noqa: F401
import app.models.sales         # noqa: F401
import app.models.marketing     # noqa: F401
import app.models.asal          # noqa: F401
import app.models.disciplinary  # noqa: F401
import app.models.kpi           # noqa: F401
import app.models.sync          # noqa: F401

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables on startup (skip on Vercel serverless — tables pre-created)."""
    import os
    if os.environ.get("VERCEL") != "1":
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
        except Exception as e:
            import logging
            logging.getLogger("uvicorn.error").warning(f"create_all note: {e}")
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Enterprise Offline-First PWA for Operations Management",
    lifespan=lifespan,
)

# Global exception handler for debugging
from fastapi.responses import JSONResponse
import traceback

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    tb = traceback.format_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "type": type(exc).__name__, "traceback": tb},
    )

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
API_PREFIX = "/api/v1"
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(inventory.router, prefix=API_PREFIX)
app.include_router(sales.router, prefix=API_PREFIX)
app.include_router(marketing.router, prefix=API_PREFIX)
app.include_router(asal.router, prefix=API_PREFIX)
app.include_router(disciplinary.router, prefix=API_PREFIX)
app.include_router(kpi.router, prefix=API_PREFIX)
app.include_router(sync.router, prefix=API_PREFIX)


@app.get("/")
async def root():
    return {
        "system": settings.APP_NAME,
        "version": settings.VERSION,
        "status": "operational",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/debug/db")
async def debug_db():
    """Temporary debug endpoint to test DB connectivity."""
    import traceback
    try:
        from app.core.database import AsyncSessionLocal
        async with AsyncSessionLocal() as session:
            from sqlalchemy import text
            result = await session.execute(text("SELECT 1"))
            val = result.scalar()
            return {"db": "connected", "result": val}
    except Exception as e:
        return {"db": "error", "error": str(e), "traceback": traceback.format_exc()}

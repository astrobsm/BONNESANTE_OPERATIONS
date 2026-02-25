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
@app.get("/api/")
async def root():
    return {
        "system": settings.APP_NAME,
        "version": settings.VERSION,
        "status": "operational",
    }


@app.get("/health")
@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/api/debug/db")
async def debug_db():
    """Temporary debug endpoint to test DB connectivity."""
    import traceback
    import os
    db_url = os.environ.get("DATABASE_URL", "NOT_SET")
    # Mask password
    masked = db_url[:20] + "***" + db_url[-30:] if len(db_url) > 50 else db_url
    info = {
        "db_url_repr": repr(db_url[:60]),
        "db_url_masked": masked,
        "db_url_len": len(db_url),
        "has_newline": "\n" in db_url or "\r" in db_url,
        "vercel_env": repr(os.environ.get("VERCEL", "NOT_SET")),
        "is_serverless": os.environ.get("VERCEL", "").strip() == "1",
    }
    try:
        from app.core.database import AsyncSessionLocal
        async with AsyncSessionLocal() as session:
            from sqlalchemy import text
            result = await session.execute(text("SELECT 1 AS ok"))
            val = result.scalar()
            info["db"] = "connected"
            info["result"] = val
    except Exception as e:
        info["db"] = "error"
        info["error"] = str(e)
        info["error_type"] = type(e).__name__
        info["traceback"] = traceback.format_exc()
    return info


@app.post("/api/debug/login")
async def debug_login():
    """Test the login flow step by step."""
    import traceback
    steps = {}
    try:
        # Step 1: Test bcrypt import
        import bcrypt
        steps["bcrypt_import"] = "ok"

        # Step 2: Test password hashing
        test_hash = bcrypt.hashpw(b"test", bcrypt.gensalt()).decode()
        steps["bcrypt_hash"] = "ok"

        # Step 3: Test password verify
        ok = bcrypt.checkpw(b"test", test_hash.encode())
        steps["bcrypt_verify"] = ok

        # Step 4: Test JWT
        import jwt as pyjwt
        token = pyjwt.encode({"sub": "test"}, "secret", algorithm="HS256")
        steps["jwt_encode"] = "ok"
        decoded = pyjwt.decode(token, "secret", algorithms=["HS256"])
        steps["jwt_decode"] = decoded

        # Step 5: Test DB - find admin user
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                text("SELECT id, email, hashed_password, role FROM users WHERE email = :e"),
                {"e": "emmanuelnnadi@astrobsm.edu.org"},
            )
            row = result.first()
            if row:
                steps["user_found"] = True
                steps["user_email"] = row.email
                steps["user_role"] = row.role
                steps["hash_prefix"] = row.hashed_password[:20] + "..."
                # Step 6: Test verify against actual hash
                actual_ok = bcrypt.checkpw(b"blackvelvet", row.hashed_password.encode())
                steps["password_match"] = actual_ok
            else:
                steps["user_found"] = False
    except Exception as e:
        steps["error"] = str(e)
        steps["error_type"] = type(e).__name__
        steps["traceback"] = traceback.format_exc()
    return steps

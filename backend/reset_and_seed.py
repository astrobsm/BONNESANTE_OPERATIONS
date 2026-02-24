"""
Reset Neon DB (drop all tables & types) then seed admin user.
Run:  cd backend && python reset_and_seed.py
"""
import asyncio
from sqlalchemy import text, select
from app.core.database import engine, AsyncSessionLocal, Base
from app.core.security import hash_password
from app.models.user import User, UserRole

# Import ALL models so Base.metadata knows every table
import app.models.asal          # noqa: F401
import app.models.inventory     # noqa: F401
import app.models.sales         # noqa: F401
import app.models.marketing     # noqa: F401
import app.models.disciplinary  # noqa: F401
import app.models.kpi           # noqa: F401
import app.models.sync          # noqa: F401


ADMIN_EMAIL = "emmanuelnnadi@astrobsm.edu.org"
ADMIN_PASSWORD = "blackvelvet"
ADMIN_NAME = "Emmanuel Nnadi"
ADMIN_EMPLOYEE_ID = "BSM-ADMIN-001"


async def reset_and_seed():
    # ── Step 1: Nuke public schema ───────────────────────────────────
    print("🗑  Dropping public schema …")
    async with engine.begin() as conn:
        await conn.execute(text("DROP SCHEMA public CASCADE"))
        await conn.execute(text("CREATE SCHEMA public"))
        await conn.execute(text("GRANT ALL ON SCHEMA public TO neondb_owner"))
        await conn.execute(text("GRANT ALL ON SCHEMA public TO public"))
    print("✅ Schema reset complete")

    # ── Step 2: Create all tables + enum types from models ───────────
    print("📦 Creating tables …")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ All tables created")

    # ── Step 3: Seed admin user ──────────────────────────────────────
    print("👤 Seeding admin user …")
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == ADMIN_EMAIL))
        existing = result.scalar_one_or_none()

        if existing:
            print(f"   Admin already exists: {existing.email}")
            return

        admin = User(
            employee_id=ADMIN_EMPLOYEE_ID,
            email=ADMIN_EMAIL,
            full_name=ADMIN_NAME,
            hashed_password=hash_password(ADMIN_PASSWORD),
            role=UserRole.ADMIN,
            department="Administration",
            is_active=True,
            is_verified=True,
            employment_agreement_signed=True,
            compliance_consent=True,
            permissions={},
        )
        session.add(admin)
        await session.commit()
        print(f"✅ Admin created!")
        print(f"   Email:    {ADMIN_EMAIL}")
        print(f"   Password: {ADMIN_PASSWORD}")
        print(f"   Role:     admin")


if __name__ == "__main__":
    asyncio.run(reset_and_seed())

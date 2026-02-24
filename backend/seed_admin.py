"""
Seed script — Create the initial admin user.
Run: python seed_admin.py
"""
import asyncio
from sqlalchemy import select
from app.core.database import engine, AsyncSessionLocal, Base
from app.core.security import hash_password
from app.models.user import User, UserRole

# Import ALL models so SQLAlchemy resolves relationships
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


async def seed():
    # Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == ADMIN_EMAIL))
        existing = result.scalar_one_or_none()

        if existing:
            print(f"✅ Admin already exists: {existing.email} (role={existing.role.value})")
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
        print(f"✅ Admin created successfully!")
        print(f"   Email:    {ADMIN_EMAIL}")
        print(f"   Password: {ADMIN_PASSWORD}")
        print(f"   Role:     admin")


if __name__ == "__main__":
    asyncio.run(seed())

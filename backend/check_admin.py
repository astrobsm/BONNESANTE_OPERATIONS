"""Quick check: is admin seeded? If not, seed now. No SQL echo."""
import asyncio, os
os.environ["DEBUG"] = "False"          # suppress SQL echo

from sqlalchemy import select
from app.core.database import AsyncSessionLocal, engine, Base
from app.core.security import hash_password
from app.models.user import User, UserRole

# Import all models so relationships resolve
import app.models.asal, app.models.inventory, app.models.sales  # noqa
import app.models.marketing, app.models.disciplinary             # noqa
import app.models.kpi, app.models.sync                           # noqa

ADMIN_EMAIL = "emmanuelnnadi@astrobsm.edu.org"

async def run():
    # ensure tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == ADMIN_EMAIL))
        user = result.scalar_one_or_none()
        if user:
            print(f"ADMIN EXISTS: {user.email} | role={user.role.value} | active={user.is_active}")
        else:
            admin = User(
                employee_id="BSM-ADMIN-001",
                email=ADMIN_EMAIL,
                full_name="Emmanuel Nnadi",
                hashed_password=hash_password("blackvelvet"),
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
            print(f"ADMIN CREATED: {ADMIN_EMAIL} | password=blackvelvet | role=admin")

asyncio.run(run())

"""
Authentication & User Management API routes.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.deps import get_current_user, get_current_active_admin, require_roles
from app.models.user import User, UserRole, AuditLog
from app.schemas.user import (
    LoginRequest, TokenResponse, RefreshRequest,
    UserCreate, UserUpdate, UserOut, UserListOut,
    ConsentRequest, PasswordChange, AuditLogOut,
)

router = APIRouter(prefix="/auth", tags=["Authentication & Users"])


# ─── Login ────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    import traceback as tb_mod
    from fastapi.responses import JSONResponse
    try:
        result = await db.execute(select(User).where(User.email == body.email))
        user = result.scalar_one_or_none()

        if not user or not verify_password(body.password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account deactivated")

        # Update device binding and last login
        user.device_id = body.device_id
        user.last_login = datetime.now(timezone.utc)

        token_data = {"sub": str(user.id), "role": user.role.value, "device_id": body.device_id}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        # Audit trail
        audit = AuditLog(
            user_id=user.id,
            action="LOGIN",
            resource_type="auth",
            details={"device_id": body.device_id},
            ip_address=request.client.host if request.client else None,
            device_id=body.device_id,
        )
        db.add(audit)
        await db.commit()

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserOut.model_validate(user),
        )
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"login_error": str(e), "type": type(e).__name__, "tb": tb_mod.format_exc()},
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(body.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    token_data = {"sub": str(user.id), "role": user.role.value, "device_id": user.device_id}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        user=UserOut.model_validate(user),
    )


# ─── User CRUD ────────────────────────────────────────────────────────

@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    body: UserCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_active_admin),
):
    # Check uniqueness
    existing = await db.execute(
        select(User).where((User.email == body.email) | (User.employee_id == body.employee_id))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email or Employee ID already exists")

    user = User(
        employee_id=body.employee_id,
        email=body.email,
        full_name=body.full_name,
        phone=body.phone,
        hashed_password=hash_password(body.password),
        role=body.role,
        department=body.department,
    )
    db.add(user)
    await db.flush()

    # Audit
    db.add(AuditLog(
        user_id=admin.id, action="CREATE_USER", resource_type="user",
        resource_id=str(user.id), details={"role": body.role.value},
    ))

    return UserOut.model_validate(user)


@router.get("/users", response_model=UserListOut)
async def list_users(
    page: int = 1,
    page_size: int = 50,
    role: Optional[UserRole] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.HR_MANAGEMENT])),
):
    query = select(User)
    count_query = select(func.count()).select_from(User)

    if role:
        query = query.where(User.role == role)
        count_query = count_query.where(User.role == role)

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    result = await db.execute(
        query.order_by(User.full_name).offset((page - 1) * page_size).limit(page_size)
    )
    users = result.scalars().all()

    return UserListOut(
        users=[UserOut.model_validate(u) for u in users],
        total=total, page=page, page_size=page_size,
    )


@router.get("/users/me", response_model=UserOut)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)


@router.put("/users/{user_id}", response_model=UserOut)
async def update_user(
    user_id: UUID,
    body: UserUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_active_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(user, field, value)

    db.add(AuditLog(
        user_id=admin.id, action="UPDATE_USER", resource_type="user",
        resource_id=str(user_id), details=body.model_dump(exclude_unset=True),
    ))

    return UserOut.model_validate(user)


# ─── Legal Consent ────────────────────────────────────────────────────

@router.post("/users/me/consent")
async def submit_consent(
    body: ConsentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.employment_agreement_signed = body.employment_agreement_signed
    current_user.compliance_consent = body.compliance_consent
    current_user.payroll_deduction_consent = body.payroll_deduction_consent

    db.add(AuditLog(
        user_id=current_user.id, action="SUBMIT_CONSENT", resource_type="legal",
        resource_id=str(current_user.id),
        details={"signature": body.digital_signature, "consent": body.model_dump()},
    ))

    return {"message": "Consent recorded", "timestamp": datetime.now(timezone.utc).isoformat()}


@router.post("/users/me/change-password")
async def change_password(
    body: PasswordChange,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password incorrect")

    current_user.hashed_password = hash_password(body.new_password)

    db.add(AuditLog(
        user_id=current_user.id, action="CHANGE_PASSWORD", resource_type="auth",
        resource_id=str(current_user.id), details={},
    ))

    return {"message": "Password changed successfully"}


# ─── Audit Logs ───────────────────────────────────────────────────────

@router.get("/audit-logs", response_model=List[AuditLogOut])
async def get_audit_logs(
    page: int = 1,
    page_size: int = 100,
    action: Optional[str] = None,
    user_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.ADMIN, UserRole.HR_MANAGEMENT])),
):
    query = select(AuditLog)
    if action:
        query = query.where(AuditLog.action == action)
    if user_id:
        query = query.where(AuditLog.user_id == user_id)

    result = await db.execute(
        query.order_by(AuditLog.timestamp.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    logs = result.scalars().all()
    return [AuditLogOut.model_validate(log) for log in logs]

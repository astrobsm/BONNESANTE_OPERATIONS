"""
Authentication & User Management API routes.
Includes login, token refresh, CRUD, password reset, admin password reset,
activate/deactivate, consent, and audit logs.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
)
from app.core.deps import get_current_user, get_current_active_admin, require_roles
from app.models.user import User, UserRole, AuditLog, PasswordResetToken
from app.schemas.user import (
    LoginRequest, TokenResponse, RefreshRequest,
    UserCreate, UserUpdate, UserOut, UserListOut,
    ConsentRequest, PasswordChange, AuditLogOut,
    ForgotPasswordRequest, ResetPasswordRequest,
    AdminPasswordReset, ToggleUserActiveRequest,
)

router = APIRouter(prefix="/auth", tags=["Authentication & Users"])


# ─── Login ────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account deactivated")

    user.device_id = body.device_id
    user.last_login = datetime.now(timezone.utc)

    token_data = {"sub": str(user.id), "role": user.role.value, "device_id": body.device_id}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    db.add(AuditLog(
        user_id=user.id,
        action="LOGIN",
        resource_type="auth",
        details={"device_id": body.device_id},
        ip_address=request.client.host if request.client else None,
        device_id=body.device_id,
    ))
    await db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserOut.model_validate(user),
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

    db.add(AuditLog(
        user_id=admin.id, action="CREATE_USER", resource_type="user",
        resource_id=str(user.id), details={"role": body.role.value, "email": body.email},
    ))
    await db.commit()

    return UserOut.model_validate(user)


@router.get("/users", response_model=UserListOut)
async def list_users(
    page: int = 1,
    page_size: int = 50,
    role: Optional[UserRole] = None,
    search: Optional[str] = Query(None, description="Search by name or email"),
    active_only: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.HR_MANAGEMENT])),
):
    query = select(User)
    count_query = select(func.count()).select_from(User)

    if role:
        query = query.where(User.role == role)
        count_query = count_query.where(User.role == role)

    if search:
        pattern = f"%{search}%"
        query = query.where((User.full_name.ilike(pattern)) | (User.email.ilike(pattern)))
        count_query = count_query.where((User.full_name.ilike(pattern)) | (User.email.ilike(pattern)))

    if active_only is not None:
        query = query.where(User.is_active == active_only)
        count_query = count_query.where(User.is_active == active_only)

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


@router.get("/users/{user_id}", response_model=UserOut)
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.ADMIN, UserRole.HR_MANAGEMENT])),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserOut.model_validate(user)


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
    await db.commit()

    return UserOut.model_validate(user)


# ─── Activate / Deactivate User ──────────────────────────────────────

@router.patch("/users/{user_id}/toggle-active", response_model=UserOut)
async def toggle_user_active(
    user_id: UUID,
    body: ToggleUserActiveRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_active_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")

    user.is_active = body.is_active

    action = "ACTIVATE_USER" if body.is_active else "DEACTIVATE_USER"
    db.add(AuditLog(
        user_id=admin.id, action=action, resource_type="user",
        resource_id=str(user_id), details={"is_active": body.is_active},
    ))
    await db.commit()

    return UserOut.model_validate(user)


# ─── Admin Password Reset ────────────────────────────────────────────

@router.post("/users/{user_id}/reset-password")
async def admin_reset_password(
    user_id: UUID,
    body: AdminPasswordReset,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_active_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = hash_password(body.new_password)

    db.add(AuditLog(
        user_id=admin.id, action="ADMIN_RESET_PASSWORD", resource_type="user",
        resource_id=str(user_id), details={"reset_by": admin.full_name},
    ))
    await db.commit()

    return {"message": f"Password reset for {user.full_name}", "user_id": str(user_id)}


# ─── Self-Service Password Reset (Forgot Password) ───────────────────

@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    Request a password reset token.
    Returns the token directly (for internal use).
    In production, the token would be emailed to the user.
    """
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user:
        return {"message": "If that email exists, a reset link has been generated."}

    # Invalidate previous unused tokens
    old_tokens_result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used == False,
        )
    )
    for old_token in old_tokens_result.scalars().all():
        old_token.used = True

    reset_token = PasswordResetToken(user_id=user.id)
    db.add(reset_token)

    db.add(AuditLog(
        user_id=user.id, action="PASSWORD_RESET_REQUEST", resource_type="auth",
        details={"email": body.email},
    ))
    await db.commit()

    return {
        "message": "If that email exists, a reset link has been generated.",
        "reset_token": reset_token.token,
        "expires_at": reset_token.expires_at.isoformat(),
    }


@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Use a reset token to set a new password."""
    result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.token == body.token,
            PasswordResetToken.used == False,
        )
    )
    token_record = result.scalar_one_or_none()

    if not token_record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    if token_record.expires_at < datetime.now(timezone.utc):
        token_record.used = True
        await db.commit()
        raise HTTPException(status_code=400, detail="Reset token has expired")

    user_result = await db.execute(select(User).where(User.id == token_record.user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    user.hashed_password = hash_password(body.new_password)
    token_record.used = True

    db.add(AuditLog(
        user_id=user.id, action="PASSWORD_RESET_COMPLETE", resource_type="auth",
        details={},
    ))
    await db.commit()

    return {"message": "Password has been reset successfully. You can now log in."}


# ─── Self-service Password Change ────────────────────────────────────

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
    await db.commit()

    return {"message": "Password changed successfully"}


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
    await db.commit()

    return {"message": "Consent recorded", "timestamp": datetime.now(timezone.utc).isoformat()}


# ─── Dashboard Stats (role-aware) ────────────────────────────────────

@router.get("/dashboard-stats")
async def dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return role-specific dashboard statistics."""
    stats: dict = {"role": current_user.role.value}

    if current_user.role in (UserRole.ADMIN, UserRole.HR_MANAGEMENT):
        total = (await db.execute(select(func.count()).select_from(User))).scalar()
        active = (await db.execute(
            select(func.count()).select_from(User).where(User.is_active == True)
        )).scalar()
        role_counts = {}
        for r in UserRole:
            cnt = (await db.execute(
                select(func.count()).select_from(User).where(User.role == r)
            )).scalar()
            role_counts[r.value] = cnt
        stats.update({
            "total_users": total,
            "active_users": active,
            "inactive_users": total - active,
            "users_by_role": role_counts,
        })

    from datetime import timedelta
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent_logins = (await db.execute(
        select(func.count()).select_from(AuditLog).where(
            AuditLog.action == "LOGIN",
            AuditLog.timestamp >= week_ago,
        )
    )).scalar()
    stats["recent_logins_7d"] = recent_logins

    return stats


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

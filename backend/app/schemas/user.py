"""
Pydantic schemas for User & Auth.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID
from app.models.user import UserRole


# ─── Auth ─────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str
    device_id: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserOut"


class RefreshRequest(BaseModel):
    refresh_token: str


# ─── User ─────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    employee_id: str = Field(..., min_length=1, max_length=50)
    email: str = Field(..., min_length=5, max_length=255)
    full_name: str = Field(..., min_length=2, max_length=255)
    phone: Optional[str] = None
    password: str = Field(..., min_length=8)
    role: UserRole
    department: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserOut(BaseModel):
    id: UUID
    employee_id: str
    email: str
    full_name: str
    phone: Optional[str]
    role: UserRole
    department: Optional[str]
    is_active: bool
    is_verified: bool
    employment_agreement_signed: bool
    compliance_consent: bool
    last_login: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class UserListOut(BaseModel):
    users: List[UserOut]
    total: int
    page: int
    page_size: int


# ─── Legal Consent ────────────────────────────────────────────────────

class ConsentRequest(BaseModel):
    employment_agreement_signed: bool = False
    compliance_consent: bool = False
    payroll_deduction_consent: bool = False
    digital_signature: str  # Hashed signature


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


# ─── Audit ────────────────────────────────────────────────────────────

class AuditLogOut(BaseModel):
    id: UUID
    user_id: Optional[UUID]
    action: str
    resource_type: str
    resource_id: Optional[str]
    details: Dict[str, Any]
    timestamp: datetime

    model_config = {"from_attributes": True}

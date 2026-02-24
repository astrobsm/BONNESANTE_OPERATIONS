"""
User & Role Management model — RBAC.
"""
import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Boolean, DateTime, Enum, Text, JSON, ForeignKey
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class UserRole(str, enum.Enum):
    FACTORY_SUPERVISOR = "factory_supervisor"
    SALES_MANAGER = "sales_manager"
    MARKETER = "marketer"
    CUSTOMER_CARE = "customer_care"
    ADMIN = "admin"
    HR_MANAGEMENT = "hr_management"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    department = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    device_id = Column(String(255), nullable=True)  # Device binding
    last_login = Column(DateTime(timezone=True), nullable=True)
    employment_agreement_signed = Column(Boolean, default=False)
    compliance_consent = Column(Boolean, default=False)
    payroll_deduction_consent = Column(Boolean, default=False)
    permissions = Column(JSON, default=dict)  # Granular permission overrides
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    daily_logs = relationship("DailyLog", back_populates="user", lazy="dynamic")
    weekly_plans = relationship("WeeklyPlan", back_populates="user", lazy="dynamic")
    weekly_reports = relationship("WeeklyReport", back_populates="user", lazy="dynamic", foreign_keys="[WeeklyReport.user_id]")
    disciplinary_records = relationship("DisciplinaryRecord", back_populates="user", lazy="dynamic", foreign_keys="[DisciplinaryRecord.user_id]")
    payroll_records = relationship("PayrollRecord", back_populates="user", lazy="dynamic", foreign_keys="[PayrollRecord.user_id]")
    kpi_records = relationship("KPIRecord", back_populates="user", lazy="dynamic", foreign_keys="[KPIRecord.user_id]")
    audit_logs = relationship("AuditLog", back_populates="user", lazy="dynamic")

    def __repr__(self):
        return f"<User {self.full_name} ({self.role.value})>"


class AuditLog(Base):
    """Immutable audit trail for all system actions."""
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(String(255), nullable=True)
    details = Column(JSON, default=dict)
    ip_address = Column(String(45), nullable=True)
    device_id = Column(String(255), nullable=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)

    user = relationship("User", back_populates="audit_logs")

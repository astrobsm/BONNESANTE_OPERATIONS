"""
Disciplinary Automation & Payroll models.
"""
import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Date,
    Enum, Text, JSON, ForeignKey, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.inventory import SyncStatus


class QueryType(str, enum.Enum):
    MISSED_DAILY_LOG = "missed_daily_log"
    MISSED_WEEKLY_PLAN = "missed_weekly_plan"
    MISSED_WEEKLY_REPORT = "missed_weekly_report"
    PERFORMANCE_BELOW_THRESHOLD = "performance_below_threshold"
    POLICY_VIOLATION = "policy_violation"
    CUSTOM = "custom"


class DisciplinaryStatus(str, enum.Enum):
    ISSUED = "issued"
    ACKNOWLEDGED = "acknowledged"
    APPEALED = "appealed"
    UNDER_REVIEW = "under_review"
    RESOLVED = "resolved"
    ESCALATED = "escalated"


class PayrollStatus(str, enum.Enum):
    DRAFT = "draft"
    CALCULATED = "calculated"
    APPROVED = "approved"
    PAID = "paid"
    DISPUTED = "disputed"


# ─── Disciplinary Record ─────────────────────────────────────────────

class DisciplinaryRecord(Base):
    """
    Auto-generated queries and disciplinary actions.
    Rules:
      - 2 consecutive missed daily logs → Auto query
      - 3+ queries/month → Disciplinary review + privilege lock
      - Weekly non-compliance: 1st=5%, 2nd=20%, 3rd=termination review
    """
    __tablename__ = "disciplinary_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    record_id = Column(String(50), unique=True, nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    query_type = Column(Enum(QueryType), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(Enum(DisciplinaryStatus), default=DisciplinaryStatus.ISSUED, nullable=False)

    # Auto-detection metadata
    auto_generated = Column(Boolean, default=True)
    trigger_data = Column(JSON, default=dict)  # Evidence: dates missed, etc.
    consecutive_count = Column(Integer, default=1)

    # Payroll impact
    payroll_deduction_percentage = Column(Float, default=0)
    deduction_applied = Column(Boolean, default=False)

    # Privilege impact
    privileges_locked = Column(Boolean, default=False)
    locked_privileges = Column(JSON, default=list)

    # Appeal workflow
    appeal_submitted = Column(Boolean, default=False)
    appeal_text = Column(Text, nullable=True)
    appeal_date = Column(DateTime(timezone=True), nullable=True)
    appeal_decision = Column(Text, nullable=True)
    appeal_decided_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Management confirmation (for termination)
    requires_management_confirmation = Column(Boolean, default=False)
    management_confirmed = Column(Boolean, default=False)
    management_confirmed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    management_confirmed_at = Column(DateTime(timezone=True), nullable=True)

    # Digital acknowledgment
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    digital_signature = Column(Text, nullable=True)

    # Sync fields
    sync_status = Column(Enum(SyncStatus), default=SyncStatus.PENDING)
    device_id = Column(String(255), nullable=True)
    version = Column(Integer, default=1)
    last_modified = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="disciplinary_records", foreign_keys=[user_id])


# ─── Payroll Record ──────────────────────────────────────────────────

class PayrollRecord(Base):
    __tablename__ = "payroll_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    payroll_id = Column(String(50), unique=True, nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)

    # Base pay
    salary_base = Column(Float, nullable=False)
    kpi_bonus = Column(Float, default=0)
    call_allowance = Column(Float, default=0)
    transport_allowance = Column(Float, default=0)
    other_allowances = Column(Float, default=0)

    # Deductions
    compliance_deduction = Column(Float, default=0)      # From disciplinary engine
    compliance_deduction_pct = Column(Float, default=0)   # Percentage applied
    tax_deduction = Column(Float, default=0)
    insurance_deduction = Column(Float, default=0)
    other_deductions = Column(Float, default=0)
    deduction_triggers = Column(JSON, default=list)       # Referenced disciplinary records

    # Totals
    gross_pay = Column(Float, default=0)
    total_deductions = Column(Float, default=0)
    net_pay = Column(Float, default=0)

    status = Column(Enum(PayrollStatus), default=PayrollStatus.DRAFT, nullable=False)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)

    notes = Column(Text, nullable=True)

    # Sync fields
    sync_status = Column(Enum(SyncStatus), default=SyncStatus.PENDING)
    device_id = Column(String(255), nullable=True)
    version = Column(Integer, default=1)
    last_modified = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="payroll_records", foreign_keys=[user_id])

    __table_args__ = (
        CheckConstraint("salary_base >= 0", name="payroll_salary_positive"),
        CheckConstraint("net_pay >= 0", name="payroll_net_positive"),
    )

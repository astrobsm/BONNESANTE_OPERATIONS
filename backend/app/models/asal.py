"""
ASAL Core Engine models — Daily Logs, Weekly Plans, Weekly Reports.
This is the heart of the operational compliance system.
"""
import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Date,
    Enum, Text, JSON, ForeignKey, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.inventory import SyncStatus


class LogStatus(str, enum.Enum):
    SUBMITTED = "submitted"
    VALIDATED = "validated"
    MISSED = "missed"
    LATE = "late"


class PlanStatus(str, enum.Enum):
    SUBMITTED = "submitted"
    LATE = "late"
    MISSED = "missed"


class ReportStatus(str, enum.Enum):
    SUBMITTED = "submitted"
    LATE = "late"
    MISSED = "missed"
    REVIEWED = "reviewed"


# ─── Daily Activity Log ──────────────────────────────────────────────

class DailyLog(Base):
    """
    Every staff must submit a role-based log before end of day.
    2 consecutive missed logs → Auto Query generated.
    """
    __tablename__ = "daily_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    log_date = Column(Date, nullable=False, index=True)
    role_at_time = Column(String(50), nullable=False)

    # Role-specific content stored as structured JSON
    activities = Column(JSON, nullable=False, default=list)
    key_achievements = Column(Text, nullable=True)
    challenges = Column(Text, nullable=True)
    tomorrow_plan = Column(Text, nullable=True)
    hours_worked = Column(Float, default=8)
    status = Column(Enum(LogStatus), default=LogStatus.SUBMITTED, nullable=False)
    submitted_at = Column(DateTime(timezone=True), nullable=True)

    # Sync fields
    sync_status = Column(Enum(SyncStatus), default=SyncStatus.PENDING)
    device_id = Column(String(255), nullable=True)
    version = Column(Integer, default=1)
    last_modified = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="daily_logs")

    __table_args__ = (
        UniqueConstraint("user_id", "log_date", name="uq_daily_log_user_date"),
    )


# ─── Weekly Plan (Sunday 7PM deadline) ───────────────────────────────

class WeeklyPlan(Base):
    """
    SMART objectives form due Sunday 7PM.
    Late submission → Auto non-compliance flag.
    """
    __tablename__ = "weekly_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    week_start_date = Column(Date, nullable=False, index=True)  # Monday of the week
    week_number = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)

    # SMART objectives
    objectives = Column(JSON, nullable=False, default=list)
    # Each objective: {title, description, measurable_target, timeline, resources_needed}
    kpi_targets = Column(JSON, default=dict)
    resource_requests = Column(JSON, default=list)
    time_bound_actions = Column(JSON, default=list)

    status = Column(Enum(PlanStatus), default=PlanStatus.SUBMITTED, nullable=False)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    deadline = Column(DateTime(timezone=True), nullable=False)  # Sunday 7PM

    # Sync fields
    sync_status = Column(Enum(SyncStatus), default=SyncStatus.PENDING)
    device_id = Column(String(255), nullable=True)
    version = Column(Integer, default=1)
    last_modified = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="weekly_plans")

    __table_args__ = (
        UniqueConstraint("user_id", "week_start_date", name="uq_weekly_plan_user_week"),
    )


# ─── Weekly Implementation Report (Friday 7PM deadline) ──────────────

class WeeklyReport(Base):
    """
    Friday 7PM: objectives achieved, KPI evidence, deviation explanation.
    """
    __tablename__ = "weekly_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    weekly_plan_id = Column(UUID(as_uuid=True), ForeignKey("weekly_plans.id"), nullable=True)
    week_start_date = Column(Date, nullable=False, index=True)
    week_number = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)

    # Implementation results
    objectives_achieved = Column(JSON, default=list)
    # Each: {objective_title, achieved: bool, evidence, percentage_complete}
    kpi_evidence = Column(JSON, default=dict)
    financial_impact = Column(JSON, default=dict)  # {revenue, costs, savings}
    inventory_impact = Column(JSON, default=dict)
    deviation_explanation = Column(Text, nullable=True)
    lessons_learned = Column(Text, nullable=True)
    next_week_adjustments = Column(Text, nullable=True)

    status = Column(Enum(ReportStatus), default=ReportStatus.SUBMITTED, nullable=False)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    deadline = Column(DateTime(timezone=True), nullable=False)  # Friday 7PM
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    review_notes = Column(Text, nullable=True)

    # Sync fields
    sync_status = Column(Enum(SyncStatus), default=SyncStatus.PENDING)
    device_id = Column(String(255), nullable=True)
    version = Column(Integer, default=1)
    last_modified = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="weekly_reports", foreign_keys=[user_id])

    __table_args__ = (
        UniqueConstraint("user_id", "week_start_date", name="uq_weekly_report_user_week"),
    )

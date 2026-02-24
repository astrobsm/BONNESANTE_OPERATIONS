"""
KPI & Target Engine models.
Performance scoring, monthly targets, accountability index.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, DateTime, Date,
    Enum, Text, JSON, ForeignKey, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.inventory import SyncStatus


class KPIRecord(Base):
    """
    Monthly KPI tracking per user.
    Performance Score = (Revenue Achievement × 40%)
                      + (Compliance Score × 30%)
                      + (Operational Accuracy × 30%)
    """
    __tablename__ = "kpi_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    role_at_time = Column(String(50), nullable=False)

    # Targets
    monthly_target = Column(Float, default=0)
    monthly_target_description = Column(Text, nullable=True)
    weight_percentage = Column(JSON, default=dict)
    # e.g. {"revenue": 40, "compliance": 30, "operational": 30}

    # Scores (0–100)
    revenue_achievement = Column(Float, default=0)
    compliance_score = Column(Float, default=0)
    operational_accuracy = Column(Float, default=0)

    # Calculated
    performance_score = Column(Float, default=0)
    accountability_index = Column(Float, default=0)

    # Detailed breakdown
    kpi_details = Column(JSON, default=dict)
    # Role-specific metrics stored here

    # Management review
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    review_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    # Sync fields
    sync_status = Column(Enum(SyncStatus), default=SyncStatus.PENDING)
    device_id = Column(String(255), nullable=True)
    version = Column(Integer, default=1)
    last_modified = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="kpi_records", foreign_keys=[user_id])

    __table_args__ = (
        UniqueConstraint("user_id", "month", "year", name="uq_kpi_user_month_year"),
    )


class DepartmentTarget(Base):
    """Department-level monthly targets for aggregated dashboard."""
    __tablename__ = "department_targets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    department = Column(String(100), nullable=False)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    revenue_target = Column(Float, default=0)
    compliance_target = Column(Float, default=0)
    operational_target = Column(Float, default=0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint("department", "month", "year", name="uq_dept_target_month_year"),
    )

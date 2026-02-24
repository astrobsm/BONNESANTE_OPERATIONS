"""
Marketing & Customer Care models.
Covers: Campaigns, Customer Feedback, Escalations.
"""
import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Date,
    Enum, Text, JSON, ForeignKey
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.inventory import SyncStatus


class ComplaintStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    ESCALATED = "escalated"
    CLOSED = "closed"


class EscalationLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


# ─── Marketing Campaign ──────────────────────────────────────────────

class MarketingCampaign(Base):
    __tablename__ = "marketing_campaigns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    marketer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    budget = Column(Float, default=0)
    actual_cost = Column(Float, default=0)
    leads_generated = Column(Integer, default=0)
    conversions = Column(Integer, default=0)
    conversion_rate = Column(Float, default=0)
    revenue_impact = Column(Float, default=0)
    status = Column(String(50), default="planned")
    channels = Column(JSON, default=list)  # ["social", "email", "print", ...]
    notes = Column(Text, nullable=True)

    # Sync fields
    sync_status = Column(Enum(SyncStatus), default=SyncStatus.PENDING)
    device_id = Column(String(255), nullable=True)
    version = Column(Integer, default=1)
    last_modified = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


# ─── Customer Feedback / Complaint ────────────────────────────────────

class CustomerFeedback(Base):
    __tablename__ = "customer_feedback"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=True)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    complaint_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(Enum(ComplaintStatus), default=ComplaintStatus.OPEN, nullable=False)
    escalation_level = Column(Enum(EscalationLevel), default=EscalationLevel.LOW)
    response_time_hours = Column(Float, nullable=True)
    resolution_time_hours = Column(Float, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    satisfaction_rating = Column(Integer, nullable=True)  # 1–5

    # Sync fields
    sync_status = Column(Enum(SyncStatus), default=SyncStatus.PENDING)
    device_id = Column(String(255), nullable=True)
    version = Column(Integer, default=1)
    last_modified = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

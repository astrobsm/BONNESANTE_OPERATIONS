"""
Pydantic schemas for Marketing & Customer Care.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from uuid import UUID
from app.models.marketing import ComplaintStatus, EscalationLevel
from app.models.inventory import SyncStatus


# ─── Marketing Campaign ──────────────────────────────────────────────

class CampaignCreate(BaseModel):
    campaign_id: str
    name: str
    description: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    budget: float = 0
    channels: List[str] = []
    notes: Optional[str] = None
    device_id: Optional[str] = None


class CampaignUpdate(BaseModel):
    actual_cost: Optional[float] = None
    leads_generated: Optional[int] = None
    conversions: Optional[int] = None
    revenue_impact: Optional[float] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class CampaignOut(BaseModel):
    id: UUID
    campaign_id: str
    name: str
    description: Optional[str]
    marketer_id: UUID
    start_date: date
    end_date: Optional[date]
    budget: float
    actual_cost: float
    leads_generated: int
    conversions: int
    conversion_rate: float
    revenue_impact: float
    status: str
    channels: List[str]
    sync_status: SyncStatus
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Customer Feedback ───────────────────────────────────────────────

class FeedbackCreate(BaseModel):
    customer_id: Optional[UUID] = None
    complaint_type: str
    description: str
    escalation_level: EscalationLevel = EscalationLevel.LOW
    device_id: Optional[str] = None


class FeedbackUpdate(BaseModel):
    status: Optional[ComplaintStatus] = None
    escalation_level: Optional[EscalationLevel] = None
    resolution_notes: Optional[str] = None
    satisfaction_rating: Optional[int] = Field(None, ge=1, le=5)


class FeedbackOut(BaseModel):
    id: UUID
    ticket_id: str
    customer_id: Optional[UUID]
    assigned_to: Optional[UUID]
    complaint_type: str
    description: str
    status: ComplaintStatus
    escalation_level: EscalationLevel
    response_time_hours: Optional[float]
    resolution_time_hours: Optional[float]
    resolution_notes: Optional[str]
    satisfaction_rating: Optional[int]
    sync_status: SyncStatus
    created_at: datetime

    model_config = {"from_attributes": True}

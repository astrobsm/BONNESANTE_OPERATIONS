"""
Pydantic schemas for KPI & Dashboard.
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID
from app.models.inventory import SyncStatus


class KPIRecordCreate(BaseModel):
    user_id: UUID
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2020)
    monthly_target: float = 0
    monthly_target_description: Optional[str] = None
    weight_percentage: Dict[str, float] = {"revenue": 40, "compliance": 30, "operational": 30}
    revenue_achievement: float = Field(0, ge=0, le=100)
    compliance_score: float = Field(0, ge=0, le=100)
    operational_accuracy: float = Field(0, ge=0, le=100)
    kpi_details: Dict[str, Any] = {}


class KPIRecordOut(BaseModel):
    id: UUID
    user_id: UUID
    month: int
    year: int
    role_at_time: str
    monthly_target: float
    weight_percentage: Dict[str, float]
    revenue_achievement: float
    compliance_score: float
    operational_accuracy: float
    performance_score: float
    accountability_index: float
    kpi_details: Dict[str, Any]
    reviewed_by: Optional[UUID]
    review_notes: Optional[str]
    sync_status: SyncStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class DepartmentTargetCreate(BaseModel):
    department: str
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2020)
    revenue_target: float = 0
    compliance_target: float = 0
    operational_target: float = 0
    notes: Optional[str] = None


class DepartmentTargetOut(BaseModel):
    id: UUID
    department: str
    month: int
    year: int
    revenue_target: float
    compliance_target: float
    operational_target: float
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Dashboard Aggregates ────────────────────────────────────────────

class MonthlyDashboard(BaseModel):
    month: int
    year: int
    individual_kpis: List[KPIRecordOut]
    department_summaries: List[Dict[str, Any]]
    inventory_reconciliation: Dict[str, Any]
    revenue_analytics: Dict[str, Any]
    risk_alerts: List[Dict[str, Any]]
    generated_at: datetime


class SyncStatusPayload(BaseModel):
    table_name: str
    records: List[Dict[str, Any]]
    device_id: str
    last_sync_timestamp: Optional[datetime] = None

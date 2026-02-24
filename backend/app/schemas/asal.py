"""
Pydantic schemas for ASAL Core Engine — Daily Logs, Weekly Plans, Weekly Reports.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from uuid import UUID
from app.models.asal import LogStatus, PlanStatus, ReportStatus
from app.models.inventory import SyncStatus


# ─── Daily Log ────────────────────────────────────────────────────────

class DailyLogCreate(BaseModel):
    log_date: date
    activities: List[Dict[str, Any]]  # [{task, duration, outcome}, ...]
    key_achievements: Optional[str] = None
    challenges: Optional[str] = None
    tomorrow_plan: Optional[str] = None
    hours_worked: float = 8
    device_id: Optional[str] = None


class DailyLogOut(BaseModel):
    id: UUID
    user_id: UUID
    log_date: date
    role_at_time: str
    activities: List[Dict[str, Any]]
    key_achievements: Optional[str]
    challenges: Optional[str]
    tomorrow_plan: Optional[str]
    hours_worked: float
    status: LogStatus
    submitted_at: Optional[datetime]
    sync_status: SyncStatus
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Weekly Plan (Sunday 7PM) ────────────────────────────────────────

class WeeklyObjective(BaseModel):
    title: str
    description: Optional[str] = None
    measurable_target: Optional[str] = None
    timeline: Optional[str] = None
    resources_needed: Optional[str] = None


class WeeklyPlanCreate(BaseModel):
    week_start_date: date  # Monday of the target week
    objectives: List[WeeklyObjective]
    kpi_targets: Dict[str, Any] = {}
    resource_requests: List[str] = []
    time_bound_actions: List[Dict[str, Any]] = []
    device_id: Optional[str] = None


class WeeklyPlanOut(BaseModel):
    id: UUID
    user_id: UUID
    week_start_date: date
    week_number: int
    year: int
    objectives: List[Dict[str, Any]]
    kpi_targets: Dict[str, Any]
    resource_requests: List[str]
    time_bound_actions: List[Dict[str, Any]]
    status: PlanStatus
    submitted_at: Optional[datetime]
    deadline: datetime
    sync_status: SyncStatus
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Weekly Report (Friday 7PM) ──────────────────────────────────────

class ObjectiveResult(BaseModel):
    objective_title: str
    achieved: bool
    evidence: Optional[str] = None
    percentage_complete: float = 0


class WeeklyReportCreate(BaseModel):
    weekly_plan_id: Optional[UUID] = None
    week_start_date: date
    objectives_achieved: List[ObjectiveResult]
    kpi_evidence: Dict[str, Any] = {}
    financial_impact: Dict[str, Any] = {}
    inventory_impact: Dict[str, Any] = {}
    deviation_explanation: Optional[str] = None
    lessons_learned: Optional[str] = None
    next_week_adjustments: Optional[str] = None
    device_id: Optional[str] = None


class WeeklyReportOut(BaseModel):
    id: UUID
    user_id: UUID
    weekly_plan_id: Optional[UUID]
    week_start_date: date
    week_number: int
    year: int
    objectives_achieved: List[Dict[str, Any]]
    kpi_evidence: Dict[str, Any]
    financial_impact: Dict[str, Any]
    inventory_impact: Dict[str, Any]
    deviation_explanation: Optional[str]
    lessons_learned: Optional[str]
    status: ReportStatus
    submitted_at: Optional[datetime]
    deadline: datetime
    sync_status: SyncStatus
    created_at: datetime

    model_config = {"from_attributes": True}

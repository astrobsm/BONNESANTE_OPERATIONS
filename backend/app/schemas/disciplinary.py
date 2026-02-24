"""
Pydantic schemas for Disciplinary & Payroll.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from app.models.disciplinary import QueryType, DisciplinaryStatus, PayrollStatus
from app.models.inventory import SyncStatus


# ─── Disciplinary ────────────────────────────────────────────────────

class DisciplinaryRecordOut(BaseModel):
    id: UUID
    record_id: str
    user_id: UUID
    query_type: QueryType
    description: str
    status: DisciplinaryStatus
    auto_generated: bool
    consecutive_count: int
    payroll_deduction_percentage: float
    deduction_applied: bool
    privileges_locked: bool
    locked_privileges: List[str]
    appeal_submitted: bool
    appeal_text: Optional[str]
    requires_management_confirmation: bool
    management_confirmed: bool
    acknowledged_at: Optional[datetime]
    sync_status: SyncStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class DisciplinaryAppeal(BaseModel):
    appeal_text: str
    digital_signature: str


class DisciplinaryAcknowledge(BaseModel):
    digital_signature: str


class ManagementConfirmation(BaseModel):
    confirmed: bool
    notes: Optional[str] = None


# ─── Payroll ──────────────────────────────────────────────────────────

class PayrollCalculateRequest(BaseModel):
    user_id: UUID
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2020)
    salary_base: float = Field(..., ge=0)
    kpi_bonus: float = 0
    call_allowance: float = 0
    transport_allowance: float = 0
    other_allowances: float = 0
    tax_deduction: float = 0
    insurance_deduction: float = 0
    other_deductions: float = 0
    notes: Optional[str] = None


class PayrollOut(BaseModel):
    id: UUID
    payroll_id: str
    user_id: UUID
    month: int
    year: int
    salary_base: float
    kpi_bonus: float
    call_allowance: float
    transport_allowance: float
    other_allowances: float
    compliance_deduction: float
    compliance_deduction_pct: float
    tax_deduction: float
    insurance_deduction: float
    other_deductions: float
    deduction_triggers: List[Dict[str, Any]]
    gross_pay: float
    total_deductions: float
    net_pay: float
    status: PayrollStatus
    approved_by: Optional[UUID]
    approved_at: Optional[datetime]
    paid_at: Optional[datetime]
    sync_status: SyncStatus
    created_at: datetime

    model_config = {"from_attributes": True}

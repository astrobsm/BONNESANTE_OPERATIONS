"""
Pydantic schemas for Inventory & Production.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from uuid import UUID
from app.models.inventory import TransferStatus, SyncStatus


# ─── Raw Material ─────────────────────────────────────────────────────

class RawMaterialCreate(BaseModel):
    item_id: str
    name: str
    batch_number: str
    supplier: str
    quantity: float = Field(..., ge=0)
    unit: str = "kg"
    cost_per_unit: float = Field(..., ge=0)
    total_cost: float = Field(..., ge=0)
    expiry_date: Optional[date] = None
    date_received: date
    warehouse_location: Optional[str] = None
    minimum_stock_level: float = 0
    notes: Optional[str] = None
    device_id: Optional[str] = None


class RawMaterialUpdate(BaseModel):
    quantity: Optional[float] = Field(None, ge=0)
    warehouse_location: Optional[str] = None
    minimum_stock_level: Optional[float] = None
    notes: Optional[str] = None


class RawMaterialOut(BaseModel):
    id: UUID
    item_id: str
    name: str
    batch_number: str
    supplier: str
    quantity: float
    unit: str
    cost_per_unit: float
    total_cost: float
    expiry_date: Optional[date]
    date_received: date
    warehouse_location: Optional[str]
    minimum_stock_level: float
    sync_status: SyncStatus
    version: int
    last_modified: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Production ───────────────────────────────────────────────────────

class ProductionRawMaterialInput(BaseModel):
    raw_material_id: UUID
    quantity_used: float = Field(..., gt=0)


class ProductionLogCreate(BaseModel):
    production_id: str
    product_name: str
    output_quantity: float = Field(..., ge=0)
    output_unit: str = "units"
    wastage_quantity: float = 0
    machine_used: Optional[str] = None
    supervisor_signature: Optional[str] = None
    production_date: date
    shift: Optional[str] = None
    notes: Optional[str] = None
    raw_materials_used: List[ProductionRawMaterialInput] = []
    device_id: Optional[str] = None


class ProductionLogOut(BaseModel):
    id: UUID
    production_id: str
    product_name: str
    output_quantity: float
    output_unit: str
    wastage_quantity: float
    wastage_percentage: float
    machine_used: Optional[str]
    supervisor_id: UUID
    production_date: date
    shift: Optional[str]
    sync_status: SyncStatus
    version: int
    last_modified: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Finished Goods ──────────────────────────────────────────────────

class FinishedGoodCreate(BaseModel):
    product_id: str
    name: str
    batch_number: str
    quantity: float = Field(..., ge=0)
    unit: str = "units"
    production_log_id: Optional[UUID] = None
    warehouse_location: Optional[str] = None
    unit_cost: float = 0
    unit_price: float = 0
    minimum_stock_level: float = 0
    device_id: Optional[str] = None


class FinishedGoodOut(BaseModel):
    id: UUID
    product_id: str
    name: str
    batch_number: str
    quantity: float
    unit: str
    available_balance: float
    unit_cost: float
    unit_price: float
    sync_status: SyncStatus
    version: int
    last_modified: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Inventory Transfer (Dual Auth) ──────────────────────────────────

class TransferInitiate(BaseModel):
    finished_good_id: UUID
    quantity: float = Field(..., gt=0)
    initiator_signature: Optional[str] = None
    notes: Optional[str] = None
    device_id: Optional[str] = None


class TransferApproval(BaseModel):
    approved: bool
    approver_signature: Optional[str] = None
    rejection_reason: Optional[str] = None


class TransferOut(BaseModel):
    id: UUID
    transfer_id: str
    finished_good_id: UUID
    quantity: float
    status: TransferStatus
    initiated_by: UUID
    initiated_at: datetime
    approved_by: Optional[UUID]
    approved_at: Optional[datetime]
    rejection_reason: Optional[str]
    sync_status: SyncStatus
    version: int
    last_modified: datetime
    created_at: datetime

    model_config = {"from_attributes": True}

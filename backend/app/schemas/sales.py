"""
Pydantic schemas for Sales module.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from uuid import UUID
from app.models.sales import OrderStatus, PaymentStatus, CustomerRiskScore
from app.models.inventory import SyncStatus


# ─── Customer Category ───────────────────────────────────────────────

class CustomerCategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    credit_limit: float = 0
    payment_cycle_days: int = 30
    default_risk_score: CustomerRiskScore = CustomerRiskScore.MEDIUM


class CustomerCategoryOut(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    revenue_contribution: float
    credit_limit: float
    payment_cycle_days: int
    default_risk_score: CustomerRiskScore
    is_active: bool

    model_config = {"from_attributes": True}


# ─── Customer ────────────────────────────────────────────────────────

class CustomerCreate(BaseModel):
    customer_id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    category_id: Optional[UUID] = None


class CustomerOut(BaseModel):
    id: UUID
    customer_id: str
    name: str
    email: Optional[str]
    phone: Optional[str]
    category_id: Optional[UUID]
    credit_exposure: float
    total_revenue: float
    risk_score: CustomerRiskScore
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Order ────────────────────────────────────────────────────────────

class OrderItemCreate(BaseModel):
    finished_good_id: UUID
    quantity: float = Field(..., gt=0)
    unit_price: float = Field(..., ge=0)


class OrderCreate(BaseModel):
    customer_id: UUID
    items: List[OrderItemCreate]
    delivery_address: Optional[str] = None
    delivery_date: Optional[datetime] = None
    notes: Optional[str] = None
    device_id: Optional[str] = None


class OrderItemOut(BaseModel):
    id: UUID
    finished_good_id: UUID
    quantity: float
    unit_price: float
    total_price: float

    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    id: UUID
    tracking_id: str
    customer_id: UUID
    sales_manager_id: UUID
    order_date: datetime
    status: OrderStatus
    payment_status: PaymentStatus
    subtotal: float
    tax: float
    discount: float
    total_amount: float
    amount_paid: float
    balance_due: float
    items: List[OrderItemOut] = []
    sync_status: SyncStatus
    version: int
    created_at: datetime

    model_config = {"from_attributes": True}


class OrderStatusUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    payment_status: Optional[PaymentStatus] = None
    amount_paid: Optional[float] = None


# ─── Sales Daily Log ─────────────────────────────────────────────────

class SalesDailyLogCreate(BaseModel):
    log_date: date
    opening_stock: Dict[str, Any] = {}
    orders_received: int = 0
    orders_fulfilled: int = 0
    pending_deliveries: int = 0
    receivables_balance: float = 0
    closing_stock: Dict[str, Any] = {}
    notes: Optional[str] = None
    device_id: Optional[str] = None


class SalesDailyLogOut(BaseModel):
    id: UUID
    sales_manager_id: UUID
    log_date: date
    opening_stock: Dict[str, Any]
    orders_received: int
    orders_fulfilled: int
    pending_deliveries: int
    receivables_balance: float
    closing_stock: Dict[str, Any]
    is_validated: bool
    sync_status: SyncStatus
    created_at: datetime

    model_config = {"from_attributes": True}

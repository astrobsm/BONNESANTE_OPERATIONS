"""
Sales Management models.
Covers: Orders, Customer Categories, Sales Daily Logs.
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


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    DISPATCHED = "dispatched"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    RETURNED = "returned"


class PaymentStatus(str, enum.Enum):
    UNPAID = "unpaid"
    PARTIAL = "partial"
    PAID = "paid"
    OVERDUE = "overdue"
    REFUNDED = "refunded"


class CustomerRiskScore(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


# ─── Customer Category ───────────────────────────────────────────────

class CustomerCategory(Base):
    __tablename__ = "customer_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    revenue_contribution = Column(Float, default=0)
    credit_limit = Column(Float, default=0)
    payment_cycle_days = Column(Integer, default=30)
    default_risk_score = Column(Enum(CustomerRiskScore), default=CustomerRiskScore.MEDIUM)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    customers = relationship("Customer", back_populates="category")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("customer_categories.id"), nullable=True)
    credit_exposure = Column(Float, default=0)
    total_revenue = Column(Float, default=0)
    risk_score = Column(Enum(CustomerRiskScore), default=CustomerRiskScore.MEDIUM)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    category = relationship("CustomerCategory", back_populates="customers")
    orders = relationship("Order", back_populates="customer")


# ─── Order ────────────────────────────────────────────────────────────

class Order(Base):
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tracking_id = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False)
    sales_manager_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    order_date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING, nullable=False)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.UNPAID, nullable=False)
    subtotal = Column(Float, default=0)
    tax = Column(Float, default=0)
    discount = Column(Float, default=0)
    total_amount = Column(Float, default=0)
    amount_paid = Column(Float, default=0)
    balance_due = Column(Float, default=0)
    delivery_address = Column(Text, nullable=True)
    delivery_date = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)

    # Sync fields
    sync_status = Column(Enum(SyncStatus), default=SyncStatus.PENDING)
    device_id = Column(String(255), nullable=True)
    version = Column(Integer, default=1)
    last_modified = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    customer = relationship("Customer", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("total_amount >= 0", name="order_total_positive"),
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    finished_good_id = Column(UUID(as_uuid=True), ForeignKey("finished_goods.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")

    __table_args__ = (
        CheckConstraint("quantity > 0", name="order_item_qty_positive"),
    )


# ─── Sales Daily Log ─────────────────────────────────────────────────

class SalesDailyLog(Base):
    __tablename__ = "sales_daily_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sales_manager_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    log_date = Column(Date, nullable=False, index=True)
    opening_stock = Column(JSON, default=dict)       # {product_id: qty, ...}
    orders_received = Column(Integer, default=0)
    orders_fulfilled = Column(Integer, default=0)
    pending_deliveries = Column(Integer, default=0)
    receivables_balance = Column(Float, default=0)
    closing_stock = Column(JSON, default=dict)
    notes = Column(Text, nullable=True)
    is_validated = Column(Boolean, default=False)     # Auto-validated by system

    # Sync fields
    sync_status = Column(Enum(SyncStatus), default=SyncStatus.PENDING)
    device_id = Column(String(255), nullable=True)
    version = Column(Integer, default=1)
    last_modified = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

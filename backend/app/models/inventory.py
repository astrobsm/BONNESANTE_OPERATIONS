"""
Production & Warehouse Management models.
Covers: Raw Material Warehouse, Production Log, Finished Goods, Transfers.
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


class TransferStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"


class SyncStatus(str, enum.Enum):
    PENDING = "pending"
    SYNCED = "synced"
    CONFLICT = "conflict"


# ─── Raw Material Warehouse ───────────────────────────────────────────

class RawMaterial(Base):
    __tablename__ = "raw_materials"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    batch_number = Column(String(100), nullable=False, index=True)
    supplier = Column(String(255), nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False, default="kg")
    cost_per_unit = Column(Float, nullable=False)
    total_cost = Column(Float, nullable=False)
    expiry_date = Column(Date, nullable=True)
    date_received = Column(Date, nullable=False)
    warehouse_location = Column(String(100), nullable=True)
    minimum_stock_level = Column(Float, default=0)
    notes = Column(Text, nullable=True)

    # Sync fields
    sync_status = Column(Enum(SyncStatus), default=SyncStatus.PENDING)
    device_id = Column(String(255), nullable=True)
    version = Column(Integer, default=1)
    last_modified = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    production_usages = relationship("ProductionRawMaterial", back_populates="raw_material")

    __table_args__ = (
        CheckConstraint("quantity >= 0", name="raw_material_qty_positive"),
        CheckConstraint("cost_per_unit >= 0", name="raw_material_cost_positive"),
    )


# ─── Production Log ──────────────────────────────────────────────────

class ProductionLog(Base):
    __tablename__ = "production_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    production_id = Column(String(50), unique=True, nullable=False, index=True)
    product_name = Column(String(255), nullable=False)
    output_quantity = Column(Float, nullable=False)
    output_unit = Column(String(50), default="units")
    wastage_quantity = Column(Float, default=0)
    wastage_percentage = Column(Float, default=0)
    machine_used = Column(String(255), nullable=True)
    supervisor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    supervisor_signature = Column(Text, nullable=True)  # Digital signature hash
    production_date = Column(Date, nullable=False)
    shift = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)

    # Sync fields
    sync_status = Column(Enum(SyncStatus), default=SyncStatus.PENDING)
    device_id = Column(String(255), nullable=True)
    version = Column(Integer, default=1)
    last_modified = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    raw_materials_used = relationship("ProductionRawMaterial", back_populates="production_log")
    finished_goods = relationship("FinishedGood", back_populates="production_log")

    __table_args__ = (
        CheckConstraint("output_quantity >= 0", name="production_output_positive"),
        CheckConstraint("wastage_quantity >= 0", name="production_wastage_positive"),
    )


class ProductionRawMaterial(Base):
    """Junction: raw materials consumed in a production run."""
    __tablename__ = "production_raw_materials"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    production_log_id = Column(UUID(as_uuid=True), ForeignKey("production_logs.id"), nullable=False)
    raw_material_id = Column(UUID(as_uuid=True), ForeignKey("raw_materials.id"), nullable=False)
    quantity_used = Column(Float, nullable=False)

    production_log = relationship("ProductionLog", back_populates="raw_materials_used")
    raw_material = relationship("RawMaterial", back_populates="production_usages")


# ─── Finished Goods Warehouse ────────────────────────────────────────

class FinishedGood(Base):
    __tablename__ = "finished_goods"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    batch_number = Column(String(100), nullable=False, index=True)
    quantity = Column(Float, nullable=False)
    unit = Column(String(50), default="units")
    available_balance = Column(Float, nullable=False)
    production_log_id = Column(UUID(as_uuid=True), ForeignKey("production_logs.id"), nullable=True)
    warehouse_location = Column(String(100), nullable=True)
    unit_cost = Column(Float, default=0)
    unit_price = Column(Float, default=0)
    minimum_stock_level = Column(Float, default=0)

    # Sync fields
    sync_status = Column(Enum(SyncStatus), default=SyncStatus.PENDING)
    device_id = Column(String(255), nullable=True)
    version = Column(Integer, default=1)
    last_modified = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    production_log = relationship("ProductionLog", back_populates="finished_goods")

    __table_args__ = (
        CheckConstraint("quantity >= 0", name="finished_good_qty_positive"),
        CheckConstraint("available_balance >= 0", name="finished_good_balance_positive"),
    )


# ─── Dual-Auth Inventory Transfer ────────────────────────────────────

class InventoryTransfer(Base):
    """
    Transfer from Production Warehouse → Sales Warehouse.
    Requires dual authentication: Sales Manager initiates, Factory Supervisor approves.
    """
    __tablename__ = "inventory_transfers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transfer_id = Column(String(50), unique=True, nullable=False, index=True)
    finished_good_id = Column(UUID(as_uuid=True), ForeignKey("finished_goods.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    status = Column(Enum(TransferStatus), default=TransferStatus.PENDING, nullable=False)

    # Dual authentication
    initiated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    initiated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    initiator_signature = Column(Text, nullable=True)

    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    approver_signature = Column(Text, nullable=True)

    rejection_reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    # Sync fields
    sync_status = Column(Enum(SyncStatus), default=SyncStatus.PENDING)
    device_id = Column(String(255), nullable=True)
    version = Column(Integer, default=1)
    last_modified = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        CheckConstraint("quantity > 0", name="transfer_qty_positive"),
    )

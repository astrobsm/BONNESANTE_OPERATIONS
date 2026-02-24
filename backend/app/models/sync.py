"""
Sync Engine model — tracks device sync state and conflict resolution.
"""
import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime,
    Enum, Text, JSON, ForeignKey
)
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base


class ConflictResolution(str, enum.Enum):
    LAST_WRITE_WINS = "last_write_wins"
    MANUAL_REVIEW = "manual_review"
    SERVER_WINS = "server_wins"
    CLIENT_WINS = "client_wins"


class SyncEvent(Base):
    """Tracks every sync push/pull for audit and debugging."""
    __tablename__ = "sync_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    device_id = Column(String(255), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    direction = Column(String(10), nullable=False)  # "push" or "pull"
    table_name = Column(String(100), nullable=False)
    records_synced = Column(Integer, default=0)
    conflicts_detected = Column(Integer, default=0)
    conflicts_resolved = Column(Integer, default=0)
    errors = Column(JSON, default=list)
    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime(timezone=True), nullable=True)
    success = Column(Boolean, default=True)


class SyncConflict(Base):
    """Records that had version conflicts during sync."""
    __tablename__ = "sync_conflicts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sync_event_id = Column(UUID(as_uuid=True), ForeignKey("sync_events.id"), nullable=False)
    table_name = Column(String(100), nullable=False)
    record_id = Column(String(255), nullable=False)
    client_version = Column(Integer, nullable=False)
    server_version = Column(Integer, nullable=False)
    client_data = Column(JSON, nullable=False)
    server_data = Column(JSON, nullable=False)
    resolution = Column(Enum(ConflictResolution), nullable=True)
    resolved_data = Column(JSON, nullable=True)
    resolved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    is_financial = Column(Boolean, default=False)  # Financial/inventory = manual review
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class DeviceRegistration(Base):
    """Track registered devices for security binding."""
    __tablename__ = "device_registrations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    device_id = Column(String(255), unique=True, nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    device_name = Column(String(255), nullable=True)
    device_type = Column(String(100), nullable=True)  # mobile, tablet, desktop
    os_info = Column(String(255), nullable=True)
    browser_info = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    last_sync_at = Column(DateTime(timezone=True), nullable=True)
    registered_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    revoked_at = Column(DateTime(timezone=True), nullable=True)

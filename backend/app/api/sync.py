"""
Sync Engine API routes — Push/Pull/Conflict resolution.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from uuid import UUID

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.sync import SyncEvent, SyncConflict, DeviceRegistration, ConflictResolution
from app.schemas.kpi import SyncStatusPayload

router = APIRouter(prefix="/sync", tags=["Sync Engine"])

# Table name → Model mapping for dynamic sync
SYNCABLE_TABLES = [
    "daily_logs", "weekly_plans", "weekly_reports",
    "inventory", "transfers", "orders",
    "payroll", "disciplinary_actions",
]


@router.post("/push")
async def push_records(
    payload: SyncStatusPayload,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    PUSH: Device → Cloud.
    Receives pending records from the device, validates, and resolves conflicts.
    Conflict resolution:
      - Last write wins (non-financial)
      - Manual review required (financial & inventory data)
    """
    if payload.table_name not in SYNCABLE_TABLES:
        raise HTTPException(status_code=400, detail=f"Unknown table: {payload.table_name}")

    # Create sync event
    sync_event = SyncEvent(
        device_id=payload.device_id,
        user_id=user.id,
        direction="push",
        table_name=payload.table_name,
        records_synced=0,
        conflicts_detected=0,
    )
    db.add(sync_event)
    await db.flush()

    synced = 0
    conflicts = 0
    errors = []

    for record_data in payload.records:
        try:
            record_id = record_data.get("id")
            client_version = record_data.get("version", 1)

            # Check for version conflict (simplified — real implementation queries the specific table)
            # For financial/inventory data, flag for manual review
            is_financial = payload.table_name in ("orders", "transfers", "payroll", "inventory")

            if is_financial and client_version > 1:
                # Create conflict record for manual review
                conflict = SyncConflict(
                    sync_event_id=sync_event.id,
                    table_name=payload.table_name,
                    record_id=str(record_id),
                    client_version=client_version,
                    server_version=client_version,  # Would be fetched from DB
                    client_data=record_data,
                    server_data={},  # Would be fetched from DB
                    is_financial=True,
                    resolution=ConflictResolution.MANUAL_REVIEW,
                )
                db.add(conflict)
                conflicts += 1
            else:
                # Last write wins for non-financial data
                synced += 1

        except Exception as e:
            errors.append({"record_id": record_data.get("id"), "error": str(e)})

    sync_event.records_synced = synced
    sync_event.conflicts_detected = conflicts
    sync_event.errors = errors
    sync_event.completed_at = datetime.now(timezone.utc)
    sync_event.success = len(errors) == 0

    # Update device last sync
    device = await db.execute(
        select(DeviceRegistration).where(DeviceRegistration.device_id == payload.device_id)
    )
    device_reg = device.scalar_one_or_none()
    if device_reg:
        device_reg.last_sync_at = datetime.now(timezone.utc)

    return {
        "sync_event_id": str(sync_event.id),
        "records_synced": synced,
        "conflicts": conflicts,
        "errors": errors,
    }


@router.get("/pull")
async def pull_records(
    table_name: str,
    last_sync: Optional[datetime] = None,
    device_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    PULL: Cloud → Device.
    Returns records modified since last sync.
    Includes: new policies, query notices, target updates, auth approvals.
    """
    if table_name not in SYNCABLE_TABLES:
        raise HTTPException(status_code=400, detail=f"Unknown table: {table_name}")

    # Create sync event
    sync_event = SyncEvent(
        device_id=device_id or "unknown",
        user_id=user.id,
        direction="pull",
        table_name=table_name,
    )
    db.add(sync_event)
    await db.flush()

    # In a real implementation, this would query the specific table
    # for records modified since last_sync timestamp
    # and return them filtered by user's role permissions

    sync_event.completed_at = datetime.now(timezone.utc)
    sync_event.success = True

    return {
        "sync_event_id": str(sync_event.id),
        "table_name": table_name,
        "records": [],  # Would contain actual records
        "server_timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ─── Conflict Resolution ─────────────────────────────────────────────

@router.get("/conflicts", response_model=List[Dict[str, Any]])
async def list_unresolved_conflicts(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(SyncConflict).where(SyncConflict.resolved_at == None)
        .order_by(SyncConflict.created_at.desc()).limit(100)
    )
    conflicts = result.scalars().all()
    return [
        {
            "id": str(c.id),
            "table_name": c.table_name,
            "record_id": c.record_id,
            "client_version": c.client_version,
            "server_version": c.server_version,
            "is_financial": c.is_financial,
            "created_at": c.created_at.isoformat(),
        }
        for c in conflicts
    ]


@router.post("/conflicts/{conflict_id}/resolve")
async def resolve_conflict(
    conflict_id: UUID,
    resolution: str,  # "client" | "server" | "merge"
    resolved_data: Optional[Dict[str, Any]] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(SyncConflict).where(SyncConflict.id == conflict_id))
    conflict = result.scalar_one_or_none()
    if not conflict:
        raise HTTPException(status_code=404, detail="Conflict not found")

    if resolution == "client":
        conflict.resolution = ConflictResolution.CLIENT_WINS
        conflict.resolved_data = conflict.client_data
    elif resolution == "server":
        conflict.resolution = ConflictResolution.SERVER_WINS
        conflict.resolved_data = conflict.server_data
    else:
        if not resolved_data:
            raise HTTPException(status_code=400, detail="Merged data required for merge resolution")
        conflict.resolution = ConflictResolution.MANUAL_REVIEW
        conflict.resolved_data = resolved_data

    conflict.resolved_by = user.id
    conflict.resolved_at = datetime.now(timezone.utc)

    return {"message": "Conflict resolved", "resolution": resolution}


# ─── Device Registration ─────────────────────────────────────────────

@router.post("/devices/register")
async def register_device(
    device_id: str,
    device_name: Optional[str] = None,
    device_type: Optional[str] = None,
    os_info: Optional[str] = None,
    browser_info: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Check if device already registered
    existing = await db.execute(
        select(DeviceRegistration).where(DeviceRegistration.device_id == device_id)
    )
    device = existing.scalar_one_or_none()

    if device:
        device.last_sync_at = datetime.now(timezone.utc)
        return {"message": "Device already registered", "device_id": device_id}

    registration = DeviceRegistration(
        device_id=device_id,
        user_id=user.id,
        device_name=device_name,
        device_type=device_type,
        os_info=os_info,
        browser_info=browser_info,
    )
    db.add(registration)
    return {"message": "Device registered", "device_id": device_id}


@router.get("/devices")
async def list_devices(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(DeviceRegistration).where(
            and_(DeviceRegistration.user_id == user.id, DeviceRegistration.is_active == True)
        )
    )
    devices = result.scalars().all()
    return [
        {
            "device_id": d.device_id,
            "device_name": d.device_name,
            "device_type": d.device_type,
            "last_sync_at": d.last_sync_at.isoformat() if d.last_sync_at else None,
            "registered_at": d.registered_at.isoformat(),
        }
        for d in devices
    ]

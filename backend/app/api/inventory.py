"""
Inventory & Production Management API routes.
Handles: Raw Materials, Production Logs, Finished Goods, Dual-Auth Transfers.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID, uuid4

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User, UserRole, AuditLog
from app.models.inventory import (
    RawMaterial, ProductionLog, ProductionRawMaterial,
    FinishedGood, InventoryTransfer, TransferStatus, SyncStatus,
)
from app.schemas.inventory import (
    RawMaterialCreate, RawMaterialUpdate, RawMaterialOut,
    ProductionLogCreate, ProductionLogOut,
    FinishedGoodCreate, FinishedGoodOut,
    TransferInitiate, TransferApproval, TransferOut,
)

router = APIRouter(prefix="/inventory", tags=["Inventory & Production"])


# ─── Raw Materials ────────────────────────────────────────────────────

@router.post("/raw-materials", response_model=RawMaterialOut, status_code=201)
async def create_raw_material(
    body: RawMaterialCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles([UserRole.FACTORY_SUPERVISOR, UserRole.ADMIN])),
):
    material = RawMaterial(**body.model_dump())
    db.add(material)
    await db.flush()

    db.add(AuditLog(
        user_id=user.id, action="CREATE_RAW_MATERIAL", resource_type="raw_material",
        resource_id=str(material.id), details={"item_id": body.item_id, "qty": body.quantity},
    ))

    return RawMaterialOut.model_validate(material)


@router.get("/raw-materials", response_model=List[RawMaterialOut])
async def list_raw_materials(
    page: int = 1, page_size: int = 50,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles([
        UserRole.FACTORY_SUPERVISOR, UserRole.ADMIN, UserRole.HR_MANAGEMENT
    ])),
):
    result = await db.execute(
        select(RawMaterial).order_by(RawMaterial.created_at.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )
    return [RawMaterialOut.model_validate(m) for m in result.scalars().all()]


@router.get("/raw-materials/{material_id}", response_model=RawMaterialOut)
async def get_raw_material(
    material_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(RawMaterial).where(RawMaterial.id == material_id))
    material = result.scalar_one_or_none()
    if not material:
        raise HTTPException(status_code=404, detail="Raw material not found")
    return RawMaterialOut.model_validate(material)


@router.put("/raw-materials/{material_id}", response_model=RawMaterialOut)
async def update_raw_material(
    material_id: UUID,
    body: RawMaterialUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles([UserRole.FACTORY_SUPERVISOR, UserRole.ADMIN])),
):
    result = await db.execute(select(RawMaterial).where(RawMaterial.id == material_id))
    material = result.scalar_one_or_none()
    if not material:
        raise HTTPException(status_code=404, detail="Raw material not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(material, field, value)
    material.version += 1

    db.add(AuditLog(
        user_id=user.id, action="UPDATE_RAW_MATERIAL", resource_type="raw_material",
        resource_id=str(material_id), details=body.model_dump(exclude_unset=True),
    ))

    return RawMaterialOut.model_validate(material)


# ─── Production Logs ─────────────────────────────────────────────────

@router.post("/production-logs", response_model=ProductionLogOut, status_code=201)
async def create_production_log(
    body: ProductionLogCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles([UserRole.FACTORY_SUPERVISOR, UserRole.ADMIN])),
):
    # Calculate wastage percentage
    total_input = sum(rm.quantity_used for rm in body.raw_materials_used)
    wastage_pct = (body.wastage_quantity / total_input * 100) if total_input > 0 else 0

    production = ProductionLog(
        production_id=body.production_id,
        product_name=body.product_name,
        output_quantity=body.output_quantity,
        output_unit=body.output_unit,
        wastage_quantity=body.wastage_quantity,
        wastage_percentage=round(wastage_pct, 2),
        machine_used=body.machine_used,
        supervisor_id=user.id,
        supervisor_signature=body.supervisor_signature,
        production_date=body.production_date,
        shift=body.shift,
        notes=body.notes,
        device_id=body.device_id,
    )
    db.add(production)
    await db.flush()

    # Link raw materials and deduct inventory
    for rm_input in body.raw_materials_used:
        # Verify and deduct raw material
        result = await db.execute(select(RawMaterial).where(RawMaterial.id == rm_input.raw_material_id))
        raw_mat = result.scalar_one_or_none()
        if not raw_mat:
            raise HTTPException(status_code=404, detail=f"Raw material {rm_input.raw_material_id} not found")
        if raw_mat.quantity < rm_input.quantity_used:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {raw_mat.name}: available={raw_mat.quantity}, requested={rm_input.quantity_used}"
            )
        raw_mat.quantity -= rm_input.quantity_used
        raw_mat.version += 1

        junction = ProductionRawMaterial(
            production_log_id=production.id,
            raw_material_id=rm_input.raw_material_id,
            quantity_used=rm_input.quantity_used,
        )
        db.add(junction)

    db.add(AuditLog(
        user_id=user.id, action="CREATE_PRODUCTION_LOG", resource_type="production_log",
        resource_id=str(production.id),
        details={"production_id": body.production_id, "output": body.output_quantity},
    ))

    return ProductionLogOut.model_validate(production)


@router.get("/production-logs", response_model=List[ProductionLogOut])
async def list_production_logs(
    page: int = 1, page_size: int = 50,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles([
        UserRole.FACTORY_SUPERVISOR, UserRole.ADMIN, UserRole.HR_MANAGEMENT
    ])),
):
    result = await db.execute(
        select(ProductionLog).order_by(ProductionLog.created_at.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )
    return [ProductionLogOut.model_validate(p) for p in result.scalars().all()]


# ─── Finished Goods ──────────────────────────────────────────────────

@router.post("/finished-goods", response_model=FinishedGoodOut, status_code=201)
async def create_finished_good(
    body: FinishedGoodCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles([UserRole.FACTORY_SUPERVISOR, UserRole.ADMIN])),
):
    fg = FinishedGood(
        **body.model_dump(),
        available_balance=body.quantity,
    )
    db.add(fg)
    await db.flush()

    db.add(AuditLog(
        user_id=user.id, action="CREATE_FINISHED_GOOD", resource_type="finished_good",
        resource_id=str(fg.id), details={"product_id": body.product_id, "qty": body.quantity},
    ))

    return FinishedGoodOut.model_validate(fg)


@router.get("/finished-goods", response_model=List[FinishedGoodOut])
async def list_finished_goods(
    page: int = 1, page_size: int = 50,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(FinishedGood).order_by(FinishedGood.created_at.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )
    return [FinishedGoodOut.model_validate(fg) for fg in result.scalars().all()]


# ─── Dual-Auth Inventory Transfer ────────────────────────────────────

@router.post("/transfers", response_model=TransferOut, status_code=201)
async def initiate_transfer(
    body: TransferInitiate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles([UserRole.SALES_MANAGER, UserRole.ADMIN])),
):
    """Sales Manager initiates digital requisition for stock transfer."""
    # Verify finished good exists and has sufficient stock
    result = await db.execute(select(FinishedGood).where(FinishedGood.id == body.finished_good_id))
    fg = result.scalar_one_or_none()
    if not fg:
        raise HTTPException(status_code=404, detail="Finished good not found")
    if fg.available_balance < body.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock: available={fg.available_balance}, requested={body.quantity}"
        )

    transfer_id = f"TRF-{uuid4().hex[:8].upper()}"
    transfer = InventoryTransfer(
        transfer_id=transfer_id,
        finished_good_id=body.finished_good_id,
        quantity=body.quantity,
        initiated_by=user.id,
        initiator_signature=body.initiator_signature,
        notes=body.notes,
        device_id=body.device_id,
    )
    db.add(transfer)
    await db.flush()

    db.add(AuditLog(
        user_id=user.id, action="INITIATE_TRANSFER", resource_type="inventory_transfer",
        resource_id=str(transfer.id),
        details={"transfer_id": transfer_id, "qty": body.quantity, "product": str(body.finished_good_id)},
    ))

    return TransferOut.model_validate(transfer)


@router.put("/transfers/{transfer_id}/approve", response_model=TransferOut)
async def approve_transfer(
    transfer_id: UUID,
    body: TransferApproval,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles([UserRole.FACTORY_SUPERVISOR, UserRole.ADMIN])),
):
    """Factory Supervisor approves or rejects the transfer. Dual authentication enforced."""
    result = await db.execute(select(InventoryTransfer).where(InventoryTransfer.id == transfer_id))
    transfer = result.scalar_one_or_none()
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found")
    if transfer.status != TransferStatus.PENDING:
        raise HTTPException(status_code=400, detail=f"Transfer already {transfer.status.value}")

    # Prevent self-approval
    if transfer.initiated_by == user.id:
        raise HTTPException(status_code=403, detail="Cannot approve your own transfer request")

    if body.approved:
        # Deduct inventory
        fg_result = await db.execute(select(FinishedGood).where(FinishedGood.id == transfer.finished_good_id))
        fg = fg_result.scalar_one_or_none()
        if not fg or fg.available_balance < transfer.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock for transfer")

        fg.available_balance -= transfer.quantity
        fg.version += 1
        transfer.status = TransferStatus.COMPLETED
        transfer.approved_by = user.id
        transfer.approved_at = datetime.now(timezone.utc)
        transfer.approver_signature = body.approver_signature
    else:
        transfer.status = TransferStatus.REJECTED
        transfer.approved_by = user.id
        transfer.approved_at = datetime.now(timezone.utc)
        transfer.rejection_reason = body.rejection_reason

    transfer.version += 1

    db.add(AuditLog(
        user_id=user.id,
        action="APPROVE_TRANSFER" if body.approved else "REJECT_TRANSFER",
        resource_type="inventory_transfer",
        resource_id=str(transfer.id),
        details={"approved": body.approved, "qty": transfer.quantity},
    ))

    return TransferOut.model_validate(transfer)


@router.get("/transfers", response_model=List[TransferOut])
async def list_transfers(
    status_filter: Optional[TransferStatus] = None,
    page: int = 1, page_size: int = 50,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles([
        UserRole.FACTORY_SUPERVISOR, UserRole.SALES_MANAGER, UserRole.ADMIN
    ])),
):
    query = select(InventoryTransfer)
    if status_filter:
        query = query.where(InventoryTransfer.status == status_filter)
    result = await db.execute(
        query.order_by(InventoryTransfer.created_at.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )
    return [TransferOut.model_validate(t) for t in result.scalars().all()]

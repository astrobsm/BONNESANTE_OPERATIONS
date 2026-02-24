"""
KPI & Management Dashboard API routes.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from datetime import datetime, timezone, date
from typing import List, Optional, Dict, Any
from uuid import UUID

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User, UserRole, AuditLog
from app.models.kpi import KPIRecord, DepartmentTarget
from app.models.sales import Order
from app.models.inventory import FinishedGood, RawMaterial
from app.models.disciplinary import DisciplinaryRecord, PayrollRecord
from app.schemas.kpi import (
    KPIRecordCreate, KPIRecordOut,
    DepartmentTargetCreate, DepartmentTargetOut,
    MonthlyDashboard,
)

router = APIRouter(prefix="/kpi", tags=["KPI & Dashboard"])


# ─── KPI Records ─────────────────────────────────────────────────────

@router.post("/records", response_model=KPIRecordOut, status_code=201)
async def create_kpi_record(
    body: KPIRecordCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.ADMIN, UserRole.HR_MANAGEMENT])),
):
    # Fetch user for role
    user_result = await db.execute(select(User).where(User.id == body.user_id))
    target_user = user_result.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Calculate performance score
    weights = body.weight_percentage
    performance_score = round(
        (body.revenue_achievement * weights.get("revenue", 40) / 100)
        + (body.compliance_score * weights.get("compliance", 30) / 100)
        + (body.operational_accuracy * weights.get("operational", 30) / 100),
        2,
    )

    # Accountability index: average of all three scores
    accountability_index = round(
        (body.revenue_achievement + body.compliance_score + body.operational_accuracy) / 3, 2
    )

    kpi = KPIRecord(
        user_id=body.user_id,
        month=body.month,
        year=body.year,
        role_at_time=target_user.role.value,
        monthly_target=body.monthly_target,
        monthly_target_description=body.monthly_target_description,
        weight_percentage=body.weight_percentage,
        revenue_achievement=body.revenue_achievement,
        compliance_score=body.compliance_score,
        operational_accuracy=body.operational_accuracy,
        performance_score=performance_score,
        accountability_index=accountability_index,
        kpi_details=body.kpi_details,
    )
    db.add(kpi)
    await db.flush()

    db.add(AuditLog(
        user_id=admin.id, action="CREATE_KPI_RECORD", resource_type="kpi",
        resource_id=str(kpi.id),
        details={"user_id": str(body.user_id), "score": performance_score},
    ))

    return KPIRecordOut.model_validate(kpi)


@router.get("/records", response_model=List[KPIRecordOut])
async def list_kpi_records(
    user_id: Optional[UUID] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    page: int = 1, page_size: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(KPIRecord)
    if current_user.role not in (UserRole.ADMIN, UserRole.HR_MANAGEMENT):
        query = query.where(KPIRecord.user_id == current_user.id)
    elif user_id:
        query = query.where(KPIRecord.user_id == user_id)
    if month:
        query = query.where(KPIRecord.month == month)
    if year:
        query = query.where(KPIRecord.year == year)

    result = await db.execute(
        query.order_by(KPIRecord.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    return [KPIRecordOut.model_validate(k) for k in result.scalars().all()]


# ─── Department Targets ──────────────────────────────────────────────

@router.post("/department-targets", response_model=DepartmentTargetOut, status_code=201)
async def create_department_target(
    body: DepartmentTargetCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.ADMIN, UserRole.HR_MANAGEMENT])),
):
    target = DepartmentTarget(**body.model_dump())
    db.add(target)
    await db.flush()
    return DepartmentTargetOut.model_validate(target)


@router.get("/department-targets", response_model=List[DepartmentTargetOut])
async def list_department_targets(
    month: Optional[int] = None, year: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles([UserRole.ADMIN, UserRole.HR_MANAGEMENT])),
):
    query = select(DepartmentTarget)
    if month:
        query = query.where(DepartmentTarget.month == month)
    if year:
        query = query.where(DepartmentTarget.year == year)
    result = await db.execute(query.order_by(DepartmentTarget.department))
    return [DepartmentTargetOut.model_validate(t) for t in result.scalars().all()]


# ─── Monthly Management Dashboard ────────────────────────────────────

@router.get("/dashboard/{month}/{year}", response_model=MonthlyDashboard)
async def get_monthly_dashboard(
    month: int, year: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.ADMIN, UserRole.HR_MANAGEMENT])),
):
    """
    Auto-generates monthly management dashboard (First Thursday):
    - Individual KPI slides
    - Department summaries
    - Inventory reconciliation
    - Revenue analytics
    - Risk alerts
    """
    # 1. Individual KPIs
    kpi_result = await db.execute(
        select(KPIRecord).where(and_(KPIRecord.month == month, KPIRecord.year == year))
    )
    kpi_records = [KPIRecordOut.model_validate(k) for k in kpi_result.scalars().all()]

    # 2. Department summaries
    dept_result = await db.execute(
        select(
            KPIRecord.role_at_time,
            func.avg(KPIRecord.performance_score).label("avg_score"),
            func.count(KPIRecord.id).label("staff_count"),
            func.avg(KPIRecord.revenue_achievement).label("avg_revenue"),
            func.avg(KPIRecord.compliance_score).label("avg_compliance"),
        ).where(and_(KPIRecord.month == month, KPIRecord.year == year))
        .group_by(KPIRecord.role_at_time)
    )
    dept_summaries = []
    for row in dept_result.all():
        dept_summaries.append({
            "department": row[0],
            "avg_performance_score": round(float(row[1] or 0), 2),
            "staff_count": row[2],
            "avg_revenue_achievement": round(float(row[3] or 0), 2),
            "avg_compliance_score": round(float(row[4] or 0), 2),
        })

    # 3. Inventory reconciliation
    raw_result = await db.execute(
        select(func.count(), func.sum(RawMaterial.total_cost)).select_from(RawMaterial)
    )
    raw_row = raw_result.one()
    fg_result = await db.execute(
        select(func.count(), func.sum(FinishedGood.available_balance)).select_from(FinishedGood)
    )
    fg_row = fg_result.one()

    inventory_recon = {
        "raw_materials": {"count": raw_row[0] or 0, "total_value": float(raw_row[1] or 0)},
        "finished_goods": {"count": fg_row[0] or 0, "total_available": float(fg_row[1] or 0)},
    }

    # 4. Revenue analytics
    month_start = datetime(year, month, 1, tzinfo=timezone.utc)
    if month == 12:
        month_end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        month_end = datetime(year, month + 1, 1, tzinfo=timezone.utc)

    rev_result = await db.execute(
        select(
            func.count(Order.id),
            func.sum(Order.total_amount),
            func.sum(Order.amount_paid),
            func.sum(Order.balance_due),
        ).where(and_(Order.order_date >= month_start, Order.order_date < month_end))
    )
    rev_row = rev_result.one()
    revenue_analytics = {
        "total_orders": rev_row[0] or 0,
        "total_revenue": float(rev_row[1] or 0),
        "total_collected": float(rev_row[2] or 0),
        "total_outstanding": float(rev_row[3] or 0),
    }

    # 5. Risk alerts
    risk_alerts = []

    # Low-performing staff
    for kpi in kpi_records:
        if kpi.performance_score < 50:
            risk_alerts.append({
                "type": "low_performance",
                "user_id": str(kpi.user_id),
                "score": kpi.performance_score,
                "severity": "high",
            })

    # Active disciplinary issues
    disc_result = await db.execute(
        select(func.count()).select_from(DisciplinaryRecord).where(
            DisciplinaryRecord.status.in_([
                DisciplinaryStatus.ISSUED.value,
                DisciplinaryStatus.ESCALATED.value,
            ])
        )
    )
    from app.models.disciplinary import DisciplinaryStatus
    active_disc = disc_result.scalar() or 0
    if active_disc > 0:
        risk_alerts.append({
            "type": "active_disciplinary",
            "count": active_disc,
            "severity": "medium",
        })

    return MonthlyDashboard(
        month=month,
        year=year,
        individual_kpis=kpi_records,
        department_summaries=dept_summaries,
        inventory_reconciliation=inventory_recon,
        revenue_analytics=revenue_analytics,
        risk_alerts=risk_alerts,
        generated_at=datetime.now(timezone.utc),
    )

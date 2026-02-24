"""
Disciplinary Automation & Payroll API routes.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from datetime import datetime, timezone, date, timedelta
from typing import List, Optional
from uuid import UUID, uuid4

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User, UserRole, AuditLog
from app.models.asal import DailyLog, WeeklyPlan, WeeklyReport, PlanStatus, ReportStatus
from app.models.disciplinary import (
    DisciplinaryRecord, PayrollRecord,
    QueryType, DisciplinaryStatus, PayrollStatus,
)
from app.schemas.disciplinary import (
    DisciplinaryRecordOut, DisciplinaryAppeal, DisciplinaryAcknowledge,
    ManagementConfirmation, PayrollCalculateRequest, PayrollOut,
)

router = APIRouter(prefix="/disciplinary", tags=["Disciplinary & Payroll"])


# ─── Auto-Query Generation (Missed Daily Logs) ───────────────────────

@router.post("/auto-check-daily-logs")
async def run_daily_log_compliance_check(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.ADMIN, UserRole.HR_MANAGEMENT])),
):
    """
    Scans all active users for 2+ consecutive missed daily logs.
    Auto-generates query records.
    """
    users_result = await db.execute(select(User).where(User.is_active == True))
    users = users_result.scalars().all()
    today = date.today()
    generated = []

    for u in users:
        logs_result = await db.execute(
            select(DailyLog.log_date).where(
                and_(
                    DailyLog.user_id == u.id,
                    DailyLog.log_date >= today - timedelta(days=7),
                )
            )
        )
        logged_dates = {row[0] for row in logs_result.all()}

        consecutive = 0
        for i in range(7):
            check_date = today - timedelta(days=i)
            if check_date.weekday() >= 5:
                continue
            if check_date not in logged_dates:
                consecutive += 1
            else:
                break

        if consecutive >= 2:
            record_id = f"QRY-{uuid4().hex[:8].upper()}"
            record = DisciplinaryRecord(
                record_id=record_id,
                user_id=u.id,
                query_type=QueryType.MISSED_DAILY_LOG,
                description=f"{consecutive} consecutive missed daily logs detected.",
                auto_generated=True,
                trigger_data={"consecutive_missed": consecutive, "check_date": str(today)},
                consecutive_count=consecutive,
            )
            db.add(record)
            generated.append({"user": u.full_name, "record_id": record_id, "missed": consecutive})

            # Check monthly query count for privilege lock
            month_start = today.replace(day=1)
            monthly_count_result = await db.execute(
                select(func.count()).select_from(DisciplinaryRecord).where(
                    and_(
                        DisciplinaryRecord.user_id == u.id,
                        DisciplinaryRecord.created_at >= datetime(month_start.year, month_start.month, month_start.day,
                                                                   tzinfo=timezone.utc),
                    )
                )
            )
            monthly_count = monthly_count_result.scalar() or 0

            if monthly_count >= 3:
                record.privileges_locked = True
                record.locked_privileges = ["sensitive_data_access", "financial_operations"]
                record.requires_management_confirmation = True

    return {"generated_queries": len(generated), "details": generated}


# ─── Auto-Check Weekly Compliance ─────────────────────────────────────

@router.post("/auto-check-weekly-compliance")
async def run_weekly_compliance_check(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.ADMIN, UserRole.HR_MANAGEMENT])),
):
    """
    Check for missed/late weekly plans and reports.
    Apply payroll deductions:
      1st occurrence → 5%
      2nd occurrence → 20%
      3rd consecutive → flag for termination review
    """
    users_result = await db.execute(select(User).where(User.is_active == True))
    users = users_result.scalars().all()
    results = []

    for u in users:
        # Count missed weekly plans in last 3 months
        three_months_ago = date.today() - timedelta(days=90)
        missed_plans = await db.execute(
            select(func.count()).select_from(WeeklyPlan).where(
                and_(
                    WeeklyPlan.user_id == u.id,
                    WeeklyPlan.status.in_([PlanStatus.LATE, PlanStatus.MISSED]),
                    WeeklyPlan.week_start_date >= three_months_ago,
                )
            )
        )
        missed_count = missed_plans.scalar() or 0

        missed_reports = await db.execute(
            select(func.count()).select_from(WeeklyReport).where(
                and_(
                    WeeklyReport.user_id == u.id,
                    WeeklyReport.status.in_([ReportStatus.LATE, ReportStatus.MISSED]),
                    WeeklyReport.week_start_date >= three_months_ago,
                )
            )
        )
        missed_report_count = missed_reports.scalar() or 0

        total_violations = missed_count + missed_report_count

        if total_violations > 0:
            if total_violations == 1:
                deduction_pct = 5
            elif total_violations == 2:
                deduction_pct = 20
            else:
                deduction_pct = 20  # 3rd+ still 20% but flagged for termination

            record_id = f"WKQ-{uuid4().hex[:8].upper()}"
            record = DisciplinaryRecord(
                record_id=record_id,
                user_id=u.id,
                query_type=QueryType.MISSED_WEEKLY_PLAN,
                description=f"{total_violations} weekly compliance violations in last 90 days.",
                auto_generated=True,
                trigger_data={
                    "missed_plans": missed_count,
                    "missed_reports": missed_report_count,
                    "total_violations": total_violations,
                },
                consecutive_count=total_violations,
                payroll_deduction_percentage=deduction_pct,
            )

            if total_violations >= 3:
                record.requires_management_confirmation = True
                record.description += " FLAGGED FOR TERMINATION REVIEW."

            db.add(record)
            results.append({
                "user": u.full_name,
                "record_id": record_id,
                "violations": total_violations,
                "deduction_pct": deduction_pct,
                "termination_flag": total_violations >= 3,
            })

    return {"checked_users": len(users), "violations_found": len(results), "details": results}


# ─── Disciplinary Records CRUD ────────────────────────────────────────

@router.get("/records", response_model=List[DisciplinaryRecordOut])
async def list_disciplinary_records(
    user_id: Optional[UUID] = None,
    page: int = 1, page_size: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(DisciplinaryRecord)
    if current_user.role not in (UserRole.ADMIN, UserRole.HR_MANAGEMENT):
        query = query.where(DisciplinaryRecord.user_id == current_user.id)
    elif user_id:
        query = query.where(DisciplinaryRecord.user_id == user_id)

    result = await db.execute(
        query.order_by(DisciplinaryRecord.created_at.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )
    return [DisciplinaryRecordOut.model_validate(r) for r in result.scalars().all()]


@router.post("/records/{record_id}/acknowledge")
async def acknowledge_disciplinary(
    record_id: UUID,
    body: DisciplinaryAcknowledge,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(DisciplinaryRecord).where(DisciplinaryRecord.id == record_id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    if record.user_id != user.id:
        raise HTTPException(status_code=403, detail="Can only acknowledge your own records")

    record.status = DisciplinaryStatus.ACKNOWLEDGED
    record.acknowledged_at = datetime.now(timezone.utc)
    record.digital_signature = body.digital_signature

    db.add(AuditLog(
        user_id=user.id, action="ACKNOWLEDGE_DISCIPLINARY", resource_type="disciplinary",
        resource_id=str(record_id), details={"signature": body.digital_signature},
    ))

    return {"message": "Acknowledged", "record_id": record.record_id}


@router.post("/records/{record_id}/appeal")
async def appeal_disciplinary(
    record_id: UUID,
    body: DisciplinaryAppeal,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(DisciplinaryRecord).where(DisciplinaryRecord.id == record_id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    if record.user_id != user.id:
        raise HTTPException(status_code=403, detail="Can only appeal your own records")

    record.status = DisciplinaryStatus.APPEALED
    record.appeal_submitted = True
    record.appeal_text = body.appeal_text
    record.appeal_date = datetime.now(timezone.utc)

    db.add(AuditLog(
        user_id=user.id, action="APPEAL_DISCIPLINARY", resource_type="disciplinary",
        resource_id=str(record_id), details={},
    ))

    return {"message": "Appeal submitted", "record_id": record.record_id}


@router.post("/records/{record_id}/management-confirm")
async def management_confirm(
    record_id: UUID,
    body: ManagementConfirmation,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.ADMIN, UserRole.HR_MANAGEMENT])),
):
    result = await db.execute(select(DisciplinaryRecord).where(DisciplinaryRecord.id == record_id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    record.management_confirmed = body.confirmed
    record.management_confirmed_by = admin.id
    record.management_confirmed_at = datetime.now(timezone.utc)

    if body.confirmed:
        record.status = DisciplinaryStatus.ESCALATED
    else:
        record.status = DisciplinaryStatus.RESOLVED

    db.add(AuditLog(
        user_id=admin.id, action="MANAGEMENT_CONFIRM_DISCIPLINARY", resource_type="disciplinary",
        resource_id=str(record_id),
        details={"confirmed": body.confirmed, "notes": body.notes},
    ))

    return {"message": "Management decision recorded", "confirmed": body.confirmed}


# ─── Payroll ──────────────────────────────────────────────────────────

@router.post("/payroll/calculate", response_model=PayrollOut, status_code=201)
async def calculate_payroll(
    body: PayrollCalculateRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.ADMIN, UserRole.HR_MANAGEMENT])),
):
    # Fetch compliance deductions from disciplinary records
    month_start = date(body.year, body.month, 1)
    if body.month == 12:
        month_end = date(body.year + 1, 1, 1)
    else:
        month_end = date(body.year, body.month + 1, 1)

    disc_result = await db.execute(
        select(DisciplinaryRecord).where(
            and_(
                DisciplinaryRecord.user_id == body.user_id,
                DisciplinaryRecord.payroll_deduction_percentage > 0,
                DisciplinaryRecord.deduction_applied == False,
                DisciplinaryRecord.created_at >= datetime(month_start.year, month_start.month, month_start.day,
                                                          tzinfo=timezone.utc),
                DisciplinaryRecord.created_at < datetime(month_end.year, month_end.month, month_end.day,
                                                         tzinfo=timezone.utc),
            )
        )
    )
    disc_records = disc_result.scalars().all()

    # Calculate maximum applicable deduction
    max_deduction_pct = max([r.payroll_deduction_percentage for r in disc_records], default=0)

    gross = (body.salary_base + body.kpi_bonus + body.call_allowance
             + body.transport_allowance + body.other_allowances)

    compliance_deduction = round(body.salary_base * max_deduction_pct / 100, 2)
    total_deductions = (compliance_deduction + body.tax_deduction
                        + body.insurance_deduction + body.other_deductions)
    net_pay = max(gross - total_deductions, 0)

    payroll_id = f"PAY-{uuid4().hex[:8].upper()}"
    payroll = PayrollRecord(
        payroll_id=payroll_id,
        user_id=body.user_id,
        month=body.month,
        year=body.year,
        salary_base=body.salary_base,
        kpi_bonus=body.kpi_bonus,
        call_allowance=body.call_allowance,
        transport_allowance=body.transport_allowance,
        other_allowances=body.other_allowances,
        compliance_deduction=compliance_deduction,
        compliance_deduction_pct=max_deduction_pct,
        tax_deduction=body.tax_deduction,
        insurance_deduction=body.insurance_deduction,
        other_deductions=body.other_deductions,
        deduction_triggers=[{"record_id": str(r.id), "pct": r.payroll_deduction_percentage} for r in disc_records],
        gross_pay=gross,
        total_deductions=total_deductions,
        net_pay=net_pay,
        status=PayrollStatus.CALCULATED,
        notes=body.notes,
    )
    db.add(payroll)
    await db.flush()

    # Mark disciplinary deductions as applied
    for r in disc_records:
        r.deduction_applied = True

    db.add(AuditLog(
        user_id=admin.id, action="CALCULATE_PAYROLL", resource_type="payroll",
        resource_id=str(payroll.id),
        details={"payroll_id": payroll_id, "net_pay": net_pay, "deduction_pct": max_deduction_pct},
    ))

    return PayrollOut.model_validate(payroll)


@router.get("/payroll", response_model=List[PayrollOut])
async def list_payroll(
    user_id: Optional[UUID] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    page: int = 1, page_size: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(PayrollRecord)

    if current_user.role not in (UserRole.ADMIN, UserRole.HR_MANAGEMENT):
        query = query.where(PayrollRecord.user_id == current_user.id)
    elif user_id:
        query = query.where(PayrollRecord.user_id == user_id)

    if month:
        query = query.where(PayrollRecord.month == month)
    if year:
        query = query.where(PayrollRecord.year == year)

    result = await db.execute(
        query.order_by(PayrollRecord.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    return [PayrollOut.model_validate(p) for p in result.scalars().all()]


@router.post("/payroll/{payroll_id}/approve")
async def approve_payroll(
    payroll_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.ADMIN])),
):
    result = await db.execute(select(PayrollRecord).where(PayrollRecord.id == payroll_id))
    payroll = result.scalar_one_or_none()
    if not payroll:
        raise HTTPException(status_code=404, detail="Payroll record not found")

    payroll.status = PayrollStatus.APPROVED
    payroll.approved_by = admin.id
    payroll.approved_at = datetime.now(timezone.utc)

    db.add(AuditLog(
        user_id=admin.id, action="APPROVE_PAYROLL", resource_type="payroll",
        resource_id=str(payroll_id), details={"net_pay": payroll.net_pay},
    ))

    return {"message": "Payroll approved", "payroll_id": payroll.payroll_id}

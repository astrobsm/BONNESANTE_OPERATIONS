"""
ASAL Core Engine API routes — Daily Logs, Weekly Plans, Weekly Reports.
Heart of the operational compliance system.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import datetime, timezone, date, timedelta
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User, UserRole, AuditLog
from app.models.asal import DailyLog, WeeklyPlan, WeeklyReport, LogStatus, PlanStatus, ReportStatus
from app.schemas.asal import (
    DailyLogCreate, DailyLogOut,
    WeeklyPlanCreate, WeeklyPlanOut,
    WeeklyReportCreate, WeeklyReportOut,
)

router = APIRouter(prefix="/asal", tags=["ASAL Core Engine"])


# ─── Daily Activity Log ──────────────────────────────────────────────

@router.post("/daily-logs", response_model=DailyLogOut, status_code=201)
async def submit_daily_log(
    body: DailyLogCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Check for duplicate
    existing = await db.execute(
        select(DailyLog).where(
            and_(DailyLog.user_id == user.id, DailyLog.log_date == body.log_date)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Daily log already submitted for this date")

    log = DailyLog(
        user_id=user.id,
        log_date=body.log_date,
        role_at_time=user.role.value,
        activities=body.activities,
        key_achievements=body.key_achievements,
        challenges=body.challenges,
        tomorrow_plan=body.tomorrow_plan,
        hours_worked=body.hours_worked,
        status=LogStatus.SUBMITTED,
        submitted_at=datetime.now(timezone.utc),
        device_id=body.device_id,
    )
    db.add(log)
    await db.flush()

    db.add(AuditLog(
        user_id=user.id, action="SUBMIT_DAILY_LOG", resource_type="daily_log",
        resource_id=str(log.id), details={"date": str(body.log_date)},
    ))

    return DailyLogOut.model_validate(log)


@router.get("/daily-logs", response_model=List[DailyLogOut])
async def list_daily_logs(
    user_id: Optional[UUID] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    page: int = 1, page_size: int = 30,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(DailyLog)

    # Non-admin users can only see their own logs
    if current_user.role not in (UserRole.ADMIN, UserRole.HR_MANAGEMENT):
        query = query.where(DailyLog.user_id == current_user.id)
    elif user_id:
        query = query.where(DailyLog.user_id == user_id)

    if start_date:
        query = query.where(DailyLog.log_date >= start_date)
    if end_date:
        query = query.where(DailyLog.log_date <= end_date)

    result = await db.execute(
        query.order_by(DailyLog.log_date.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    return [DailyLogOut.model_validate(log) for log in result.scalars().all()]


@router.get("/daily-logs/missed", response_model=List[dict])
async def get_missed_daily_logs(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.ADMIN, UserRole.HR_MANAGEMENT])),
):
    """
    Detect users with 2+ consecutive missed daily logs.
    Returns list of users and their consecutive miss counts.
    """
    from sqlalchemy import text

    # Get all active users
    users_result = await db.execute(select(User).where(User.is_active == True))
    users = users_result.scalars().all()

    missed_list = []
    today = date.today()

    for u in users:
        # Check last 7 days of logs
        logs_result = await db.execute(
            select(DailyLog.log_date).where(
                and_(
                    DailyLog.user_id == u.id,
                    DailyLog.log_date >= today - timedelta(days=7),
                    DailyLog.log_date <= today,
                )
            ).order_by(DailyLog.log_date.desc())
        )
        logged_dates = {row[0] for row in logs_result.all()}

        # Count consecutive missed days (excluding weekends)
        consecutive = 0
        for i in range(7):
            check_date = today - timedelta(days=i)
            if check_date.weekday() >= 5:  # Skip weekends
                continue
            if check_date not in logged_dates:
                consecutive += 1
            else:
                break

        if consecutive >= 2:
            missed_list.append({
                "user_id": str(u.id),
                "full_name": u.full_name,
                "role": u.role.value,
                "consecutive_missed": consecutive,
                "requires_query": True,
            })

    return missed_list


# ─── Weekly Plan (Sunday 7PM deadline) ───────────────────────────────

@router.post("/weekly-plans", response_model=WeeklyPlanOut, status_code=201)
async def submit_weekly_plan(
    body: WeeklyPlanCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Calculate week number and deadline
    week_num = body.week_start_date.isocalendar()[1]
    year = body.week_start_date.year

    # Deadline: Sunday before week_start_date at 19:00
    deadline_date = body.week_start_date - timedelta(days=1)  # Sunday
    deadline = datetime(deadline_date.year, deadline_date.month, deadline_date.day, 19, 0, 0, tzinfo=timezone.utc)

    now = datetime.now(timezone.utc)
    plan_status = PlanStatus.LATE if now > deadline else PlanStatus.SUBMITTED

    # Check for duplicate
    existing = await db.execute(
        select(WeeklyPlan).where(
            and_(WeeklyPlan.user_id == user.id, WeeklyPlan.week_start_date == body.week_start_date)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Weekly plan already submitted for this week")

    plan = WeeklyPlan(
        user_id=user.id,
        week_start_date=body.week_start_date,
        week_number=week_num,
        year=year,
        objectives=[obj.model_dump() for obj in body.objectives],
        kpi_targets=body.kpi_targets,
        resource_requests=body.resource_requests,
        time_bound_actions=body.time_bound_actions,
        status=plan_status,
        submitted_at=now,
        deadline=deadline,
        device_id=body.device_id,
    )
    db.add(plan)
    await db.flush()

    db.add(AuditLog(
        user_id=user.id, action="SUBMIT_WEEKLY_PLAN", resource_type="weekly_plan",
        resource_id=str(plan.id),
        details={"week": week_num, "year": year, "status": plan_status.value},
    ))

    return WeeklyPlanOut.model_validate(plan)


@router.get("/weekly-plans", response_model=List[WeeklyPlanOut])
async def list_weekly_plans(
    user_id: Optional[UUID] = None,
    page: int = 1, page_size: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(WeeklyPlan)
    if current_user.role not in (UserRole.ADMIN, UserRole.HR_MANAGEMENT):
        query = query.where(WeeklyPlan.user_id == current_user.id)
    elif user_id:
        query = query.where(WeeklyPlan.user_id == user_id)

    result = await db.execute(
        query.order_by(WeeklyPlan.week_start_date.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    return [WeeklyPlanOut.model_validate(p) for p in result.scalars().all()]


# ─── Weekly Report (Friday 7PM deadline) ─────────────────────────────

@router.post("/weekly-reports", response_model=WeeklyReportOut, status_code=201)
async def submit_weekly_report(
    body: WeeklyReportCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    week_num = body.week_start_date.isocalendar()[1]
    year = body.week_start_date.year

    # Deadline: Friday of the same week at 19:00
    days_until_friday = (4 - body.week_start_date.weekday()) % 7
    deadline_date = body.week_start_date + timedelta(days=days_until_friday)
    deadline = datetime(deadline_date.year, deadline_date.month, deadline_date.day, 19, 0, 0, tzinfo=timezone.utc)

    now = datetime.now(timezone.utc)
    report_status = ReportStatus.LATE if now > deadline else ReportStatus.SUBMITTED

    # Check for duplicate
    existing = await db.execute(
        select(WeeklyReport).where(
            and_(WeeklyReport.user_id == user.id, WeeklyReport.week_start_date == body.week_start_date)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Weekly report already submitted for this week")

    report = WeeklyReport(
        user_id=user.id,
        weekly_plan_id=body.weekly_plan_id,
        week_start_date=body.week_start_date,
        week_number=week_num,
        year=year,
        objectives_achieved=[obj.model_dump() for obj in body.objectives_achieved],
        kpi_evidence=body.kpi_evidence,
        financial_impact=body.financial_impact,
        inventory_impact=body.inventory_impact,
        deviation_explanation=body.deviation_explanation,
        lessons_learned=body.lessons_learned,
        next_week_adjustments=body.next_week_adjustments,
        status=report_status,
        submitted_at=now,
        deadline=deadline,
        device_id=body.device_id,
    )
    db.add(report)
    await db.flush()

    db.add(AuditLog(
        user_id=user.id, action="SUBMIT_WEEKLY_REPORT", resource_type="weekly_report",
        resource_id=str(report.id),
        details={"week": week_num, "year": year, "status": report_status.value},
    ))

    return WeeklyReportOut.model_validate(report)


@router.get("/weekly-reports", response_model=List[WeeklyReportOut])
async def list_weekly_reports(
    user_id: Optional[UUID] = None,
    page: int = 1, page_size: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(WeeklyReport)
    if current_user.role not in (UserRole.ADMIN, UserRole.HR_MANAGEMENT):
        query = query.where(WeeklyReport.user_id == current_user.id)
    elif user_id:
        query = query.where(WeeklyReport.user_id == user_id)

    result = await db.execute(
        query.order_by(WeeklyReport.week_start_date.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    return [WeeklyReportOut.model_validate(r) for r in result.scalars().all()]

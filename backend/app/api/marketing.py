"""
Marketing & Customer Care API routes.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID, uuid4

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User, UserRole, AuditLog
from app.models.marketing import MarketingCampaign, CustomerFeedback, ComplaintStatus
from app.schemas.marketing import (
    CampaignCreate, CampaignUpdate, CampaignOut,
    FeedbackCreate, FeedbackUpdate, FeedbackOut,
)

router = APIRouter(prefix="/marketing", tags=["Marketing & Customer Care"])


# ─── Campaigns ────────────────────────────────────────────────────────

@router.post("/campaigns", response_model=CampaignOut, status_code=201)
async def create_campaign(
    body: CampaignCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles([UserRole.MARKETER, UserRole.ADMIN])),
):
    campaign = MarketingCampaign(
        **body.model_dump(),
        marketer_id=user.id,
    )
    db.add(campaign)
    await db.flush()

    db.add(AuditLog(
        user_id=user.id, action="CREATE_CAMPAIGN", resource_type="campaign",
        resource_id=str(campaign.id), details={"campaign_id": body.campaign_id},
    ))

    return CampaignOut.model_validate(campaign)


@router.get("/campaigns", response_model=List[CampaignOut])
async def list_campaigns(
    page: int = 1, page_size: int = 50,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles([
        UserRole.MARKETER, UserRole.ADMIN, UserRole.HR_MANAGEMENT, UserRole.SALES_MANAGER
    ])),
):
    result = await db.execute(
        select(MarketingCampaign).order_by(MarketingCampaign.created_at.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )
    return [CampaignOut.model_validate(c) for c in result.scalars().all()]


@router.put("/campaigns/{campaign_id}", response_model=CampaignOut)
async def update_campaign(
    campaign_id: UUID,
    body: CampaignUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles([UserRole.MARKETER, UserRole.ADMIN])),
):
    result = await db.execute(select(MarketingCampaign).where(MarketingCampaign.id == campaign_id))
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(campaign, field, value)

    # Recalculate conversion rate
    if campaign.leads_generated > 0:
        campaign.conversion_rate = round(campaign.conversions / campaign.leads_generated * 100, 2)

    campaign.version += 1
    return CampaignOut.model_validate(campaign)


# ─── Customer Feedback ───────────────────────────────────────────────

@router.post("/feedback", response_model=FeedbackOut, status_code=201)
async def create_feedback(
    body: FeedbackCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles([UserRole.CUSTOMER_CARE, UserRole.ADMIN])),
):
    ticket_id = f"TKT-{uuid4().hex[:8].upper()}"
    feedback = CustomerFeedback(
        ticket_id=ticket_id,
        customer_id=body.customer_id,
        assigned_to=user.id,
        complaint_type=body.complaint_type,
        description=body.description,
        escalation_level=body.escalation_level,
        device_id=body.device_id,
    )
    db.add(feedback)
    await db.flush()

    db.add(AuditLog(
        user_id=user.id, action="CREATE_FEEDBACK", resource_type="feedback",
        resource_id=str(feedback.id), details={"ticket_id": ticket_id},
    ))

    return FeedbackOut.model_validate(feedback)


@router.get("/feedback", response_model=List[FeedbackOut])
async def list_feedback(
    status_filter: Optional[ComplaintStatus] = None,
    page: int = 1, page_size: int = 50,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles([
        UserRole.CUSTOMER_CARE, UserRole.ADMIN, UserRole.HR_MANAGEMENT
    ])),
):
    query = select(CustomerFeedback)
    if status_filter:
        query = query.where(CustomerFeedback.status == status_filter)
    result = await db.execute(
        query.order_by(CustomerFeedback.created_at.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )
    return [FeedbackOut.model_validate(f) for f in result.scalars().all()]


@router.put("/feedback/{feedback_id}", response_model=FeedbackOut)
async def update_feedback(
    feedback_id: UUID,
    body: FeedbackUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles([UserRole.CUSTOMER_CARE, UserRole.ADMIN])),
):
    result = await db.execute(select(CustomerFeedback).where(CustomerFeedback.id == feedback_id))
    feedback = result.scalar_one_or_none()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")

    now = datetime.now(timezone.utc)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(feedback, field, value)

    # Calculate response/resolution times
    if body.status == ComplaintStatus.IN_PROGRESS and not feedback.response_time_hours:
        delta = now - feedback.created_at
        feedback.response_time_hours = round(delta.total_seconds() / 3600, 2)

    if body.status in (ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED) and not feedback.resolution_time_hours:
        delta = now - feedback.created_at
        feedback.resolution_time_hours = round(delta.total_seconds() / 3600, 2)

    feedback.version += 1
    return FeedbackOut.model_validate(feedback)

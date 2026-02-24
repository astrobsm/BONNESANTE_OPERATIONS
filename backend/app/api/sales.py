"""
Sales Management API routes.
Handles: Customers, Orders, Sales Daily Logs.
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
from app.models.sales import (
    CustomerCategory, Customer, Order, OrderItem, SalesDailyLog,
    OrderStatus, PaymentStatus,
)
from app.models.inventory import FinishedGood
from app.schemas.sales import (
    CustomerCategoryCreate, CustomerCategoryOut,
    CustomerCreate, CustomerOut,
    OrderCreate, OrderOut, OrderStatusUpdate,
    SalesDailyLogCreate, SalesDailyLogOut,
)

router = APIRouter(prefix="/sales", tags=["Sales Management"])


# ─── Customer Categories ─────────────────────────────────────────────

@router.post("/customer-categories", response_model=CustomerCategoryOut, status_code=201)
async def create_customer_category(
    body: CustomerCategoryCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles([UserRole.SALES_MANAGER, UserRole.ADMIN])),
):
    category = CustomerCategory(**body.model_dump())
    db.add(category)
    await db.flush()
    return CustomerCategoryOut.model_validate(category)


@router.get("/customer-categories", response_model=List[CustomerCategoryOut])
async def list_customer_categories(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(CustomerCategory).where(CustomerCategory.is_active == True))
    return [CustomerCategoryOut.model_validate(c) for c in result.scalars().all()]


# ─── Customers ────────────────────────────────────────────────────────

@router.post("/customers", response_model=CustomerOut, status_code=201)
async def create_customer(
    body: CustomerCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles([UserRole.SALES_MANAGER, UserRole.CUSTOMER_CARE, UserRole.ADMIN])),
):
    customer = Customer(**body.model_dump())
    db.add(customer)
    await db.flush()
    return CustomerOut.model_validate(customer)


@router.get("/customers", response_model=List[CustomerOut])
async def list_customers(
    page: int = 1, page_size: int = 50,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles([
        UserRole.SALES_MANAGER, UserRole.CUSTOMER_CARE, UserRole.ADMIN, UserRole.HR_MANAGEMENT
    ])),
):
    result = await db.execute(
        select(Customer).where(Customer.is_active == True)
        .order_by(Customer.name).offset((page - 1) * page_size).limit(page_size)
    )
    return [CustomerOut.model_validate(c) for c in result.scalars().all()]


# ─── Orders ───────────────────────────────────────────────────────────

@router.post("/orders", response_model=OrderOut, status_code=201)
async def create_order(
    body: OrderCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles([UserRole.SALES_MANAGER, UserRole.ADMIN])),
):
    tracking_id = f"ORD-{uuid4().hex[:8].upper()}"

    # Validate customer
    cust_result = await db.execute(select(Customer).where(Customer.id == body.customer_id))
    customer = cust_result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Build order
    order = Order(
        tracking_id=tracking_id,
        customer_id=body.customer_id,
        sales_manager_id=user.id,
        delivery_address=body.delivery_address,
        delivery_date=body.delivery_date,
        notes=body.notes,
        device_id=body.device_id,
    )
    db.add(order)
    await db.flush()

    subtotal = 0.0
    for item_data in body.items:
        # Verify stock
        fg_result = await db.execute(select(FinishedGood).where(FinishedGood.id == item_data.finished_good_id))
        fg = fg_result.scalar_one_or_none()
        if not fg:
            raise HTTPException(status_code=404, detail=f"Product {item_data.finished_good_id} not found")
        if fg.available_balance < item_data.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {fg.name}: available={fg.available_balance}"
            )

        total_price = item_data.quantity * item_data.unit_price
        subtotal += total_price

        order_item = OrderItem(
            order_id=order.id,
            finished_good_id=item_data.finished_good_id,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            total_price=total_price,
        )
        db.add(order_item)

        # Auto-deduct inventory
        fg.available_balance -= item_data.quantity
        fg.version += 1

    order.subtotal = subtotal
    order.total_amount = subtotal  # Tax/discount can be applied separately
    order.balance_due = subtotal

    # Update customer revenue
    customer.total_revenue += subtotal
    customer.credit_exposure += subtotal

    db.add(AuditLog(
        user_id=user.id, action="CREATE_ORDER", resource_type="order",
        resource_id=str(order.id),
        details={"tracking_id": tracking_id, "total": subtotal, "items": len(body.items)},
    ))

    return OrderOut.model_validate(order)


@router.get("/orders", response_model=List[OrderOut])
async def list_orders(
    status_filter: Optional[OrderStatus] = None,
    page: int = 1, page_size: int = 50,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles([
        UserRole.SALES_MANAGER, UserRole.ADMIN, UserRole.HR_MANAGEMENT
    ])),
):
    query = select(Order)
    if status_filter:
        query = query.where(Order.status == status_filter)
    result = await db.execute(
        query.order_by(Order.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    return [OrderOut.model_validate(o) for o in result.scalars().all()]


@router.put("/orders/{order_id}", response_model=OrderOut)
async def update_order_status(
    order_id: UUID,
    body: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles([UserRole.SALES_MANAGER, UserRole.ADMIN])),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if body.status:
        order.status = body.status
    if body.payment_status:
        order.payment_status = body.payment_status
    if body.amount_paid is not None:
        order.amount_paid = body.amount_paid
        order.balance_due = order.total_amount - body.amount_paid
        if order.balance_due <= 0:
            order.payment_status = PaymentStatus.PAID
    order.version += 1

    db.add(AuditLog(
        user_id=user.id, action="UPDATE_ORDER", resource_type="order",
        resource_id=str(order_id), details=body.model_dump(exclude_unset=True),
    ))

    return OrderOut.model_validate(order)


# ─── Sales Daily Log ─────────────────────────────────────────────────

@router.post("/daily-logs", response_model=SalesDailyLogOut, status_code=201)
async def create_sales_daily_log(
    body: SalesDailyLogCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles([UserRole.SALES_MANAGER, UserRole.ADMIN])),
):
    log = SalesDailyLog(
        sales_manager_id=user.id,
        **body.model_dump(),
    )
    db.add(log)
    await db.flush()
    return SalesDailyLogOut.model_validate(log)


@router.get("/daily-logs", response_model=List[SalesDailyLogOut])
async def list_sales_daily_logs(
    page: int = 1, page_size: int = 30,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles([
        UserRole.SALES_MANAGER, UserRole.ADMIN, UserRole.HR_MANAGEMENT
    ])),
):
    result = await db.execute(
        select(SalesDailyLog).order_by(SalesDailyLog.log_date.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )
    return [SalesDailyLogOut.model_validate(log) for log in result.scalars().all()]

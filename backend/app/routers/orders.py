from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from .. import models, schemas
from ..dependencies import get_db, get_current_user, require_admin, require_manager
from zoneinfo import ZoneInfo

router = APIRouter(prefix="/orders", tags=["Orders"])

# ------------------------------------
# Helpers
# ------------------------------------


def _load_order(order_id: int, db: Session) -> models.Order:
    """Fetch a single order with all relationships eagerly loaded. Raises 404 if not found."""
    order = (
        db.query(models.Order)
        .options(
            joinedload(models.Order.customer),
            joinedload(models.Order.items),
            joinedload(models.Order.assigned_worker),
        )
        .filter(models.Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


def _resolve_item_price(item: schemas.OrderItemCreate, db: Session) -> float:
    """
    Resolve the price for an order item.
    - If price is explicitly provided, use it.
    - Otherwise look it up from the product.
    - Raises 400 if neither is available.
    """
    if item.price is not None:
        return item.price
    if item.product_id:
        product = (
            db.query(models.Product)
            .filter(models.Product.id == item.product_id)
            .first()
        )
        if not product:
            raise HTTPException(
                status_code=400,
                detail=f"Product with id {item.product_id} not found",
            )
        return float(product.price)
    raise HTTPException(
        status_code=400,
        detail=f"Item '{item.product_name}' has no price and no product_id to look it up from",
    )


@router.get("/", response_model=list[schemas.OrderResponse])
def get_orders(
    customer_id: int | None = None,
    customer_name: str | None = None,
    order_type: models.OrderType | None = None,
    payment_method: models.PaymentMethod | None = None,
    status: models.OrderStatus | None = None,
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    include_archived: bool = False,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    query = db.query(models.Order).options(
        joinedload(models.Order.customer),
        joinedload(models.Order.items),
        joinedload(models.Order.assigned_worker),
    )

    if customer_id is not None:
        query = query.filter(models.Order.customer_id == customer_id)
    if customer_name is not None:
        query = query.join(models.Order.customer).filter(
            models.Customer.name.ilike(f"%{customer_name}%")
        )
    if not include_archived:
        query = query.filter(models.Order.is_archived.is_(False))
    if order_type is not None:
        query = query.filter(models.Order.order_type == order_type)
    if payment_method is not None:
        query = query.filter(models.Order.payment_method == payment_method)
    if status is not None:
        query = query.filter(models.Order.status == status)
    if date_from is not None:
        tz = ZoneInfo("Europe/Athens")
        dt_from = datetime.combine(date_from, datetime.min.time()).replace(tzinfo=tz)
        query = query.filter(models.Order.created_at >= dt_from)
    if date_to is not None:
        tz = ZoneInfo("Europe/Athens")
        dt_to = datetime.combine(date_to, datetime.max.time()).replace(tzinfo=tz)
        query = query.filter(models.Order.created_at <= dt_to)

    orders = (
        query.order_by(models.Order.created_at.desc()).offset(skip).limit(limit).all()
    )

    return orders


@router.post("/close-shift", status_code=200)
def close_shift(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_manager),
):
    """Archive all of today's orders and return a summary."""
    tz = ZoneInfo("Europe/Athens")
    now = datetime.now(tz)
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = now.replace(hour=23, minute=59, second=59, microsecond=999999)

    orders_to_archive = (
        db.query(models.Order)
        .filter(
            models.Order.created_at >= start_of_day,
            models.Order.created_at <= end_of_day,
            models.Order.is_archived.is_(False),
        )
        .all()
    )

    total_orders = len(orders_to_archive)
    total_revenue = round(sum(o.total for o in orders_to_archive), 2)
    cash_revenue = round(
        sum(
            o.total
            for o in orders_to_archive
            if o.payment_method == models.PaymentMethod.cash
        ),
        2,
    )

    for order in orders_to_archive:
        setattr(order, "is_archived", True)

    db.commit()

    return {
        "message": "Shift closed successfully",
        "orders_archived": total_orders,
        "total_revenue": total_revenue,
        "cash_revenue": cash_revenue,
    }


@router.delete("/purge", status_code=200)
def purge_old_orders(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    """Delete all archived orders older than 30 days."""
    tz = ZoneInfo("Europe/Athens")
    now = datetime.now(tz)
    cutoff = now - timedelta(days=30)

    old_orders = (
        db.query(models.Order)
        .filter(
            models.Order.is_archived.is_(True),
            models.Order.created_at <= cutoff,
        )
        .all()
    )

    count = len(old_orders)

    for order in old_orders:
        db.delete(order)

    db.commit()

    return {
        "message": f"Purged {count} orders older than 30 days.",
        "orders_deleted": count,
    }


@router.get("/{order_id}", response_model=schemas.OrderResponse)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    return _load_order(order_id, db)


@router.post("/", response_model=schemas.OrderResponse)
def create_order(
    order: schemas.OrderCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_manager),
):

    customer = (
        db.query(models.Customer)
        .filter(models.Customer.id == order.customer_id)
        .first()
    )
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Calculate daily sequence
    tz = ZoneInfo("Europe/Athens")
    now = datetime.now(tz)
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = now.replace(hour=23, minute=59, second=59, microsecond=999999)

    orders_today = (
        db.query(models.Order)
        .filter(
            models.Order.created_at >= start_of_day,
            models.Order.created_at <= end_of_day,
        )
        .count()
    )

    daily_seq = orders_today + 1

    db_order = models.Order(
        customer_id=order.customer_id,
        order_type=order.order_type,
        payment_method=order.payment_method,
        status=order.status,
        description=order.description,
        daily_sequence=daily_seq,
    )

    db.add(db_order)
    db.flush()  # flush to get db_order.id before adding items
    # db.commit()
    # db.refresh(db_order)

    for item in order.items:
        resolved_price = _resolve_item_price(item, db)
        db_item = models.OrderItem(
            order_id=db_order.id,
            product_id=item.product_id,
            product_name=item.product_name,
            quantity=item.quantity,
            price=resolved_price,
            customizations=item.customizations or [],
        )
        db.add(db_item)

    db.commit()

    return _load_order(int(db_order.id), db)


@router.patch("/{order_id}", response_model=schemas.OrderResponse)
def update_order(
    order_id: int,
    order_update: schemas.OrderUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_manager),
):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")

    update_data = order_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_order, key, value)

    db.commit()
    return _load_order(order_id, db)


@router.delete("/{order_id}", status_code=204)
def delete_order(
    order_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_manager),
):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    db.delete(db_order)  # cascade deletes order items automatically
    db.commit()


@router.put("/{order_id}", response_model=schemas.OrderResponse)
def full_update_order(
    order_id: int,
    order_update: schemas.OrderFullUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_manager),
):
    """
    Full update of an order — replaces order fields AND items in one shot.
    Existing items are deleted and recreated from the payload.
    """
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")

    if not order_update.items:
        raise HTTPException(
            status_code=400, detail="Order must contain at least one item"
        )

    # Update scalar fields if provided
    if order_update.order_type is not None:
        setattr(db_order, "order_type", order_update.order_type)
    if order_update.payment_method is not None:
        setattr(db_order, "payment_method", order_update.payment_method)
    if order_update.status is not None:
        setattr(db_order, "status", order_update.status)
    if order_update.description is not None:
        setattr(db_order, "description", str(order_update.description))

    # Replace all items: delete existing, insert new
    db.query(models.OrderItem).filter(models.OrderItem.order_id == order_id).delete()

    for item in order_update.items:
        resolved_price = _resolve_item_price(item, db)
        db_item = models.OrderItem(
            order_id=order_id,
            product_id=item.product_id,
            product_name=item.product_name,
            quantity=item.quantity,
            price=resolved_price,
            customizations=item.customizations or [],
        )
        db.add(db_item)

    db.commit()
    return _load_order(order_id, db)


@router.patch("/{order_id}/assign", response_model=schemas.OrderResponse)
def assign_order(
    order_id: int,
    worker_id: int | None = None,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_manager),
):
    """Assign or unassign a delivery worker to an order."""
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")

    if worker_id is not None:
        worker = (
            db.query(models.DeliveryWorker)
            .filter(
                models.DeliveryWorker.id == worker_id,
                models.DeliveryWorker.is_active.is_(True),
            )
            .first()
        )
        if not worker:
            raise HTTPException(
                status_code=404, detail="Delivery worker not found or inactive"
            )

    setattr(db_order, "assigned_to", worker_id)
    db.commit()
    return _load_order(order_id, db)

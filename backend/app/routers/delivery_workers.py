from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from .. import models, schemas
from ..dependencies import get_db, get_current_user, require_manager
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/delivery-workers", tags=["Delivery Workers"])


@router.get("/", response_model=list[schemas.DeliveryWorkerResponse])
def get_delivery_workers(
    active_only: bool = False,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    query = db.query(models.DeliveryWorker)
    if active_only:
        query = query.filter(models.DeliveryWorker.is_active.is_(True))
    return query.order_by(models.DeliveryWorker.name).all()


@router.get("/{worker_id}", response_model=schemas.DeliveryWorkerResponse)
def get_delivery_worker(
    worker_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    worker = (
        db.query(models.DeliveryWorker)
        .filter(models.DeliveryWorker.id == worker_id)
        .first()
    )
    if not worker:
        raise HTTPException(status_code=404, detail="Delivery worker not found")
    return worker


@router.post("/", response_model=schemas.DeliveryWorkerResponse, status_code=201)
def create_delivery_worker(
    worker_data: schemas.DeliveryWorkerCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_manager),
):
    worker = models.DeliveryWorker(
        name=worker_data.name,
        phone=worker_data.phone,
        is_active=True,
        created_at=datetime.now(timezone(timedelta(hours=2))),
    )
    db.add(worker)
    db.commit()
    db.refresh(worker)
    return worker


@router.patch("/{worker_id}", response_model=schemas.DeliveryWorkerResponse)
def update_delivery_worker(
    worker_id: int,
    worker_update: schemas.DeliveryWorkerUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_manager),
):
    worker = (
        db.query(models.DeliveryWorker)
        .filter(models.DeliveryWorker.id == worker_id)
        .first()
    )
    if not worker:
        raise HTTPException(status_code=404, detail="Delivery worker not found")

    update_data = worker_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(worker, key, value)

    db.commit()
    db.refresh(worker)
    return worker


@router.delete("/{worker_id}", status_code=204)
def delete_delivery_worker(
    worker_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_manager),
):
    worker = (
        db.query(models.DeliveryWorker)
        .filter(models.DeliveryWorker.id == worker_id)
        .first()
    )
    if not worker:
        raise HTTPException(status_code=404, detail="Delivery worker not found")

    # Unassign any orders assigned to this worker before deleting
    db.query(models.Order).filter(models.Order.assigned_to == worker_id).update(
        {"assigned_to": None}
    )

    db.delete(worker)
    db.commit()


@router.get("/{worker_id}/summary", response_model=schemas.WorkerShiftSummary)
def get_worker_shift_summary(
    worker_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_manager),
):
    worker = (
        db.query(models.DeliveryWorker)
        .filter(models.DeliveryWorker.id == worker_id)
        .first()
    )
    if not worker:
        raise HTTPException(status_code=404, detail="Delivery worker not found")

    # Today's date range in local time (UTC+2)
    tz = timezone(timedelta(hours=2))
    now = datetime.now(tz)
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = now.replace(hour=23, minute=59, second=59, microsecond=999999)

    orders = (
        db.query(models.Order)
        .options(joinedload(models.Order.items))
        .filter(
            models.Order.assigned_to == worker_id,
            models.Order.status == models.OrderStatus.delivered,
            models.Order.created_at >= start_of_day,
            models.Order.created_at <= end_of_day,
        )
        .order_by(models.Order.created_at.asc())
        .all()
    )

    total_cash = round(
        sum(o.total for o in orders if o.payment_method == models.PaymentMethod.cash), 2
    )

    return {
        "worker": worker,
        "orders_delivered": len(orders),
        "total_cash": total_cash,
        "orders": orders,
    }

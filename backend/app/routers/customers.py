from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from .. import models, schemas, database
from ..dependencies import get_current_user, require_manager

router = APIRouter(prefix="/customers", tags=["Customers"])


def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------
# Customers Part (CRUD operations)
# ---------------------------------


@router.get("/", response_model=list[schemas.CustomerResponse])
def read_customers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    return db.query(models.Customer).offset(skip).limit(limit).all()


@router.post("/", response_model=schemas.CustomerResponse)
def create_customer(
    customer: schemas.CustomerCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_manager),
):
    print("Received customer:", customer)
    db_customer = models.Customer(**customer.model_dump())
    db.add(db_customer)
    try:
        db.commit()
        db.refresh(db_customer)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Phone number already exists")
    return db_customer


# ---------------------------------
# Customers handling (update, delete)
# ---------------------------------


@router.patch("/{customer_id}", response_model=schemas.CustomerResponse)
def update_customer(
    customer_id: int,
    customer_update: schemas.CustomerUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_manager),
):
    db_customer = (
        db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    )

    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    update_data = customer_update.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_customer, key, value)

    try:
        db.commit()
        db.refresh(db_customer)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Phone number already exists")

    return db_customer


@router.delete("/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_manager),
):
    db_customer = (
        db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    )

    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    db.delete(db_customer)
    db.commit()

    return {"message": "Customer deleted successfully"}


# ----------------------------------------
# Customer search by phone and name or id
# ----------------------------------------
@router.get("/search", response_model=list[schemas.CustomerResponse])
def search_customers(
    phone: str | None = None,
    name: str | None = None,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    query = db.query(models.Customer)

    if phone:
        if len(phone) < 3 or not phone.isdigit():
            return []
        query = query.filter(models.Customer.phone.startswith(phone))

    if name:
        if len(name) < 2:
            return []
        query = query.filter(models.Customer.name.ilike(f"{name}%"))

    return query.all()


@router.get("/{customer_id}", response_model=schemas.CustomerResponse)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    db_customer = (
        db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    )

    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    return db_customer

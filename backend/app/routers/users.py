from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas, security
from ..dependencies import get_db, require_admin

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/", response_model=list[schemas.UserResponse])
def get_users(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    return db.query(models.User).order_by(models.User.username).all()


@router.get("/{user_id}", response_model=schemas.UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/", response_model=schemas.UserResponse, status_code=201)
def create_user(
    user_data: schemas.UserCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    existing = (
        db.query(models.User).filter(models.User.username == user_data.username).first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")

    db_user = models.User(
        username=user_data.username,
        hashed_password=security.hash_password(user_data.password),
        role=user_data.role,
        is_active=True,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.patch("/{user_id}", response_model=schemas.UserResponse)
def update_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(require_admin),
):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent admin from deactivating themselves
    if db_user.id == current_admin.id and user_update.is_active is False:
        raise HTTPException(
            status_code=400, detail="You cannot deactivate your own account"
        )

    if user_update.role is not None:
        setattr(db_user, "role", user_update.role)
    if user_update.is_active is not None:
        setattr(db_user, "is_active", user_update.is_active)
    if user_update.password is not None:
        setattr(
            db_user, "hashed_password", security.hash_password(user_update.password)
        )

    db.commit()
    db.refresh(db_user)
    return db_user


@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(require_admin),
):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent admin from deleting themselves
    if db_user.id == current_admin.id:
        raise HTTPException(
            status_code=400, detail="You cannot delete your own account"
        )

    db.delete(db_user)
    db.commit()

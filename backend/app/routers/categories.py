from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..dependencies import get_current_user, get_db, require_manager

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("/", response_model=list[schemas.CategoryResponse])
def get_categories(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    return db.query(models.Category).order_by(models.Category.name).all()


@router.get("/{category_id}", response_model=schemas.CategoryResponse)
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    category = (
        db.query(models.Category).filter(models.Category.id == category_id).first()
    )
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.post("/", response_model=schemas.CategoryResponse, status_code=201)
def create_category(
    category: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_manager),
):
    existing = (
        db.query(models.Category).filter(models.Category.name == category.name).first()
    )
    if existing:
        raise HTTPException(
            status_code=400, detail="Category with this name already exists"
        )
    db_category = models.Category(
        name=category.name,
        customizations=category.customizations or [],
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


@router.patch("/{category_id}", response_model=schemas.CategoryResponse)
def update_category(
    category_id: int,
    category_update: schemas.CategoryUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_manager),
):
    db_category = (
        db.query(models.Category).filter(models.Category.id == category_id).first()
    )
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")

    update_data = category_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_category, key, value)

    db.commit()
    db.refresh(db_category)
    return db_category


@router.delete("/{category_id}", status_code=204)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    db_category = (
        db.query(models.Category).filter(models.Category.id == category_id).first()
    )
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(db_category)
    db.commit()

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..dependencies import get_db, get_current_user, require_manager

router = APIRouter(prefix="/ingredients", tags=["Ingredients"])


@router.get("/", response_model=list[schemas.IngredientResponse])
def get_ingredients(
    available_only: bool = False,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    query = db.query(models.Ingredient)
    if available_only:
        query = query.filter(models.Ingredient.is_available.is_(True))
    return query.order_by(models.Ingredient.name).all()


@router.post("/", response_model=schemas.IngredientResponse, status_code=201)
def create_ingredient(
    data: schemas.IngredientCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_manager),
):
    existing = (
        db.query(models.Ingredient).filter(models.Ingredient.name == data.name).first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Ingredient already exists")
    ingredient = models.Ingredient(
        name=data.name,
        price=data.price,
        is_available=data.is_available,
    )
    db.add(ingredient)
    db.commit()
    db.refresh(ingredient)
    return ingredient


@router.patch("/{ingredient_id}", response_model=schemas.IngredientResponse)
def update_ingredient(
    ingredient_id: int,
    data: schemas.IngredientUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_manager),
):
    ingredient = (
        db.query(models.Ingredient)
        .filter(models.Ingredient.id == ingredient_id)
        .first()
    )
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(ingredient, key, value)
    db.commit()
    db.refresh(ingredient)
    return ingredient


@router.delete("/{ingredient_id}", status_code=204)
def delete_ingredient(
    ingredient_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_manager),
):
    ingredient = (
        db.query(models.Ingredient)
        .filter(models.Ingredient.id == ingredient_id)
        .first()
    )
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    db.delete(ingredient)
    db.commit()

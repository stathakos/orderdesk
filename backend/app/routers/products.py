from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from .. import models, schemas
from ..dependencies import get_db, get_current_user, require_manager

router = APIRouter(prefix="/products", tags=["Products"])


def _load_products(query):
    """Eagerly load category for a product query."""
    return query.options(joinedload(models.Product.category))


@router.get("/", response_model=list[schemas.ProductWithCategory])
def get_products(
    available_only: bool = False,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    query = _load_products(db.query(models.Product))

    if available_only:
        query = query.filter(models.Product.available)
    products = query.order_by(models.Product.name).all()

    return products


@router.get("/{product_id}", response_model=schemas.ProductWithCategory)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    product = (
        _load_products(db.query(models.Product))
        .filter(models.Product.id == product_id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.get("/category/{category_id}", response_model=list[schemas.ProductWithCategory])
def get_products_by_category(
    category_id: int,
    available_only: bool = False,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    # Verify category exists
    category = (
        db.query(models.Category).filter(models.Category.id == category_id).first()
    )
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    query = _load_products(db.query(models.Product)).filter(
        models.Product.category_id == category_id
    )
    if available_only:
        query = query.filter(models.Product.is_available)
    return query.order_by(models.Product.name).all()


@router.post("/", response_model=schemas.ProductWithCategory, status_code=201)
def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_manager),
):
    # Verify category exists
    category = (
        db.query(models.Category)
        .filter(models.Category.id == product.category_id)
        .first()
    )
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    db_product = models.Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    # Reload with category
    return (
        _load_products(db.query(models.Product))
        .filter(models.Product.id == db_product.id)
        .first()
    )


@router.patch("/{product_id}", response_model=schemas.ProductWithCategory)
def update_product(
    product_id: int,
    product_update: schemas.ProductUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_manager),
):
    db_product = (
        db.query(models.Product).filter(models.Product.id == product_id).first()
    )
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = product_update.model_dump(exclude_unset=True)

    # If changing category, verify new category exists
    if "category_id" in update_data:
        category = (
            db.query(models.Category)
            .filter(models.Category.id == update_data["category_id"])
            .first()
        )
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

    for key, value in update_data.items():
        setattr(db_product, key, value)

    db.commit()

    return (
        _load_products(db.query(models.Product))
        .filter(models.Product.id == product_id)
        .first()
    )


@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_manager),
):
    db_product = (
        db.query(models.Product).filter(models.Product.id == product_id).first()
    )
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(db_product)
    db.commit()

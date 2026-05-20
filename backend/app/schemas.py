from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from .models import OrderType, PaymentMethod, OrderStatus, UserRole

# ------------------------------------
# Auth
# ------------------------------------


class LoginRequest(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[UserRole] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)


# ------------------------------------
# Users
# ------------------------------------


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6)
    role: UserRole = UserRole.manager


class UserUpdate(BaseModel):
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(default=None, min_length=6)


class UserResponse(BaseModel):
    id: int
    username: str
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ------------------------------------
# Delivery Workers
# ------------------------------------


class DeliveryWorkerCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    phone: Optional[str] = None


class DeliveryWorkerUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    phone: Optional[str] = None
    is_active: Optional[bool] = None


class DeliveryWorkerResponse(BaseModel):
    id: int
    name: str
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ------------------------------------
# Ingredients
# ------------------------------------


class IngredientCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    price: float = 0.0
    is_available: bool = True


class IngredientUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    price: Optional[float] = None
    is_available: Optional[bool] = None


class IngredientResponse(BaseModel):
    id: int
    name: str
    price: float
    is_available: bool

    model_config = {"from_attributes": True}


# ----------------------------
# Customers
# ----------------------------
class CustomerCreate(BaseModel):
    name: str
    phone: str
    address: str
    floor: Optional[str] = None
    notes: Optional[str] = None


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    floor: Optional[str] = None
    notes: Optional[str] = None


class CustomerInfo(BaseModel):
    id: int
    name: str
    phone: str
    address: str
    floor: Optional[str] = None
    notes: Optional[str] = None

    model_config = {"from_attributes": True}


class CustomerResponse(BaseModel):
    id: int
    name: str
    phone: str
    address: str
    floor: Optional[str]
    notes: Optional[str]

    model_config = {"from_attributes": True}


# ----------------------------
# Categories
# ----------------------------


class CategoryCreate(BaseModel):
    name: str
    customizations: Optional[List[Dict[str, Any]]] = Field(default_factory=lambda: [])
    sizes: Optional[List[Dict[str, Any]]] = Field(default_factory=lambda: [])


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    customizations: Optional[List[Dict[str, Any]]] = None
    sizes: Optional[List[Dict[str, Any]]] = None


class CategoryResponse(BaseModel):
    id: int
    name: str
    customizations: List[Dict[str, Any]] = Field(default_factory=list)
    sizes: List[Dict[str, Any]] = Field(default_factory=list)

    @field_validator("customizations", "sizes", mode="before")
    @classmethod
    def empty_list_if_none(cls, v):
        return v or []

    model_config = {"from_attributes": True}


# ------------------------------------
# Products
# ------------------------------------


class ProductCreate(BaseModel):
    name: str
    price: float
    category_id: int
    description: Optional[str] = None
    is_available: bool = True


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    category_id: Optional[int] = None
    description: Optional[str] = None
    is_available: Optional[bool] = None


class ProductResponse(BaseModel):
    id: int
    name: str
    price: float
    category_id: int
    description: Optional[str] = None
    is_available: bool

    model_config = {"from_attributes": True}


class ProductWithCategory(ProductResponse):
    category: Optional[CategoryResponse] = None

    model_config = {"from_attributes": True}


# ----------------------------
# Order Items
# ----------------------------


class OrderItemCreate(BaseModel):
    product_id: Optional[int] = None
    product_name: str
    quantity: int = Field(ge=1)
    price: Optional[float] = None
    customizations: list[str] = Field(default_factory=list)


class OrderItemResponse(OrderItemCreate):
    id: int
    product_id: Optional[int] = None
    product_name: str
    quantity: int
    price: float
    customizations: list[str] = Field(default_factory=list)

    model_config = {"from_attributes": True}


# ----------------------------
# Orders
# ----------------------------
class OrderCreate(BaseModel):
    customer_id: int
    order_type: OrderType
    payment_method: PaymentMethod
    status: OrderStatus = OrderStatus.pending
    description: Optional[str] = None
    items: list[OrderItemCreate] = Field(min_length=1)
    # total: Optional[float] = None


class OrderUpdate(BaseModel):
    order_type: Optional[OrderType] = None
    payment_method: Optional[PaymentMethod] = None
    status: Optional[OrderStatus] = None
    description: Optional[str] = None


class OrderFullUpdate(BaseModel):
    """Used by PUT /orders/{id} — full replacement of order fields + items."""

    order_type: Optional[OrderType] = None
    payment_method: Optional[PaymentMethod] = None
    status: Optional[OrderStatus] = None
    description: Optional[str] = None
    items: List[OrderItemCreate] = Field(min_length=1)


class OrderResponse(BaseModel):
    id: int
    customer_id: int
    customer: CustomerInfo
    order_type: OrderType
    payment_method: PaymentMethod
    status: OrderStatus
    description: Optional[str] = None
    created_at: datetime
    items: list[OrderItemResponse] = []
    total: float  # add total here
    assigned_to: Optional[int] = None
    assigned_worker: Optional[DeliveryWorkerResponse] = None
    is_archived: bool = False
    daily_sequence: Optional[int] = None

    model_config = {"from_attributes": True}


# Delivery worker schemas are defined above,
# but here are the relevant ones for the summary endpoint:
class WorkerShiftSummary(BaseModel):
    worker: DeliveryWorkerResponse
    orders_delivered: int
    total_cash: float
    orders: list[OrderResponse] = []

    model_config = {"from_attributes": True}

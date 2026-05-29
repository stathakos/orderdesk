from sqlalchemy import (
    JSON,
    Column,
    Integer,
    String,
    Float,
    Enum,
    ForeignKey,
    DateTime,
    Boolean,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from .database import Base
import enum
from datetime import datetime, timezone

# ------------------------------------
# Enums
# ------------------------------------


class UserRole(str, enum.Enum):
    admin = "admin"
    manager = "manager"
    delivery = "delivery"


class OrderType(str, enum.Enum):
    delivery_us = "delivery_us"
    take_away = "take_away"
    delivery_partner = "delivery_partner"


class PaymentMethod(str, enum.Enum):
    cash = "cash"
    card = "card"
    prepaid = "prepaid"


class OrderStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    ready = "ready"
    delivered = "delivered"
    cancelled = "cancelled"


# ------------------------------------
# User
# ------------------------------------


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole), nullable=False, default=UserRole.manager
    )
    is_active = Column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )


class DeliveryWorker(Base):
    __tablename__ = "delivery_workers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    orders = relationship("Order", back_populates="assigned_worker")


class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    price = Column(Float, nullable=False, default=0.0)
    is_available = Column(Boolean, default=True, nullable=False)


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), unique=True, index=True)
    address = Column(String(255), nullable=True)
    floor = Column(String(50), nullable=True)
    notes = Column(String(255), nullable=True)
    total_orders = Column(Integer, default=0, nullable=False)
    total_spent = Column(Float, default=0.0, nullable=False)
    total_delivered = Column(Integer, default=0, nullable=False)

    orders = relationship(
        "Order", back_populates="customer", foreign_keys="[Order.customer_id]"
    )


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    customizations = Column(
        JSON, nullable=True
    )  # List of dicts with name and price_change
    sizes = Column(JSON, nullable=True)

    products = relationship(
        "Product", back_populates="category", cascade="all, delete-orphan"
    )


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    description = Column(String(255), nullable=True)
    is_available = Column(Boolean, default=True, nullable=False)

    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    category = relationship("Category", back_populates="products")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    order_type: Mapped[OrderType] = mapped_column(Enum(OrderType), nullable=False)
    payment_method: Mapped[PaymentMethod] = mapped_column(
        Enum(PaymentMethod), nullable=False, default=PaymentMethod.cash
    )
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus), default=OrderStatus.pending, nullable=False
    )
    description = Column(String(500), nullable=True)
    assigned_to = Column(Integer, ForeignKey("delivery_workers.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    is_archived = Column(Boolean, default=False, nullable=False)
    daily_sequence = Column(Integer, nullable=True)

    customer = relationship(
        "Customer", back_populates="orders", foreign_keys="[Order.customer_id]"
    )
    assigned_worker = relationship("DeliveryWorker", back_populates="orders")
    items = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )

    @property
    def total(self) -> float:
        return round(sum(item.price * item.quantity for item in self.items), 2)


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    product_name = Column(String(100), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    customizations = Column(
        JSON, nullable=True, default=list
    )  # List of added/removed ingredients, price changes

    product = relationship("Product")
    order = relationship("Order", back_populates="items")

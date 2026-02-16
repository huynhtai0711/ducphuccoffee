from datetime import datetime, date
from enum import Enum

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum as SqlEnum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class RoleEnum(str, Enum):
    ADMIN = "ADMIN"
    WAREHOUSE = "WAREHOUSE"
    SALES = "SALES"


class SegmentEnum(str, Enum):
    GREEN = "GREEN"
    FINISHED = "FINISHED"


class VatTypeEnum(str, Enum):
    NOVAT = "NOVAT"
    VAT = "VAT"


class LedgerReason(str, Enum):
    PURCHASE = "PURCHASE"
    ROAST_CONSUME = "ROAST_CONSUME"
    ROAST_OUTPUT = "ROAST_OUTPUT"
    SALE = "SALE"
    ROLLBACK = "ROLLBACK"
    ADJUSTMENT = "ADJUSTMENT"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    role: Mapped[RoleEnum] = mapped_column(SqlEnum(RoleEnum), nullable=False)
    can_adjust_inventory: Mapped[bool] = mapped_column(Boolean, default=False)
    can_delete_sales: Mapped[bool] = mapped_column(Boolean, default=False)
    can_view_cost: Mapped[bool] = mapped_column(Boolean, default=False)
    can_manage_users: Mapped[bool] = mapped_column(Boolean, default=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class BeanType(Base):
    __tablename__ = "bean_types"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    vat_type: Mapped[VatTypeEnum] = mapped_column(SqlEnum(VatTypeEnum), default=VatTypeEnum.VAT)
    archived: Mapped[bool] = mapped_column(Boolean, default=False)
    recipes = relationship("ProductRecipe", back_populates="product", cascade="all, delete-orphan")


class ProductRecipe(Base):
    __tablename__ = "product_recipes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    bean_type_id: Mapped[int] = mapped_column(ForeignKey("bean_types.id"), nullable=False)
    ratio_percent: Mapped[float] = mapped_column(Float, nullable=False)
    product = relationship("Product", back_populates="recipes")


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    bean_type_id: Mapped[int] = mapped_column(ForeignKey("bean_types.id"), nullable=False)
    quantity_kg: Mapped[float] = mapped_column(Float, nullable=False)
    price_per_kg: Mapped[float] = mapped_column(Float, nullable=False)
    vat_type: Mapped[VatTypeEnum] = mapped_column(SqlEnum(VatTypeEnum), default=VatTypeEnum.VAT)
    purchased_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    deleted: Mapped[bool] = mapped_column(Boolean, default=False)


class RoastBatch(Base):
    __tablename__ = "roast_batches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    input_green_kg: Mapped[float] = mapped_column(Float, nullable=False)
    output_finished_kg: Mapped[float] = mapped_column(Float, nullable=False)
    yield_percent: Mapped[float] = mapped_column(Float, nullable=False)
    cost_per_kg: Mapped[float] = mapped_column(Float, nullable=False)
    roasted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    deleted: Mapped[bool] = mapped_column(Boolean, default=False)


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")
    pipeline_stage: Mapped[str] = mapped_column(String(30), default="Lead")
    assigned_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    archived: Mapped[bool] = mapped_column(Boolean, default=False)


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    expense_type: Mapped[str] = mapped_column(String(50), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    spent_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    deleted: Mapped[bool] = mapped_column(Boolean, default=False)


class FollowUp(Base):
    __tablename__ = "follow_ups"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), nullable=False)
    note: Mapped[str] = mapped_column(Text, nullable=False)
    next_follow_up_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class SalesOrder(Base):
    __tablename__ = "sales_orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    quantity_kg: Mapped[float] = mapped_column(Float, nullable=False)
    price_per_kg: Mapped[float] = mapped_column(Float, nullable=False)
    packaging_cost_per_kg: Mapped[float] = mapped_column(Float, default=0)
    vat_percent: Mapped[float] = mapped_column(Float, nullable=False)
    gross_profit: Mapped[float] = mapped_column(Float, nullable=False)
    net_profit: Mapped[float] = mapped_column(Float, nullable=False)
    cogs: Mapped[float] = mapped_column(Float, nullable=False)
    sold_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    deleted: Mapped[bool] = mapped_column(Boolean, default=False)


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    sales_order_id: Mapped[int] = mapped_column(ForeignKey("sales_orders.id"), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    paid_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    method: Mapped[str] = mapped_column(String(30), default="cash")


class StockLedger(Base):
    __tablename__ = "stock_ledger"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    segment: Mapped[SegmentEnum] = mapped_column(SqlEnum(SegmentEnum), nullable=False)
    bean_type_id: Mapped[int | None] = mapped_column(ForeignKey("bean_types.id"), nullable=True)
    product_id: Mapped[int | None] = mapped_column(ForeignKey("products.id"), nullable=True)
    vat_type: Mapped[VatTypeEnum] = mapped_column(SqlEnum(VatTypeEnum), default=VatTypeEnum.VAT)
    quantity_kg: Mapped[float] = mapped_column(Float, nullable=False)
    unit_cost: Mapped[float] = mapped_column(Float, default=0)
    reason: Mapped[LedgerReason] = mapped_column(SqlEnum(LedgerReason), nullable=False)
    reference_type: Mapped[str] = mapped_column(String(30), nullable=False)
    reference_id: Mapped[int] = mapped_column(Integer, nullable=False)
    rollback_of_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Settings(Base):
    __tablename__ = "settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    allow_negative_inventory: Mapped[bool] = mapped_column(Boolean, default=False)
    low_stock_threshold_kg: Mapped[float] = mapped_column(Float, default=60)
    vat_default_percent: Mapped[float] = mapped_column(Float, default=8)
    warehouse_can_create_sales: Mapped[bool] = mapped_column(Boolean, default=True)
    app_version: Mapped[str] = mapped_column(String(20), default="1.0.0")
    schema_version: Mapped[str] = mapped_column(String(20), default="1")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    details: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class UpdateLog(Base):
    __tablename__ = "update_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    before_version: Mapped[str] = mapped_column(String(20), nullable=False)
    after_version: Mapped[str] = mapped_column(String(20), nullable=False)
    manifest_checksum: Mapped[str] = mapped_column(String(120), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

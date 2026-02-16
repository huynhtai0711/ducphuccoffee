from datetime import date, datetime
from pydantic import BaseModel, Field, field_validator


class LoginIn(BaseModel):
    username: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class BeanIn(BaseModel):
    name: str
    enabled: bool = True


class ProductRecipeIn(BaseModel):
    bean_type_id: int
    ratio_percent: float


class ProductIn(BaseModel):
    name: str
    vat_type: str = "VAT"
    recipes: list[ProductRecipeIn] = Field(min_length=1, max_length=4)

    @field_validator("recipes")
    @classmethod
    def validate_total_ratio(cls, value: list[ProductRecipeIn]):
        total = sum(item.ratio_percent for item in value)
        if round(total, 4) != 100:
            raise ValueError("Tổng công thức phải bằng 100%")
        return value


class PurchaseIn(BaseModel):
    bean_type_id: int
    quantity_kg: float = Field(gt=0)
    price_per_kg: float = Field(gt=0)
    vat_type: str = "VAT"


class RoastIn(BaseModel):
    product_id: int
    input_green_kg: float = Field(gt=0)
    output_finished_kg: float = Field(gt=0)


class CustomerIn(BaseModel):
    name: str
    status: str = "active"
    assigned_user_id: int | None = None
    notes: str | None = None


class FollowUpIn(BaseModel):
    customer_id: int
    note: str
    next_follow_up_date: date | None = None


class PaymentIn(BaseModel):
    amount: float = Field(gt=0)
    method: str = "cash"


class SalesIn(BaseModel):
    customer_id: int
    product_id: int
    quantity_kg: float = Field(gt=0)
    price_per_kg: float = Field(gt=0)
    packaging_cost_per_kg: float = 0
    sold_at: datetime | None = None
    payments: list[PaymentIn] = []


class UserOut(BaseModel):
    id: int
    username: str
    full_name: str
    role: str
    can_adjust_inventory: bool
    can_delete_sales: bool
    can_view_cost: bool
    can_manage_users: bool

    class Config:
        from_attributes = True

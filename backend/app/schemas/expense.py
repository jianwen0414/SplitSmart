from datetime import datetime, date as DateT
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

VALID_CATEGORIES = {"food", "transport", "accommodation", "entertainment", "shopping", "utilities", "groceries", "general"}
VALID_SPLIT_TYPES = {"equal", "exact", "percentage", "itemized"}


class SplitInput(BaseModel):
    user_id: UUID
    amount: Decimal | None = None
    percentage: Decimal | None = None


class ItemConsumerInput(BaseModel):
    user_id: UUID
    share_weight: Decimal = Decimal("1.000")


class ItemInput(BaseModel):
    description: str = Field(min_length=1, max_length=255)
    unit_amount: Decimal = Field(ge=0)
    quantity: int = Field(default=1, gt=0)
    consumers: list[ItemConsumerInput] = []


class ItemConsumerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    user_id: UUID
    share_weight: Decimal


class ItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    description: str
    unit_amount: Decimal
    quantity: int
    position: int
    consumers: list[ItemConsumerRead] = []


class ExpenseCreate(BaseModel):
    amount: Decimal = Field(gt=0)
    currency: str = Field(default="MYR", min_length=3, max_length=3)
    description: str = Field(min_length=1, max_length=255)
    category: str = "general"
    date: DateT | None = None
    paid_by: UUID
    split_type: str
    splits: list[SplitInput] = []
    items: list[ItemInput] | None = None
    tax_amount: Decimal = Decimal("0")
    service_charge_amount: Decimal = Decimal("0")
    receipt_url: str | None = None


class ExpenseUpdate(BaseModel):
    amount: Decimal | None = Field(default=None, gt=0)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    description: str | None = Field(default=None, min_length=1, max_length=255)
    category: str | None = None
    date: DateT | None = None
    paid_by: UUID | None = None
    split_type: str | None = None
    splits: list[SplitInput] | None = None
    items: list[ItemInput] | None = None
    tax_amount: Decimal | None = None
    service_charge_amount: Decimal | None = None
    receipt_url: str | None = None


class SplitRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    user_id: UUID
    amount: Decimal
    percentage: Decimal | None = None


class ExpenseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    group_id: UUID
    paid_by: UUID
    amount: Decimal
    currency: str
    converted_amount: Decimal | None = None
    exchange_rate: Decimal | None = None
    description: str
    category: str
    split_type: str
    tax_amount: Decimal = Decimal("0")
    service_charge_amount: Decimal = Decimal("0")
    receipt_url: str | None
    date: DateT
    created_at: datetime
    updated_at: datetime
    splits: list[SplitRead] = []
    items: list[ItemRead] = []

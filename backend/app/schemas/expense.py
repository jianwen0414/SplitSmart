from datetime import datetime, date as DateT
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

VALID_CATEGORIES = {"food", "transport", "accommodation", "entertainment", "shopping", "utilities", "groceries", "general"}
VALID_SPLIT_TYPES = {"equal", "exact", "percentage"}


class SplitInput(BaseModel):
    user_id: UUID
    amount: Decimal | None = None
    percentage: Decimal | None = None


class ExpenseCreate(BaseModel):
    amount: Decimal = Field(gt=0)
    currency: str = Field(default="MYR", min_length=3, max_length=3)
    description: str = Field(min_length=1, max_length=255)
    category: str = "general"
    date: DateT | None = None
    paid_by: UUID
    split_type: str
    splits: list[SplitInput]


class ExpenseUpdate(BaseModel):
    amount: Decimal | None = Field(default=None, gt=0)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    description: str | None = Field(default=None, min_length=1, max_length=255)
    category: str | None = None
    date: DateT | None = None
    paid_by: UUID | None = None
    split_type: str | None = None
    splits: list[SplitInput] | None = None


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
    description: str
    category: str
    split_type: str
    receipt_url: str | None
    date: DateT
    created_at: datetime
    updated_at: datetime
    splits: list[SplitRead] = []

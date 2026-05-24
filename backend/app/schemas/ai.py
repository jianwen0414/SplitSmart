from datetime import date as DateT
from decimal import Decimal
from typing import Literal
from pydantic import BaseModel

Confidence = Literal["high", "medium", "low"]


class LineItem(BaseModel):
    description: str | None = None
    amount: Decimal | None = None
    quantity: int | float | None = None


class ReceiptData(BaseModel):
    merchant: str | None = None
    total_amount: Decimal | None = None
    currency: str | None = None
    date: DateT | None = None
    category: str | None = None
    line_items: list[LineItem] = []


class ReceiptScanResponse(BaseModel):
    success: bool
    confidence: Confidence | None = None
    data: ReceiptData | None = None
    receipt_url: str | None = None
    error: str | None = None
    raw_text: str | None = None


class GroupMemberRef(BaseModel):
    user_id: str
    display_name: str


class ParseExpenseRequest(BaseModel):
    text: str
    group_id: str
    group_members: list[GroupMemberRef]


class ParsedExpenseData(BaseModel):
    description: str | None = None
    amount: Decimal | None = None
    currency: str | None = None
    category: str | None = None
    date: DateT | None = None
    paid_by_name: str | None = None
    paid_by_user_id: str | None = None
    split_type: str | None = None
    split_among: list[str] = []
    split_among_user_ids: list[str] = []
    unmatched_names: list[str] = []


class ParseExpenseResponse(BaseModel):
    success: bool
    confidence: Confidence | None = None
    data: ParsedExpenseData | None = None
    error: str | None = None

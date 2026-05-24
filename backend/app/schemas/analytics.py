from datetime import date
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel


class CategoryTotal(BaseModel):
    category: str
    amount: Decimal
    percentage: float


class DateTotal(BaseModel):
    date: date
    amount: Decimal


class MemberTotal(BaseModel):
    user_id: UUID
    display_name: str
    total_paid: Decimal
    total_share: Decimal
    net: Decimal


class AnalyticsResponse(BaseModel):
    total_spending: Decimal
    currency: str
    expense_count: int
    by_category: list[CategoryTotal]
    by_date: list[DateTotal]
    by_member: list[MemberTotal]

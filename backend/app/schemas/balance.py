from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, Field


class MemberBalance(BaseModel):
    user_id: UUID
    display_name: str
    total_paid: Decimal
    total_owed: Decimal
    settlements_paid: Decimal
    settlements_received: Decimal
    net_balance: Decimal


class SettlementPlanParty(BaseModel):
    user_id: UUID
    display_name: str


class SettlementPlanItem(BaseModel):
    from_: SettlementPlanParty = Field(..., alias="from")
    to: SettlementPlanParty
    amount: Decimal
    currency: str

    model_config = {"populate_by_name": True}


class BalanceResponse(BaseModel):
    group_id: UUID
    balances: list[MemberBalance]
    settlement_plan: list[SettlementPlanItem]
    is_settled: bool


class SettlementCreate(BaseModel):
    paid_to: UUID
    amount: Decimal
    currency: str = "MYR"
    note: str | None = None

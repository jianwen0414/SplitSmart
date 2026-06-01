from uuid import UUID
from decimal import Decimal
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.balance import BalanceResponse, MemberBalance, SettlementPlanItem, SettlementPlanParty, SettlementCreate
from app.services import balance_service, group_service
from app.utils.auth import get_current_user_id
from app.utils.rate_limit import limiter

router = APIRouter(prefix="/groups/{group_id}", tags=["balances"])


@router.get("/balances", response_model=BalanceResponse)
async def balances(group_id: UUID, user_id: UUID = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    await group_service.get_group(db, group_id, user_id)
    calcs, plan = await balance_service.get_group_balances(db, group_id)
    name_by_id = {c.user_id: c.display_name for c in calcs}

    member_balances = [
        MemberBalance(
            user_id=c.user_id, display_name=c.display_name,
            total_paid=c.total_paid, total_owed=c.total_owed,
            settlements_paid=c.settlements_paid, settlements_received=c.settlements_received,
            net_balance=c.net_balance,
        ) for c in calcs
    ]
    group = await group_service.get_group(db, group_id, user_id)
    currency = group.base_currency
    plan_items = [
        SettlementPlanItem(
            from_=SettlementPlanParty(user_id=t["from"], display_name=name_by_id.get(t["from"], "")),
            to=SettlementPlanParty(user_id=t["to"], display_name=name_by_id.get(t["to"], "")),
            amount=t["amount"],
            currency=currency,
        ) for t in plan
    ]
    return BalanceResponse(
        group_id=group_id,
        balances=member_balances,
        settlement_plan=plan_items,
        is_settled=all(abs(c.net_balance) < Decimal("0.01") for c in calcs),
    )


@router.post("/settlements", status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
async def create_settlement(request: Request, group_id: UUID, payload: SettlementCreate, user_id: UUID = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    await group_service.get_group(db, group_id, user_id)
    s = await balance_service.record_settlement(db, group_id, user_id, payload.paid_to, payload.amount, payload.currency, payload.note)
    return {"id": str(s.id), "group_id": str(s.group_id), "paid_by": str(s.paid_by), "paid_to": str(s.paid_to), "amount": str(s.amount), "currency": s.currency}

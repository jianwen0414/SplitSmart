from decimal import Decimal, ROUND_HALF_UP
from uuid import UUID, uuid4
from datetime import date as date_cls

from fastapi import HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.expense import Expense, ExpenseSplit
from app.models.group import GroupMember
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, SplitInput, VALID_CATEGORIES, VALID_SPLIT_TYPES

CENT = Decimal("0.01")
TOLERANCE = Decimal("0.01")


def _q(x: Decimal) -> Decimal:
    return x.quantize(CENT, rounding=ROUND_HALF_UP)


def split_equally(total: Decimal, num: int) -> list[Decimal]:
    """PRD §10.2 — distribute remainder cents to first members."""
    if num <= 0:
        raise ValueError("num must be > 0")
    total_cents = int((total * 100).to_integral_value(rounding=ROUND_HALF_UP))
    base_cents = total_cents // num
    remainder = total_cents - base_cents * num
    out: list[Decimal] = []
    for i in range(num):
        cents = base_cents + (1 if i < remainder else 0)
        out.append((Decimal(cents) / 100).quantize(CENT))
    return out


def compute_split_amounts(
    split_type: str,
    total_amount: Decimal,
    splits: list[SplitInput],
) -> list[tuple[UUID, Decimal, Decimal | None]]:
    """Returns [(user_id, amount, percentage_or_None)]. Raises HTTPException on validation failure."""
    if split_type not in VALID_SPLIT_TYPES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail={"code": "VALIDATION_ERROR", "message": f"split_type must be one of {sorted(VALID_SPLIT_TYPES)}", "field": "split_type"})
    if not splits:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail={"code": "VALIDATION_ERROR", "message": "splits cannot be empty", "field": "splits"})
    if total_amount <= 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail={"code": "VALIDATION_ERROR", "message": "amount must be > 0", "field": "amount"})

    user_ids = [s.user_id for s in splits]
    if len(set(user_ids)) != len(user_ids):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail={"code": "VALIDATION_ERROR", "message": "duplicate user_id in splits", "field": "splits"})

    if split_type == "equal":
        amounts = split_equally(total_amount, len(splits))
        return [(s.user_id, amounts[i], None) for i, s in enumerate(splits)]

    if split_type == "exact":
        out: list[tuple[UUID, Decimal, Decimal | None]] = []
        running = Decimal("0")
        for s in splits:
            if s.amount is None or s.amount < 0:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, detail={"code": "VALIDATION_ERROR", "message": "exact split requires non-negative amount per member", "field": "splits"})
            amt = _q(s.amount)
            running += amt
            out.append((s.user_id, amt, None))
        if abs(running - _q(total_amount)) > TOLERANCE:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail={"code": "VALIDATION_ERROR", "message": f"exact split amounts ({running}) do not sum to expense total ({total_amount})", "field": "splits"})
        return out

    # percentage
    out2: list[tuple[UUID, Decimal, Decimal | None]] = []
    pct_total = Decimal("0")
    for s in splits:
        if s.percentage is None or s.percentage < 0:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail={"code": "VALIDATION_ERROR", "message": "percentage split requires non-negative percentage per member", "field": "splits"})
        pct_total += s.percentage
    if abs(pct_total - Decimal("100")) > Decimal("0.01"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail={"code": "VALIDATION_ERROR", "message": f"percentages ({pct_total}) must sum to 100", "field": "splits"})

    # Compute amounts from percentages, distribute rounding remainder
    total_cents = int((total_amount * 100).to_integral_value(rounding=ROUND_HALF_UP))
    raw = [(s.percentage / Decimal("100") * total_amount * 100) for s in splits]
    floored = [int(r) for r in raw]
    fracs = sorted(((r - int(r), i) for i, r in enumerate(raw)), reverse=True)
    remainder = total_cents - sum(floored)
    add = {fracs[k][1]: 1 for k in range(remainder)} if remainder > 0 else {}
    for i, s in enumerate(splits):
        cents = floored[i] + add.get(i, 0)
        out2.append((s.user_id, (Decimal(cents) / 100).quantize(CENT), s.percentage))
    return out2


async def _verify_group_members(session: AsyncSession, group_id: UUID, user_ids: list[UUID]) -> None:
    res = await session.execute(select(GroupMember.user_id).where(GroupMember.group_id == group_id))
    members = {row[0] for row in res.all()}
    for uid in user_ids:
        if uid not in members:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail={"code": "VALIDATION_ERROR", "message": f"user {uid} is not a member of group {group_id}", "field": "splits"})


async def create_expense(session: AsyncSession, group_id: UUID, payload: ExpenseCreate) -> Expense:
    if payload.category not in VALID_CATEGORIES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail={"code": "VALIDATION_ERROR", "message": f"category must be one of {sorted(VALID_CATEGORIES)}", "field": "category"})

    await _verify_group_members(session, group_id, [payload.paid_by, *[s.user_id for s in payload.splits]])

    computed = compute_split_amounts(payload.split_type, payload.amount, payload.splits)

    expense = Expense(
        id=uuid4(),
        group_id=group_id,
        paid_by=payload.paid_by,
        amount=_q(payload.amount),
        currency=payload.currency,
        description=payload.description,
        category=payload.category,
        split_type=payload.split_type,
        date=payload.date or date_cls.today(),
    )
    session.add(expense)
    await session.flush()

    for user_id, amount, pct in computed:
        session.add(ExpenseSplit(
            id=uuid4(),
            expense_id=expense.id,
            user_id=user_id,
            amount=amount,
            percentage=pct,
        ))
    await session.flush()
    return expense


async def list_expenses(session: AsyncSession, group_id: UUID, limit: int = 50, offset: int = 0) -> list[Expense]:
    res = await session.execute(
        select(Expense).where(Expense.group_id == group_id).order_by(Expense.date.desc(), Expense.created_at.desc()).limit(limit).offset(offset)
    )
    return list(res.scalars().all())


async def get_expense(session: AsyncSession, expense_id: UUID) -> Expense | None:
    res = await session.execute(select(Expense).where(Expense.id == expense_id))
    return res.scalar_one_or_none()


async def get_expense_splits(session: AsyncSession, expense_id: UUID) -> list[ExpenseSplit]:
    res = await session.execute(select(ExpenseSplit).where(ExpenseSplit.expense_id == expense_id))
    return list(res.scalars().all())


async def update_expense(session: AsyncSession, expense_id: UUID, payload: ExpenseUpdate, actor_id: UUID) -> Expense:
    expense = await get_expense(session, expense_id)
    if expense is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail={"code": "NOT_FOUND", "message": "expense not found"})
    if expense.paid_by != actor_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail={"code": "FORBIDDEN", "message": "only the original payer can edit this expense"})

    data = payload.model_dump(exclude_unset=True)
    if "category" in data and data["category"] not in VALID_CATEGORIES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail={"code": "VALIDATION_ERROR", "message": "invalid category", "field": "category"})

    if "splits" in data or "split_type" in data or "amount" in data:
        new_amount = _q(payload.amount) if payload.amount is not None else expense.amount
        new_type = payload.split_type or expense.split_type
        new_splits = payload.splits if payload.splits is not None else None
        if new_splits is None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail={"code": "VALIDATION_ERROR", "message": "splits required when changing amount/split_type", "field": "splits"})
        await _verify_group_members(session, expense.group_id, [s.user_id for s in new_splits])
        computed = compute_split_amounts(new_type, new_amount, new_splits)
        await session.execute(delete(ExpenseSplit).where(ExpenseSplit.expense_id == expense.id))
        for user_id, amount, pct in computed:
            session.add(ExpenseSplit(id=uuid4(), expense_id=expense.id, user_id=user_id, amount=amount, percentage=pct))
        expense.amount = new_amount
        expense.split_type = new_type

    for field in ("currency", "description", "category", "date", "paid_by"):
        if field in data:
            setattr(expense, field, data[field])
    await session.flush()
    return expense


async def delete_expense(session: AsyncSession, expense_id: UUID, actor_id: UUID) -> None:
    expense = await get_expense(session, expense_id)
    if expense is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail={"code": "NOT_FOUND", "message": "expense not found"})
    if expense.paid_by != actor_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail={"code": "FORBIDDEN", "message": "only the original payer can delete this expense"})
    await session.delete(expense)
    await session.flush()

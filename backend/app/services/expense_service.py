from decimal import Decimal, ROUND_HALF_UP
from uuid import UUID, uuid4
from datetime import date as date_cls

from fastapi import HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.expense import Expense, ExpenseSplit, ExpenseItem, ItemConsumer
from app.models.group import Group, GroupMember
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseUpdate,
    SplitInput,
    ItemInput,
    VALID_CATEGORIES,
    VALID_SPLIT_TYPES,
)
from app.services import activity_service, currency_service

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


def _distribute_with_remainder(user_subtotals: dict[UUID, Decimal], target_total: Decimal) -> dict[UUID, Decimal]:
    """Quantize per-user subtotals to cents, distribute remainder cents to largest fractional parts.

    Ensures sum(out) == round(target_total, 2) exactly.
    """
    if not user_subtotals:
        return {}
    target_cents = int((target_total * 100).to_integral_value(rounding=ROUND_HALF_UP))
    raw_cents = [(uid, sub * 100) for uid, sub in user_subtotals.items()]
    floored = [(uid, int(rc)) for uid, rc in raw_cents]
    fracs = sorted(((rc - int(rc), uid) for uid, rc in raw_cents), reverse=True)
    assigned = sum(c for _, c in floored)
    remainder = target_cents - assigned
    add: dict[UUID, int] = {}
    if remainder > 0:
        for k in range(min(remainder, len(fracs))):
            add[fracs[k][1]] = add.get(fracs[k][1], 0) + 1
    elif remainder < 0:
        # extremely rare with HALF_UP, but guard anyway
        for k in range(min(-remainder, len(fracs))):
            uid = fracs[-(k + 1)][1]
            add[uid] = add.get(uid, 0) - 1
    out: dict[UUID, Decimal] = {}
    for uid, cents in floored:
        out[uid] = (Decimal(cents + add.get(uid, 0)) / 100).quantize(CENT)
    return out


def compute_itemized_splits(
    items: list[ItemInput],
    tax: Decimal,
    service: Decimal,
    expense_total: Decimal,
) -> list[tuple[UUID, Decimal, Decimal | None]]:
    """Per-item consumer aggregation + proportional tax/service distribution.

    Returns flattened list[(user_id, amount, None)] ready for ExpenseSplit insertion.
    Sum of amounts == quantized(expense_total) exactly.
    """
    if not items:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail={"code": "VALIDATION_ERROR", "message": "itemized split requires at least one item", "field": "items"},
        )

    user_subtotals: dict[UUID, Decimal] = {}
    item_total = Decimal("0")
    for idx, item in enumerate(items):
        if not item.consumers:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                detail={"code": "VALIDATION_ERROR", "message": f"item '{item.description}' (#{idx + 1}) has no consumers", "field": "items"},
            )
        line = (item.unit_amount * Decimal(item.quantity))
        item_total += line
        total_weight = sum((c.share_weight for c in item.consumers), Decimal("0"))
        if total_weight <= 0:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                detail={"code": "VALIDATION_ERROR", "message": f"item '{item.description}' (#{idx + 1}) total share_weight must be > 0", "field": "items"},
            )
        for c in item.consumers:
            share = line * c.share_weight / total_weight
            user_subtotals[c.user_id] = user_subtotals.get(c.user_id, Decimal("0")) + share

    grand = item_total + tax + service
    if abs(_q(grand) - _q(expense_total)) > TOLERANCE:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "VALIDATION_ERROR",
                "message": f"items ({_q(item_total)}) + tax ({_q(tax)}) + service ({_q(service)}) = {_q(grand)} != total ({_q(expense_total)})",
                "field": "items",
            },
        )

    extra = tax + service
    if item_total > 0 and extra > 0:
        for uid in list(user_subtotals.keys()):
            user_subtotals[uid] = user_subtotals[uid] + (user_subtotals[uid] / item_total) * extra

    quantized = _distribute_with_remainder(user_subtotals, expense_total)
    return [(uid, amt, None) for uid, amt in quantized.items()]


def compute_split_amounts(
    split_type: str,
    total_amount: Decimal,
    splits: list[SplitInput],
    items: list[ItemInput] | None = None,
    tax: Decimal = Decimal("0"),
    service: Decimal = Decimal("0"),
) -> list[tuple[UUID, Decimal, Decimal | None]]:
    """Returns [(user_id, amount, percentage_or_None)]. Raises HTTPException on validation failure."""
    if split_type not in VALID_SPLIT_TYPES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail={"code": "VALIDATION_ERROR", "message": f"split_type must be one of {sorted(VALID_SPLIT_TYPES)}", "field": "split_type"})
    if total_amount <= 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail={"code": "VALIDATION_ERROR", "message": "amount must be > 0", "field": "amount"})

    if split_type == "itemized":
        if items is None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail={"code": "VALIDATION_ERROR", "message": "items required for itemized split", "field": "items"})
        return compute_itemized_splits(items, tax, service, total_amount)

    if not splits:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail={"code": "VALIDATION_ERROR", "message": "splits cannot be empty", "field": "splits"})

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


async def _get_group_currency(session: AsyncSession, group_id: UUID) -> str:
    res = await session.execute(select(Group.base_currency).where(Group.id == group_id))
    row = res.scalar_one_or_none()
    return row or "MYR"


async def _apply_conversion(amount: Decimal, currency: str, base_currency: str) -> tuple[Decimal | None, Decimal | None]:
    if currency.upper() == base_currency.upper():
        return None, None
    converted, rate = await currency_service.convert(amount, currency, base_currency)
    return _q(converted), rate


def _collect_member_ids(payload: ExpenseCreate) -> list[UUID]:
    """Union of payer, split user_ids, and itemized consumer user_ids."""
    ids = [payload.paid_by, *[s.user_id for s in payload.splits]]
    if payload.items:
        for item in payload.items:
            ids.extend(c.user_id for c in item.consumers)
    return list({uid for uid in ids})


async def _insert_items(session: AsyncSession, expense_id: UUID, items: list[ItemInput]) -> None:
    for pos, item in enumerate(items):
        item_id = uuid4()
        session.add(ExpenseItem(
            id=item_id,
            expense_id=expense_id,
            description=item.description,
            unit_amount=_q(item.unit_amount),
            quantity=item.quantity,
            position=pos,
        ))
        for c in item.consumers:
            session.add(ItemConsumer(
                id=uuid4(),
                item_id=item_id,
                user_id=c.user_id,
                share_weight=c.share_weight,
            ))


async def create_expense(session: AsyncSession, group_id: UUID, payload: ExpenseCreate, actor_id: UUID) -> Expense:
    if payload.category not in VALID_CATEGORIES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail={"code": "VALIDATION_ERROR", "message": f"category must be one of {sorted(VALID_CATEGORIES)}", "field": "category"})

    await _verify_group_members(session, group_id, _collect_member_ids(payload))

    tax = _q(payload.tax_amount or Decimal("0"))
    service = _q(payload.service_charge_amount or Decimal("0"))
    computed = compute_split_amounts(
        payload.split_type,
        payload.amount,
        payload.splits,
        items=payload.items,
        tax=tax,
        service=service,
    )

    base_currency = await _get_group_currency(session, group_id)
    converted_amount, exchange_rate = await _apply_conversion(payload.amount, payload.currency, base_currency)

    expense = Expense(
        id=uuid4(),
        group_id=group_id,
        paid_by=payload.paid_by,
        amount=_q(payload.amount),
        currency=payload.currency,
        converted_amount=converted_amount,
        exchange_rate=exchange_rate,
        description=payload.description,
        category=payload.category,
        split_type=payload.split_type,
        tax_amount=tax,
        service_charge_amount=service,
        receipt_url=payload.receipt_url,
        date=payload.date or date_cls.today(),
    )
    session.add(expense)
    await session.flush()

    if payload.split_type == "itemized" and payload.items:
        await _insert_items(session, expense.id, payload.items)

    for user_id, amount, pct in computed:
        session.add(ExpenseSplit(
            id=uuid4(), expense_id=expense.id, user_id=user_id, amount=amount, percentage=pct,
        ))
    await session.flush()

    await activity_service.log(
        session, group_id=group_id, user_id=actor_id,
        action="expense_created", entity_type="expense", entity_id=expense.id,
        metadata={"description": expense.description, "amount": str(expense.amount), "currency": expense.currency},
    )
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


async def get_expense_items(session: AsyncSession, expense_id: UUID) -> list[tuple[ExpenseItem, list[ItemConsumer]]]:
    items_res = await session.execute(
        select(ExpenseItem).where(ExpenseItem.expense_id == expense_id).order_by(ExpenseItem.position.asc())
    )
    items = list(items_res.scalars().all())
    if not items:
        return []
    cons_res = await session.execute(
        select(ItemConsumer).where(ItemConsumer.item_id.in_([i.id for i in items]))
    )
    cons_by_item: dict[UUID, list[ItemConsumer]] = {}
    for c in cons_res.scalars().all():
        cons_by_item.setdefault(c.item_id, []).append(c)
    return [(it, cons_by_item.get(it.id, [])) for it in items]


async def update_expense(session: AsyncSession, expense_id: UUID, payload: ExpenseUpdate, actor_id: UUID) -> Expense:
    expense = await get_expense(session, expense_id)
    if expense is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail={"code": "NOT_FOUND", "message": "expense not found"})
    if expense.paid_by != actor_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail={"code": "FORBIDDEN", "message": "only the original payer can edit this expense"})

    data = payload.model_dump(exclude_unset=True)
    if "category" in data and data["category"] not in VALID_CATEGORIES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail={"code": "VALIDATION_ERROR", "message": "invalid category", "field": "category"})

    structural_change = any(k in data for k in ("splits", "items", "split_type", "amount", "tax_amount", "service_charge_amount"))
    if structural_change:
        new_amount = _q(payload.amount) if payload.amount is not None else expense.amount
        new_type = payload.split_type or expense.split_type
        new_tax = _q(payload.tax_amount) if payload.tax_amount is not None else expense.tax_amount
        new_service = _q(payload.service_charge_amount) if payload.service_charge_amount is not None else expense.service_charge_amount

        if new_type == "itemized":
            if payload.items is None:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, detail={"code": "VALIDATION_ERROR", "message": "items required for itemized split", "field": "items"})
            consumer_ids = {c.user_id for item in payload.items for c in item.consumers}
            await _verify_group_members(session, expense.group_id, list(consumer_ids))
            computed = compute_split_amounts(new_type, new_amount, [], items=payload.items, tax=new_tax, service=new_service)
        else:
            new_splits = payload.splits if payload.splits is not None else None
            if new_splits is None:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, detail={"code": "VALIDATION_ERROR", "message": "splits required when changing amount/split_type", "field": "splits"})
            await _verify_group_members(session, expense.group_id, [s.user_id for s in new_splits])
            computed = compute_split_amounts(new_type, new_amount, new_splits)

        await session.execute(delete(ExpenseSplit).where(ExpenseSplit.expense_id == expense.id))
        await session.execute(delete(ExpenseItem).where(ExpenseItem.expense_id == expense.id))
        if new_type == "itemized" and payload.items:
            await _insert_items(session, expense.id, payload.items)
        for user_id, amount, pct in computed:
            session.add(ExpenseSplit(id=uuid4(), expense_id=expense.id, user_id=user_id, amount=amount, percentage=pct))
        expense.amount = new_amount
        expense.split_type = new_type
        expense.tax_amount = new_tax
        expense.service_charge_amount = new_service

    if "paid_by" in data and data["paid_by"] != expense.paid_by:
        await _verify_group_members(session, expense.group_id, [data["paid_by"]])

    for field in ("currency", "description", "category", "date", "paid_by", "receipt_url"):
        if field in data:
            setattr(expense, field, data[field])

    if "amount" in data or "currency" in data:
        base_currency = await _get_group_currency(session, expense.group_id)
        converted_amount, exchange_rate = await _apply_conversion(expense.amount, expense.currency, base_currency)
        expense.converted_amount = converted_amount
        expense.exchange_rate = exchange_rate

    await session.flush()
    await activity_service.log(
        session, group_id=expense.group_id, user_id=actor_id,
        action="expense_updated", entity_type="expense", entity_id=expense.id,
        metadata={"description": expense.description, "amount": str(expense.amount), "currency": expense.currency},
    )
    return expense


async def delete_expense(session: AsyncSession, expense_id: UUID, actor_id: UUID) -> None:
    expense = await get_expense(session, expense_id)
    if expense is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail={"code": "NOT_FOUND", "message": "expense not found"})
    if expense.paid_by != actor_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail={"code": "FORBIDDEN", "message": "only the original payer can delete this expense"})
    group_id = expense.group_id
    description = expense.description
    await session.delete(expense)
    await session.flush()
    await activity_service.log(
        session, group_id=group_id, user_id=actor_id,
        action="expense_deleted", entity_type="expense", entity_id=expense_id,
        metadata={"description": description},
    )

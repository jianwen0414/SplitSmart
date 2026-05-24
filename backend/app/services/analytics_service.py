"""Aggregate group spending for the dashboard tab (PRD §5.2 Feature 5)."""
from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.expense import Expense, ExpenseSplit
from app.models.group import Group, GroupMember
from app.models.profile import Profile
from app.models.settlement import Settlement
from app.schemas.analytics import AnalyticsResponse, CategoryTotal, DateTotal, MemberTotal
from app.services.balance_service import compute_balances


def _amount_expr():
    """Use converted_amount when present else amount — keeps everything in base currency."""
    return func.coalesce(Expense.converted_amount, Expense.amount)


async def aggregate(session: AsyncSession, group_id: UUID) -> AnalyticsResponse:
    grp_res = await session.execute(select(Group).where(Group.id == group_id))
    group = grp_res.scalar_one()

    total_res = await session.execute(
        select(func.coalesce(func.sum(_amount_expr()), 0), func.count(Expense.id)).where(Expense.group_id == group_id)
    )
    total_spending, count = total_res.one()
    total_spending = Decimal(str(total_spending or 0))

    by_cat_res = await session.execute(
        select(Expense.category, func.coalesce(func.sum(_amount_expr()), 0))
        .where(Expense.group_id == group_id)
        .group_by(Expense.category)
    )
    by_category: list[CategoryTotal] = []
    for cat, amt in by_cat_res.all():
        amt = Decimal(str(amt or 0))
        pct = float(amt / total_spending * 100) if total_spending > 0 else 0.0
        by_category.append(CategoryTotal(category=cat, amount=amt, percentage=round(pct, 2)))
    by_category.sort(key=lambda c: -c.amount)

    by_date_res = await session.execute(
        select(Expense.date, func.coalesce(func.sum(_amount_expr()), 0))
        .where(Expense.group_id == group_id)
        .group_by(Expense.date)
        .order_by(Expense.date.asc())
    )
    by_date = [DateTotal(date=d, amount=Decimal(str(a or 0))) for d, a in by_date_res.all()]

    # Per-member breakdown reuses the balance engine for consistency.
    member_rows = await session.execute(
        select(GroupMember.user_id, Profile.display_name)
        .join(Profile, Profile.id == GroupMember.user_id)
        .where(GroupMember.group_id == group_id)
    )
    members = [(uid, name) for uid, name in member_rows.all()]
    exp_rows = await session.execute(select(Expense).where(Expense.group_id == group_id))
    expenses = list(exp_rows.scalars().all())
    split_by_exp: dict = {}
    if expenses:
        sp_rows = await session.execute(
            select(ExpenseSplit).where(ExpenseSplit.expense_id.in_([e.id for e in expenses]))
        )
        for sp in sp_rows.scalars().all():
            split_by_exp.setdefault(sp.expense_id, []).append(sp)
    settle_rows = await session.execute(select(Settlement).where(Settlement.group_id == group_id))
    calcs = compute_balances(members, expenses, split_by_exp, list(settle_rows.scalars().all()))

    by_member = [
        MemberTotal(
            user_id=c.user_id, display_name=c.display_name,
            total_paid=c.total_paid, total_share=c.total_owed, net=c.net_balance,
        ) for c in calcs
    ]

    return AnalyticsResponse(
        total_spending=total_spending,
        currency=group.base_currency,
        expense_count=int(count or 0),
        by_category=by_category,
        by_date=by_date,
        by_member=by_member,
    )

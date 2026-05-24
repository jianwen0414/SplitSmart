from decimal import Decimal, ROUND_HALF_UP
from uuid import UUID
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.expense import Expense, ExpenseSplit
from app.models.settlement import Settlement
from app.models.group import GroupMember
from app.models.profile import Profile

CENT = Decimal("0.01")
TOLERANCE = Decimal("0.01")


def _q(x: Decimal) -> Decimal:
    return x.quantize(CENT, rounding=ROUND_HALF_UP)


@dataclass
class MemberBalanceCalc:
    user_id: UUID
    display_name: str
    total_paid: Decimal
    total_owed: Decimal
    settlements_paid: Decimal
    settlements_received: Decimal

    @property
    def net_balance(self) -> Decimal:
        # PRD §10.1: settling debtor (paid_by) gets +amount (debt reduced);
        # settled creditor (paid_to) gets -amount (credit reduced).
        return _q(self.total_paid - self.total_owed + self.settlements_paid - self.settlements_received)


def simplify_debts(balances: dict[UUID, Decimal]) -> list[dict]:
    """PRD §10.1 greedy debt simplification.

    Input: {user_id: net_balance}. Positive = owed, negative = owes.
    Output: list of {from, to, amount} transactions.
    """
    creditors = sorted(
        [(uid, _q(bal)) for uid, bal in balances.items() if bal > TOLERANCE],
        key=lambda x: -x[1],
    )
    debtors = sorted(
        [(uid, _q(-bal)) for uid, bal in balances.items() if bal < -TOLERANCE],
        key=lambda x: -x[1],
    )

    transactions: list[dict] = []
    i = j = 0
    while i < len(creditors) and j < len(debtors):
        cred_id, credit = creditors[i]
        debt_id, debt = debtors[j]
        transfer = _q(min(credit, debt))
        if transfer < CENT:
            break
        transactions.append({"from": debt_id, "to": cred_id, "amount": transfer})
        creditors[i] = (cred_id, _q(credit - transfer))
        debtors[j] = (debt_id, _q(debt - transfer))
        if creditors[i][1] < CENT:
            i += 1
        if debtors[j][1] < CENT:
            j += 1
    return transactions


def compute_balances(
    members: list[tuple[UUID, str]],
    expenses: list[Expense],
    splits_by_expense: dict[UUID, list[ExpenseSplit]],
    settlements: list[Settlement],
) -> list[MemberBalanceCalc]:
    """Pure-function balance computation — testable without a DB."""
    bal_map: dict[UUID, MemberBalanceCalc] = {
        uid: MemberBalanceCalc(uid, name, Decimal("0"), Decimal("0"), Decimal("0"), Decimal("0"))
        for uid, name in members
    }

    for exp in expenses:
        amount = exp.converted_amount if exp.converted_amount is not None else exp.amount
        if exp.paid_by in bal_map:
            bal_map[exp.paid_by].total_paid += amount

        ratio = (exp.converted_amount / exp.amount) if (exp.converted_amount is not None and exp.amount > 0) else Decimal("1")
        for split in splits_by_expense.get(exp.id, []):
            owed = split.amount * ratio
            if split.user_id in bal_map:
                bal_map[split.user_id].total_owed += owed

    for s in settlements:
        if s.paid_by in bal_map:
            bal_map[s.paid_by].settlements_paid += s.amount
        if s.paid_to in bal_map:
            bal_map[s.paid_to].settlements_received += s.amount

    return list(bal_map.values())


async def get_group_balances(session: AsyncSession, group_id: UUID) -> tuple[list[MemberBalanceCalc], list[dict]]:
    member_rows = await session.execute(
        select(GroupMember.user_id, Profile.display_name)
        .join(Profile, Profile.id == GroupMember.user_id)
        .where(GroupMember.group_id == group_id)
    )
    members = [(uid, name) for uid, name in member_rows.all()]

    exp_rows = await session.execute(select(Expense).where(Expense.group_id == group_id))
    expenses = list(exp_rows.scalars().all())

    split_rows = await session.execute(
        select(ExpenseSplit).where(ExpenseSplit.expense_id.in_([e.id for e in expenses])) if expenses else select(ExpenseSplit).where(False)
    )
    splits_by_exp: dict[UUID, list[ExpenseSplit]] = {}
    for sp in split_rows.scalars().all():
        splits_by_exp.setdefault(sp.expense_id, []).append(sp)

    settle_rows = await session.execute(select(Settlement).where(Settlement.group_id == group_id))
    settlements = list(settle_rows.scalars().all())

    calcs = compute_balances(members, expenses, splits_by_exp, settlements)
    plan = simplify_debts({c.user_id: c.net_balance for c in calcs})
    return calcs, plan


async def record_settlement(session: AsyncSession, group_id: UUID, paid_by: UUID, paid_to: UUID, amount: Decimal, currency: str = "MYR", note: str | None = None) -> Settlement:
    from uuid import uuid4
    s = Settlement(
        id=uuid4(),
        group_id=group_id,
        paid_by=paid_by,
        paid_to=paid_to,
        amount=_q(amount),
        currency=currency,
        note=note,
    )
    session.add(s)
    await session.flush()
    return s

"""Pure-function tests for balance computation + debt simplification.

No DB required — services exposed via importable helpers.
Covers PRD §11.1 critical cases.
"""
from decimal import Decimal
from uuid import uuid4
from types import SimpleNamespace

import pytest

from app.services.balance_service import compute_balances, simplify_debts


def _expense(eid, paid_by, amount, group_id=None):
    return SimpleNamespace(
        id=eid, group_id=group_id or uuid4(), paid_by=paid_by,
        amount=Decimal(str(amount)), converted_amount=None,
    )


def _split(eid, user_id, amount):
    return SimpleNamespace(expense_id=eid, user_id=user_id, amount=Decimal(str(amount)))


def test_two_members_one_expense_equal_split():
    a, b = uuid4(), uuid4()
    eid = uuid4()
    expenses = [_expense(eid, a, "100.00")]
    splits = {eid: [_split(eid, a, "50.00"), _split(eid, b, "50.00")]}
    calcs = compute_balances([(a, "Ali"), (b, "Bea")], expenses, splits, [])
    bmap = {c.user_id: c.net_balance for c in calcs}
    assert bmap[a] == Decimal("50.00")
    assert bmap[b] == Decimal("-50.00")
    plan = simplify_debts(bmap)
    assert len(plan) == 1
    assert plan[0]["from"] == b and plan[0]["to"] == a and plan[0]["amount"] == Decimal("50.00")


def test_three_members_mixed_payers_net_zero():
    a, b, c = uuid4(), uuid4(), uuid4()
    e1, e2 = uuid4(), uuid4()
    expenses = [
        _expense(e1, a, "90.00"),
        _expense(e2, b, "60.00"),
    ]
    splits = {
        e1: [_split(e1, a, "30.00"), _split(e1, b, "30.00"), _split(e1, c, "30.00")],
        e2: [_split(e2, a, "20.00"), _split(e2, b, "20.00"), _split(e2, c, "20.00")],
    }
    calcs = compute_balances([(a, "A"), (b, "B"), (c, "C")], expenses, splits, [])
    total = sum(c.net_balance for c in calcs)
    assert abs(total) < Decimal("0.01")


def test_rounding_split_three_ways():
    from app.services.expense_service import split_equally
    parts = split_equally(Decimal("100.00"), 3)
    assert sum(parts) == Decimal("100.00")
    assert parts == [Decimal("33.34"), Decimal("33.33"), Decimal("33.33")]


def test_zero_expense_group():
    a, b = uuid4(), uuid4()
    calcs = compute_balances([(a, "A"), (b, "B")], [], {}, [])
    assert all(c.net_balance == Decimal("0") for c in calcs)
    assert simplify_debts({c.user_id: c.net_balance for c in calcs}) == []


def test_one_payer_N_minus_1_settlements():
    members = [uuid4() for _ in range(5)]
    eid = uuid4()
    expenses = [_expense(eid, members[0], "100.00")]
    splits = {eid: [_split(eid, m, "20.00") for m in members]}
    calcs = compute_balances([(m, f"M{i}") for i, m in enumerate(members)], expenses, splits, [])
    plan = simplify_debts({c.user_id: c.net_balance for c in calcs})
    assert len(plan) == 4
    assert all(t["to"] == members[0] for t in plan)
    assert sum(t["amount"] for t in plan) == Decimal("80.00")


def test_settlement_reduces_outstanding_balance():
    a, b = uuid4(), uuid4()
    eid = uuid4()
    expenses = [_expense(eid, a, "100.00")]
    splits = {eid: [_split(eid, a, "50.00"), _split(eid, b, "50.00")]}
    settlements = [SimpleNamespace(paid_by=b, paid_to=a, amount=Decimal("50.00"))]
    calcs = compute_balances([(a, "A"), (b, "B")], expenses, splits, settlements)
    bmap = {c.user_id: c.net_balance for c in calcs}
    assert bmap[a] == Decimal("0.00")
    assert bmap[b] == Decimal("0.00")
    assert simplify_debts(bmap) == []


def test_simplify_reduces_transaction_count():
    """3-cycle debt simplifies to fewer hops than naive pairwise."""
    a, b, c = uuid4(), uuid4(), uuid4()
    bmap = {a: Decimal("30.00"), b: Decimal("-10.00"), c: Decimal("-20.00")}
    plan = simplify_debts(bmap)
    assert len(plan) == 2
    assert sum(t["amount"] for t in plan) == Decimal("30.00")

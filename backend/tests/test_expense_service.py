"""Validation tests for expense split logic — pure-function, no DB."""
from decimal import Decimal
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.services.expense_service import compute_split_amounts, compute_itemized_splits, split_equally
from app.schemas.expense import SplitInput, ItemInput, ItemConsumerInput


def test_exact_split_not_summing_to_total_raises_400():
    splits = [SplitInput(user_id=uuid4(), amount=Decimal("40.00")), SplitInput(user_id=uuid4(), amount=Decimal("50.00"))]
    with pytest.raises(HTTPException) as exc:
        compute_split_amounts("exact", Decimal("100.00"), splits)
    assert exc.value.status_code == 400


def test_percentage_split_not_summing_to_100_raises_400():
    splits = [SplitInput(user_id=uuid4(), percentage=Decimal("50.0")), SplitInput(user_id=uuid4(), percentage=Decimal("40.0"))]
    with pytest.raises(HTTPException) as exc:
        compute_split_amounts("percentage", Decimal("100.00"), splits)
    assert exc.value.status_code == 400


def test_negative_amount_raises_400():
    splits = [SplitInput(user_id=uuid4(), amount=Decimal("50.00"))]
    with pytest.raises(HTTPException) as exc:
        compute_split_amounts("exact", Decimal("-100.00"), splits)
    assert exc.value.status_code == 400


def test_unknown_split_type_raises_400():
    with pytest.raises(HTTPException) as exc:
        compute_split_amounts("fancy", Decimal("100.00"), [SplitInput(user_id=uuid4())])
    assert exc.value.status_code == 400


def test_equal_split_distributes_remainder_to_first_members():
    parts = split_equally(Decimal("100.00"), 3)
    assert parts[0] == Decimal("33.34")
    assert parts[1] == Decimal("33.33")
    assert parts[2] == Decimal("33.33")


def test_exact_split_happy_path():
    u1, u2 = uuid4(), uuid4()
    splits = [SplitInput(user_id=u1, amount=Decimal("60.00")), SplitInput(user_id=u2, amount=Decimal("40.00"))]
    out = compute_split_amounts("exact", Decimal("100.00"), splits)
    assert out == [(u1, Decimal("60.00"), None), (u2, Decimal("40.00"), None)]


def test_percentage_split_computes_amounts():
    u1, u2 = uuid4(), uuid4()
    splits = [SplitInput(user_id=u1, percentage=Decimal("60.0")), SplitInput(user_id=u2, percentage=Decimal("40.0"))]
    out = compute_split_amounts("percentage", Decimal("100.00"), splits)
    assert out[0][1] == Decimal("60.00")
    assert out[1][1] == Decimal("40.00")


def test_equal_split_with_one_member():
    u1 = uuid4()
    splits = [SplitInput(user_id=u1)]
    out = compute_split_amounts("equal", Decimal("100.00"), splits)
    assert out == [(u1, Decimal("100.00"), None)]


def test_duplicate_user_in_splits_raises_400():
    u1 = uuid4()
    splits = [SplitInput(user_id=u1), SplitInput(user_id=u1)]
    with pytest.raises(HTTPException) as exc:
        compute_split_amounts("equal", Decimal("100.00"), splits)
    assert exc.value.status_code == 400


# ---------------------------------------------------------------------------
# Itemized split tests
# ---------------------------------------------------------------------------

def _item(desc: str, unit: str, qty: int, consumers: list[tuple]) -> ItemInput:
    return ItemInput(
        description=desc,
        unit_amount=Decimal(unit),
        quantity=qty,
        consumers=[ItemConsumerInput(user_id=uid, share_weight=Decimal(str(w))) for uid, w in consumers],
    )


def test_itemized_simple_three_users_three_items():
    a, b, c = uuid4(), uuid4(), uuid4()
    items = [
        _item("Nasi Kandar", "12.50", 1, [(a, 1)]),
        _item("Mee Goreng", "10.00", 1, [(b, 1)]),
        _item("Roti Canai", "8.00", 1, [(c, 1)]),
    ]
    out = compute_itemized_splits(items, Decimal("0"), Decimal("0"), Decimal("30.50"))
    result = {uid: amt for uid, amt, _ in out}
    assert result[a] == Decimal("12.50")
    assert result[b] == Decimal("10.00")
    assert result[c] == Decimal("8.00")


def test_itemized_shared_item_equal_weights():
    a, b, c = uuid4(), uuid4(), uuid4()
    items = [_item("Hotpot", "60.00", 1, [(a, 1), (b, 1), (c, 1)])]
    out = compute_itemized_splits(items, Decimal("0"), Decimal("0"), Decimal("60.00"))
    result = {uid: amt for uid, amt, _ in out}
    assert sum(result.values()) == Decimal("60.00")
    assert all(abs(v - Decimal("20.00")) <= Decimal("0.01") for v in result.values())


def test_itemized_weighted_consumers():
    a, b = uuid4(), uuid4()
    items = [_item("Steak", "30.00", 1, [(a, 2), (b, 1)])]
    out = compute_itemized_splits(items, Decimal("0"), Decimal("0"), Decimal("30.00"))
    result = {uid: amt for uid, amt, _ in out}
    assert result[a] == Decimal("20.00")
    assert result[b] == Decimal("10.00")


def test_itemized_tax_proportional():
    a, b, c = uuid4(), uuid4(), uuid4()
    items = [
        _item("A's dish", "10.00", 1, [(a, 1)]),
        _item("B's dish", "20.00", 1, [(b, 1)]),
        _item("C's dish", "30.00", 1, [(c, 1)]),
    ]
    out = compute_itemized_splits(items, Decimal("6.00"), Decimal("0"), Decimal("66.00"))
    result = {uid: amt for uid, amt, _ in out}
    # tax distributed 1:2:3 → 1.00, 2.00, 3.00
    assert result[a] == Decimal("11.00")
    assert result[b] == Decimal("22.00")
    assert result[c] == Decimal("33.00")
    assert sum(result.values()) == Decimal("66.00")


def test_itemized_service_charge_proportional():
    a, b = uuid4(), uuid4()
    items = [
        _item("A's dish", "40.00", 1, [(a, 1)]),
        _item("B's dish", "60.00", 1, [(b, 1)]),
    ]
    out = compute_itemized_splits(items, Decimal("0"), Decimal("10.00"), Decimal("110.00"))
    result = {uid: amt for uid, amt, _ in out}
    assert result[a] == Decimal("44.00")
    assert result[b] == Decimal("66.00")


def test_itemized_sum_mismatch_raises_400():
    a = uuid4()
    items = [_item("X", "10.00", 1, [(a, 1)])]
    with pytest.raises(HTTPException) as exc:
        compute_itemized_splits(items, Decimal("0"), Decimal("0"), Decimal("15.00"))
    assert exc.value.status_code == 400


def test_itemized_empty_consumers_raises_400():
    items = [ItemInput(description="orphan", unit_amount=Decimal("10.00"), quantity=1, consumers=[])]
    with pytest.raises(HTTPException) as exc:
        compute_itemized_splits(items, Decimal("0"), Decimal("0"), Decimal("10.00"))
    assert exc.value.status_code == 400


def test_itemized_empty_items_raises_400():
    with pytest.raises(HTTPException) as exc:
        compute_itemized_splits([], Decimal("0"), Decimal("0"), Decimal("10.00"))
    assert exc.value.status_code == 400


def test_itemized_remainder_cents_sum_exact():
    a, b, c = uuid4(), uuid4(), uuid4()
    items = [_item("Shared", "100.00", 1, [(a, 1), (b, 1), (c, 1)])]
    out = compute_itemized_splits(items, Decimal("0"), Decimal("0"), Decimal("100.00"))
    result = {uid: amt for uid, amt, _ in out}
    assert sum(result.values()) == Decimal("100.00")


def test_itemized_via_compute_split_amounts_dispatcher():
    a, b = uuid4(), uuid4()
    items = [_item("Shared", "40.00", 1, [(a, 1), (b, 1)])]
    out = compute_split_amounts("itemized", Decimal("40.00"), splits=[], items=items)
    result = {uid: amt for uid, amt, _ in out}
    assert result[a] == Decimal("20.00")
    assert result[b] == Decimal("20.00")


def test_itemized_missing_items_via_dispatcher_raises():
    with pytest.raises(HTTPException) as exc:
        compute_split_amounts("itemized", Decimal("40.00"), splits=[], items=None)
    assert exc.value.status_code == 400

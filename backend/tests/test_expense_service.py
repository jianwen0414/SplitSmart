"""Validation tests for expense split logic — pure-function, no DB."""
from decimal import Decimal
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.services.expense_service import compute_split_amounts, split_equally
from app.schemas.expense import SplitInput


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

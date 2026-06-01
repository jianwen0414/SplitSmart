"""Security-oriented tests: authz member verification + rate-limit wiring."""
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.services.expense_service import _verify_group_members


class _FakeResult:
    def __init__(self, rows):
        self._rows = rows

    def all(self):
        return self._rows


class _FakeSession:
    """Minimal async session stub returning a fixed member set."""

    def __init__(self, member_ids):
        self._member_ids = member_ids

    async def execute(self, _stmt):
        return _FakeResult([(m,) for m in self._member_ids])


@pytest.mark.asyncio
async def test_verify_group_members_rejects_non_member():
    member = uuid4()
    outsider = uuid4()
    session = _FakeSession([member])
    with pytest.raises(HTTPException) as exc:
        await _verify_group_members(session, uuid4(), [outsider])
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_verify_group_members_allows_member():
    member = uuid4()
    session = _FakeSession([member])
    # Should not raise.
    await _verify_group_members(session, uuid4(), [member])


def test_rate_limiter_blocks_excess_requests():
    """Proves the limiter is wired into the app: the global default kicks in."""
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)
    statuses = [client.get("/health").status_code for _ in range(130)]
    assert 429 in statuses, "expected the limiter to reject requests past the default limit"


@pytest.mark.asyncio
async def test_rate_limit_handler_uses_standard_envelope():
    """The per-route limit handler returns the app's standard {detail:{code,message}} body."""
    import json
    from types import SimpleNamespace
    from app.main import rate_limit_handler

    resp = await rate_limit_handler(None, SimpleNamespace(detail="10 per 1 minute"))
    assert resp.status_code == 429
    body = json.loads(resp.body)
    assert body["detail"]["code"] == "RATE_LIMITED"
    assert "10 per 1 minute" in body["detail"]["message"]

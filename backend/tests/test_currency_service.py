"""Currency cache + fallback tests (no network)."""
from decimal import Decimal

import pytest

from app.services import currency_service


@pytest.fixture(autouse=True)
def reset_cache():
    currency_service.clear_cache()
    yield
    currency_service.clear_cache()


async def test_same_currency_returns_one():
    rate = await currency_service.get_rate("MYR", "MYR")
    assert rate == Decimal("1")


async def test_rate_cached_after_first_fetch():
    calls = {"n": 0}

    async def fake_fetch(url: str) -> dict:
        calls["n"] += 1
        return {"rates": {"MYR": 4.5}}

    r1 = await currency_service.get_rate("USD", "MYR", fetcher=fake_fetch)
    r2 = await currency_service.get_rate("USD", "MYR", fetcher=fake_fetch)
    assert r1 == r2 == Decimal("4.5")
    assert calls["n"] == 1


async def test_cache_expires_after_ttl():
    calls = {"n": 0}
    clock = {"t": 1_000.0}

    async def fake_fetch(url: str) -> dict:
        calls["n"] += 1
        return {"rates": {"MYR": 4.5}}

    def fake_now() -> float:
        return clock["t"]

    await currency_service.get_rate("USD", "MYR", fetcher=fake_fetch, now=fake_now)
    clock["t"] += currency_service.CACHE_TTL_SECONDS + 1
    await currency_service.get_rate("USD", "MYR", fetcher=fake_fetch, now=fake_now)
    assert calls["n"] == 2


async def test_upstream_error_returns_one_fallback():
    async def boom(url: str) -> dict:
        raise RuntimeError("upstream 500")

    rate = await currency_service.get_rate("USD", "MYR", fetcher=boom)
    assert rate == Decimal("1")


async def test_unknown_quote_returns_one():
    async def fake_fetch(url: str) -> dict:
        return {"rates": {"EUR": 0.92}}

    rate = await currency_service.get_rate("USD", "MYR", fetcher=fake_fetch)
    assert rate == Decimal("1")


async def test_convert_returns_amount_and_rate():
    async def fake_fetch(url: str) -> dict:
        return {"rates": {"MYR": 4.5}}

    amt, rate = await currency_service.convert(Decimal("20.00"), "USD", "MYR", fetcher=fake_fetch)
    assert rate == Decimal("4.5")
    assert amt == Decimal("90.00")

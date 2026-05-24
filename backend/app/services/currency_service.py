"""Currency conversion via free open.er-api.com endpoint (no key).

In-memory cache keyed by base currency with 1-hour TTL per PRD §5.2.
Falls back to 1.0 + logs a warning if upstream fails — caller decides whether
to surface the failure.
"""
from __future__ import annotations

import logging
import time
from decimal import Decimal
from typing import Awaitable, Callable

import httpx

logger = logging.getLogger(__name__)

CACHE_TTL_SECONDS = 3600
RATE_URL_TEMPLATE = "https://open.er-api.com/v6/latest/{base}"

# Cache: { base_currency: (rates_dict, expires_at_epoch) }
_cache: dict[str, tuple[dict[str, float], float]] = {}

# Pluggable fetcher for tests. Default uses httpx. Returns parsed JSON dict.
HttpFetcher = Callable[[str], Awaitable[dict]]


async def _default_fetch(url: str) -> dict:
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        return resp.json()


def _now() -> float:
    return time.time()


def clear_cache() -> None:
    _cache.clear()


async def get_rate(
    base: str,
    quote: str,
    *,
    fetcher: HttpFetcher | None = None,
    now: Callable[[], float] | None = None,
) -> Decimal:
    """Return rate such that `amount_in_quote = amount_in_base * rate`.

    Caches the full rates table for `base` for 1h.
    Returns Decimal("1") and logs a warning on upstream failure.
    """
    base = base.upper()
    quote = quote.upper()
    if base == quote:
        return Decimal("1")

    nowf = (now or _now)()
    cached = _cache.get(base)
    if cached and cached[1] > nowf:
        rates = cached[0]
    else:
        fetch = fetcher or _default_fetch
        try:
            data = await fetch(RATE_URL_TEMPLATE.format(base=base))
        except Exception as e:  # noqa: BLE001
            logger.warning("FX fetch failed for base=%s: %s", base, e)
            return Decimal("1")
        rates = data.get("rates") or {}
        if not rates:
            logger.warning("FX response missing rates for base=%s", base)
            return Decimal("1")
        _cache[base] = (rates, nowf + CACHE_TTL_SECONDS)

    rate = rates.get(quote)
    if rate is None:
        logger.warning("FX rate not found: %s -> %s", base, quote)
        return Decimal("1")
    return Decimal(str(rate))


async def convert(
    amount: Decimal,
    base: str,
    quote: str,
    *,
    fetcher: HttpFetcher | None = None,
) -> tuple[Decimal, Decimal]:
    """Returns (converted_amount, rate_used)."""
    rate = await get_rate(base, quote, fetcher=fetcher)
    return amount * rate, rate

"""Rate limiting via slowapi (in-memory).

Keys requests by authenticated user id when a bearer token is present, falling
back to client IP otherwise. In-memory storage means limits are per-instance;
on multi-instance deploys (Cloud Run) this is acceptable for abuse mitigation,
with Redis as the upgrade path for global limits.
"""
from __future__ import annotations

import jwt
from fastapi import Request
from slowapi import Limiter


def _client_ip(request: Request) -> str:
    # Honor the first hop in X-Forwarded-For when behind a proxy/load balancer.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "anonymous"


def rate_limit_key(request: Request) -> str:
    """User id from the (unverified) bearer token, else client IP.

    The token is only decoded to bucket requests — never trusted for authz, so
    skipping signature verification here is safe and avoids a JWKS round-trip.
    """
    auth = request.headers.get("authorization", "")
    if auth.lower().startswith("bearer "):
        token = auth[7:].strip()
        try:
            sub = jwt.decode(token, options={"verify_signature": False}).get("sub")
            if sub:
                return f"user:{sub}"
        except jwt.PyJWTError:
            pass
    return f"ip:{_client_ip(request)}"


limiter = Limiter(key_func=rate_limit_key, default_limits=["100/minute"])

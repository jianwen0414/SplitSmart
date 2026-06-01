"""Security response headers for the API.

Adds standard hardening headers to every response. HSTS is only emitted in
production (sending it over plain HTTP during local dev would pin localhost to
HTTPS in the browser).
"""
from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.config import get_settings


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        # Modern browsers ignore the legacy XSS auditor; "0" disables it (recommended).
        response.headers["X-XSS-Protection"] = "0"
        # JSON API serves no HTML/scripts of its own.
        response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
        if get_settings().ENVIRONMENT == "production":
            response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
        return response

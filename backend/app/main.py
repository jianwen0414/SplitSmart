import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import get_settings
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.utils.rate_limit import limiter
from app.routers import auth as auth_router
from app.routers import groups as groups_router
from app.routers import expenses as expenses_router
from app.routers import balances as balances_router
from app.routers import ai as ai_router
from app.routers import activity as activity_router
from app.routers import analytics as analytics_router

logger = logging.getLogger("splitsmart")

settings = get_settings()

_REQUIRED_PROD_VARS = ("SUPABASE_URL", "SUPABASE_SERVICE_KEY", "DATABASE_URL")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    missing = [v for v in _REQUIRED_PROD_VARS if not getattr(settings, v)]
    if missing:
        msg = f"missing required config: {', '.join(missing)}"
        if settings.ENVIRONMENT == "production":
            raise RuntimeError(msg)
        logger.warning("%s (allowed in %s)", msg, settings.ENVIRONMENT)
    yield


app = FastAPI(title="SplitSmart API", version="0.1.0", lifespan=lifespan)

# Rate limiting (slowapi). Default limits applied via SlowAPIMiddleware; tighter
# per-route limits are declared with @limiter.limit on individual endpoints.
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(_request: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={"detail": {"code": "RATE_LIMITED", "message": f"rate limit exceeded: {exc.detail}"}},
    )


app.add_middleware(SlowAPIMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth_router.router, prefix="/api/v1")
app.include_router(groups_router.router, prefix="/api/v1")
app.include_router(expenses_router.router, prefix="/api/v1")
app.include_router(balances_router.router, prefix="/api/v1")
app.include_router(activity_router.router, prefix="/api/v1")
app.include_router(analytics_router.router, prefix="/api/v1")
app.include_router(ai_router.router, prefix="/api/v1")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import auth as auth_router
from app.routers import groups as groups_router
from app.routers import expenses as expenses_router
from app.routers import balances as balances_router
from app.routers import ai as ai_router
from app.routers import activity as activity_router
from app.routers import analytics as analytics_router

settings = get_settings()
app = FastAPI(title="SplitSmart API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

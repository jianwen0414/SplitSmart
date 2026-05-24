from uuid import UUID
import httpx
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import get_settings

security = HTTPBearer(auto_error=True)


async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    """PRD §6.1 — verify Supabase JWT, return user dict."""
    settings = get_settings()
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"code": "CONFIG_ERROR", "message": "Supabase not configured"})

    token = credentials.credentials
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            f"{settings.SUPABASE_URL}/auth/v1/user",
            headers={"Authorization": f"Bearer {token}", "apikey": settings.SUPABASE_SERVICE_KEY},
        )
    if resp.status_code != 200:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail={"code": "UNAUTHORIZED", "message": "invalid or expired token"})
    return resp.json()


async def get_current_user_id(user: dict = Security(get_current_user)) -> UUID:
    uid = user.get("id")
    if not uid:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail={"code": "UNAUTHORIZED", "message": "no user id in token"})
    return UUID(uid)

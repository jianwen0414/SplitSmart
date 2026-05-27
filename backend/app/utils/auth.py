from uuid import UUID
import jwt
from jwt import PyJWKClient
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import get_settings

security = HTTPBearer(auto_error=True)

# Instantiated once at import time; PyJWKClient caches keys in memory.
_jwks_client: PyJWKClient | None = None


def _get_jwks_client() -> PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        settings = get_settings()
        jwks_url = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
        _jwks_client = PyJWKClient(jwks_url)
    return _jwks_client


async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    """Verify Supabase JWT locally via JWKS — no network call per request."""
    settings = get_settings()
    if not settings.SUPABASE_URL:
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "CONFIG_ERROR", "message": "SUPABASE_URL not configured"},
        )

    token = credentials.credentials
    issuer = f"{settings.SUPABASE_URL}/auth/v1"

    try:
        signing_key = _get_jwks_client().get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256"],
            audience="authenticated",
            issuer=issuer,
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail={"code": "UNAUTHORIZED", "message": "token expired"})
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail={"code": "UNAUTHORIZED", "message": str(exc)})

    return {
        "id": payload.get("sub"),
        "email": payload.get("email"),
        "user_metadata": payload.get("user_metadata", {}),
    }


async def get_current_user_id(user: dict = Security(get_current_user)) -> UUID:
    uid = user.get("id")
    if not uid:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail={"code": "UNAUTHORIZED", "message": "no user id in token"})
    return UUID(uid)

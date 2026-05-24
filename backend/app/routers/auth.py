from fastapi import APIRouter, Depends

from app.utils.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/verify")
async def verify(user: dict = Depends(get_current_user)) -> dict:
    return {"id": user.get("id"), "email": user.get("email"), "user_metadata": user.get("user_metadata", {})}

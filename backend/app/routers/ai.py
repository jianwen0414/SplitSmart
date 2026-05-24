"""AI router — auth/health probe only for the scaffold.

Receipt OCR and NLP expense parsing endpoints will be added with Tier 3.
"""
from fastapi import APIRouter, Depends, HTTPException, status

from app.services import ai_service
from app.utils.auth import get_current_user

router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/health")
async def health(_user: dict = Depends(get_current_user)) -> dict:
    """Returns Gemini/Vertex AI config diagnostics. No API call performed."""
    return ai_service.health_check()


@router.post("/echo")
async def echo(payload: dict, _user: dict = Depends(get_current_user)) -> dict:
    """Smoke test: round-trip a prompt through Gemini to confirm auth + reachability."""
    prompt = (payload or {}).get("prompt", "").strip()
    if not prompt:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail={"code": "VALIDATION_ERROR", "message": "prompt is required"})
    try:
        text = ai_service.generate_text(prompt)
    except Exception as e:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail={"code": "AI_ERROR", "message": str(e)})
    return {"response": text}

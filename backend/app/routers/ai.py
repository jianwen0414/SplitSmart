"""AI router — receipt OCR + NLP expense parsing + auth/health probes."""
from datetime import date as DateT
from uuid import UUID
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status

from app.schemas.ai import ParseExpenseRequest, ParseExpenseResponse, ReceiptScanResponse
from app.services import ai_service, storage_service
from app.utils.auth import get_current_user, get_current_user_id
from app.utils.rate_limit import limiter

router = APIRouter(prefix="/ai", tags=["ai"])

ALLOWED_MIME = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
MAX_BYTES = 5 * 1024 * 1024


@router.get("/health")
async def health(_user: dict = Depends(get_current_user)) -> dict:
    return ai_service.health_check()


@router.post("/scan-receipt", response_model=ReceiptScanResponse)
@limiter.limit("15/minute")
async def scan_receipt(
    request: Request,
    file: UploadFile = File(...),
    group_id: str = Form(...),
    _user_id: UUID = Depends(get_current_user_id),
):
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail={"code": "VALIDATION_ERROR", "message": f"unsupported mime: {file.content_type}"})
    image_bytes = await file.read()
    if len(image_bytes) > MAX_BYTES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail={"code": "VALIDATION_ERROR", "message": "file > 5MB"})

    try:
        receipt_url = await storage_service.upload_receipt(image_bytes, file.content_type, group_id)
    except Exception as e:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail={"code": "STORAGE_ERROR", "message": str(e)})

    result = await ai_service.scan_receipt(image_bytes, file.content_type)
    result["receipt_url"] = receipt_url
    return result


@router.post("/parse-expense", response_model=ParseExpenseResponse)
@limiter.limit("15/minute")
async def parse_expense(request: Request, payload: ParseExpenseRequest, _user_id: UUID = Depends(get_current_user_id)):
    members = [{"user_id": m.user_id, "display_name": m.display_name} for m in payload.group_members]
    return await ai_service.parse_expense_text(payload.text, members, DateT.today())

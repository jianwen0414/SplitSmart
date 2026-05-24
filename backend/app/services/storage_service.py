"""Supabase Storage REST upload for receipt images.

Bucket `receipts` must exist (PRD §4) with RLS allowing service-role inserts.
We use the service key from .env, so the bucket can stay private.
Returns a signed URL with 1-year expiry.
"""
from __future__ import annotations

import logging
from uuid import uuid4

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

EXT_BY_MIME = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}
BUCKET = "receipts"
SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 365  # 1 year


def _extension(mime: str) -> str:
    return EXT_BY_MIME.get(mime.lower(), "bin")


async def upload_receipt(image_bytes: bytes, mime_type: str, group_id: str) -> str:
    settings = get_settings()
    if not (settings.SUPABASE_URL and settings.SUPABASE_SERVICE_KEY):
        raise RuntimeError("Supabase not configured for storage upload")

    object_path = f"{group_id}/{uuid4()}.{_extension(mime_type)}"
    upload_url = f"{settings.SUPABASE_URL}/storage/v1/object/{BUCKET}/{object_path}"
    sign_url = f"{settings.SUPABASE_URL}/storage/v1/object/sign/{BUCKET}/{object_path}"

    headers = {
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_KEY}",
        "apikey": settings.SUPABASE_SERVICE_KEY,
        "Content-Type": mime_type,
        "x-upsert": "false",
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        up = await client.post(upload_url, content=image_bytes, headers=headers)
        if up.status_code >= 400:
            logger.error("Storage upload failed (%s): %s", up.status_code, up.text)
            raise RuntimeError(f"Supabase Storage upload failed: {up.status_code} {up.text}")

        sign = await client.post(
            sign_url,
            json={"expiresIn": SIGNED_URL_TTL_SECONDS},
            headers={"Authorization": f"Bearer {settings.SUPABASE_SERVICE_KEY}", "apikey": settings.SUPABASE_SERVICE_KEY},
        )
        if sign.status_code >= 400:
            logger.error("Signed URL request failed (%s): %s", sign.status_code, sign.text)
            raise RuntimeError(f"Supabase signed URL failed: {sign.status_code}")
        signed_path = sign.json().get("signedURL") or sign.json().get("signedUrl") or ""
        if not signed_path:
            raise RuntimeError("Supabase signed URL response missing signedURL field")
        # signedURL is relative — prefix with full host.
        if signed_path.startswith("/"):
            return f"{settings.SUPABASE_URL}/storage/v1{signed_path}"
        return f"{settings.SUPABASE_URL}/storage/v1/{signed_path}"

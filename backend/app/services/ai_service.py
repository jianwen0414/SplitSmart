"""Vertex AI Gemini client wired via GCP service-account credentials.

Auth path (no API key needed):
1. backend/.env sets GOOGLE_APPLICATION_CREDENTIALS=./service_account.json
   plus GCP_PROJECT_ID + GCP_LOCATION.
2. Service account needs IAM role "Vertex AI User" and Vertex AI API enabled
   in the target project.
3. We read the JSON explicitly (not via ADC env fallback) so behaviour is
   deterministic in any environment, including containers without the env var.

This module is intentionally minimal — receipt OCR and natural-language
expense parsing (PRD Tier 3) will use the same `get_genai_client()`
factory once those endpoints are added.
"""
from __future__ import annotations

import json
import os
import re
from datetime import date as DateT
from difflib import SequenceMatcher
from functools import lru_cache
from pathlib import Path
from typing import Any

from google import genai
from google.genai import types as genai_types
from google.oauth2.service_account import Credentials

from app.config import get_settings

# Vertex AI requires the full cloud-platform scope.
SCOPES = ["https://www.googleapis.com/auth/cloud-platform"]


def _resolve_credentials_path(raw: str) -> Path:
    """Accept absolute or backend/-relative paths."""
    p = Path(raw).expanduser()
    if p.is_absolute():
        return p
    # Resolve relative to the backend/ directory (parent of app/).
    backend_root = Path(__file__).resolve().parents[2]
    return (backend_root / p).resolve()


def _load_credentials(path: Path) -> tuple[Credentials, str]:
    """Returns (credentials, project_id_from_json)."""
    if not path.is_file():
        raise FileNotFoundError(
            f"Service account JSON not found at {path}. "
            "Set GOOGLE_APPLICATION_CREDENTIALS in backend/.env."
        )
    creds = Credentials.from_service_account_file(str(path), scopes=SCOPES)
    with path.open("r", encoding="utf-8") as f:
        project_id = json.load(f).get("project_id", "")
    return creds, project_id


@lru_cache(maxsize=1)
def get_genai_client() -> genai.Client:
    """Build a Vertex AI genai.Client. Cached for process lifetime."""
    settings = get_settings()
    cred_path = settings.GOOGLE_APPLICATION_CREDENTIALS
    if not cred_path:
        raise RuntimeError(
            "GOOGLE_APPLICATION_CREDENTIALS is not set. "
            "Add it to backend/.env pointing at your service-account JSON."
        )

    resolved = _resolve_credentials_path(cred_path)
    credentials, project_from_json = _load_credentials(resolved)
    project = settings.GCP_PROJECT_ID or project_from_json
    if not project:
        raise RuntimeError(
            "GCP project could not be determined. "
            "Set GCP_PROJECT_ID in backend/.env or ensure the service-account "
            "JSON contains a project_id field."
        )

    # Also export the env var so any downstream library using ADC sees the
    # same credentials. Harmless if already set.
    os.environ.setdefault("GOOGLE_APPLICATION_CREDENTIALS", str(resolved))

    return genai.Client(
        vertexai=True,
        project=project,
        location=settings.GCP_LOCATION,
        credentials=credentials,
    )


def generate_text(prompt: str, *, model: str | None = None) -> str:
    """Smoke helper: send a prompt to Gemini and return the text response.

    Use only for verifying auth + reachability. Receipt OCR and NLP expense
    parsing get dedicated functions when Tier 3 lands.
    """
    settings = get_settings()
    client = get_genai_client()
    response = client.models.generate_content(
        model=model or settings.GEMINI_MODEL,
        contents=prompt,
    )
    return response.text or ""


RECEIPT_SCAN_PROMPT = """\
Analyze this receipt image and extract the following information.
Return your response as a JSON object with exactly these fields:

{
    "merchant": "store/restaurant name",
    "total_amount": numeric total (number, not string),
    "currency": "3-letter currency code (e.g., MYR, USD, SGD)",
    "date": "YYYY-MM-DD format",
    "category": one of ["food", "transport", "accommodation", "entertainment", "shopping", "utilities", "groceries", "general"],
    "line_items": [
        {"description": "item name", "amount": per-unit price as number, "quantity": count as number}
    ]
}

Rules:
- If you cannot determine a field, use null.
- total_amount should be the final total including tax/service charge.
- For currency, infer from the receipt's country/language if not explicitly shown. Malaysian receipts default to MYR.
- Return ONLY the JSON object, no additional text or markdown.
"""

NLP_EXPENSE_PROMPT_TEMPLATE = """\
Parse this expense description into structured data.

User input: "{user_input}"

Group members: {member_names}
Today's date: {today}

Return a JSON object:
{{
    "description": "what the expense is for",
    "amount": numeric amount (number, not string),
    "currency": "3-letter code, default MYR if not specified",
    "category": one of ["food", "transport", "accommodation", "entertainment", "shopping", "utilities", "groceries", "general"],
    "date": "YYYY-MM-DD, use today if not specified",
    "paid_by_name": "name of person who paid, or null if not clear",
    "split_type": "equal",
    "split_among": ["list", "of", "member", "names"] or null if split with everyone
}}

Rules:
- Match member names fuzzy (e.g., "ami" matches "Amir").
- If no payer is mentioned, set paid_by_name to null (frontend will prompt).
- If no split members mentioned, set split_among to null (means split with all).
- Currency: look for symbols (RM=MYR, $=USD, £=GBP, ¥=JPY, €=EUR, S$=SGD, ฿=THB).
- Return ONLY the JSON object.
"""


def _strip_json_fence(text: str) -> str:
    """Gemini sometimes wraps JSON in ```json ... ``` despite the prompt."""
    t = text.strip()
    fenced = re.match(r"^```(?:json)?\s*(.*?)\s*```$", t, flags=re.DOTALL | re.IGNORECASE)
    if fenced:
        return fenced.group(1).strip()
    return t


def _parse_json_loose(text: str) -> dict | None:
    try:
        return json.loads(_strip_json_fence(text))
    except Exception:
        # Fallback: locate the first {...} block.
        m = re.search(r"\{.*\}", text, flags=re.DOTALL)
        if not m:
            return None
        try:
            return json.loads(m.group(0))
        except Exception:
            return None


def _confidence_from(data: dict, required_fields: list[str]) -> str:
    missing = sum(1 for f in required_fields if data.get(f) in (None, "", []))
    if missing == 0:
        return "high"
    if missing <= 2:
        return "medium"
    return "low"


def _fuzzy_match(needle: str, candidates: list[str]) -> str | None:
    needle_l = needle.lower().strip()
    if not needle_l:
        return None
    for c in candidates:
        if c.lower() == needle_l:
            return c
    # substring
    for c in candidates:
        if needle_l in c.lower() or c.lower() in needle_l:
            return c
    # difflib
    best = max(((SequenceMatcher(None, needle_l, c.lower()).ratio(), c) for c in candidates), default=(0, None))
    return best[1] if best[0] >= 0.6 else None


async def scan_receipt(image_bytes: bytes, mime_type: str) -> dict:
    """Send the image to Gemini, parse JSON response, return dict for the API layer."""
    client = get_genai_client()
    settings = get_settings()
    try:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=[
                RECEIPT_SCAN_PROMPT,
                genai_types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            ],
        )
    except Exception as e:  # noqa: BLE001
        return {"success": False, "error": f"Gemini call failed: {type(e).__name__}: {e}"}

    text = response.text or ""
    parsed = _parse_json_loose(text)
    if parsed is None:
        return {"success": False, "error": "Could not parse receipt", "raw_text": text}

    confidence = _confidence_from(parsed, ["merchant", "total_amount", "currency", "date", "category"])
    return {"success": True, "confidence": confidence, "data": parsed, "raw_text": text}


async def parse_expense_text(text: str, members: list[dict], today: DateT) -> dict:
    """Parse natural-language expense input. `members` is [{user_id, display_name}, ...]."""
    client = get_genai_client()
    settings = get_settings()
    names = [m["display_name"] for m in members]
    prompt = NLP_EXPENSE_PROMPT_TEMPLATE.format(
        user_input=text.replace('"', '\\"'),
        member_names=json.dumps(names),
        today=today.isoformat(),
    )
    try:
        response = client.models.generate_content(model=settings.GEMINI_MODEL, contents=prompt)
    except Exception as e:  # noqa: BLE001
        return {"success": False, "error": f"Gemini call failed: {type(e).__name__}: {e}"}

    parsed = _parse_json_loose(response.text or "")
    if parsed is None:
        return {"success": False, "error": "Could not parse expense"}

    name_to_id = {m["display_name"]: m["user_id"] for m in members}
    unmatched: list[str] = []

    paid_by_name = parsed.get("paid_by_name")
    paid_by_user_id = None
    if paid_by_name:
        matched = _fuzzy_match(paid_by_name, names)
        if matched:
            paid_by_user_id = name_to_id[matched]
            parsed["paid_by_name"] = matched
        else:
            unmatched.append(paid_by_name)
            parsed["paid_by_name"] = None

    split_among = parsed.get("split_among") or []
    split_ids: list[str] = []
    cleaned_names: list[str] = []
    for name in split_among:
        matched = _fuzzy_match(name, names)
        if matched:
            split_ids.append(name_to_id[matched])
            cleaned_names.append(matched)
        else:
            unmatched.append(name)
    parsed["split_among"] = cleaned_names
    parsed["paid_by_user_id"] = paid_by_user_id
    parsed["split_among_user_ids"] = split_ids
    parsed["unmatched_names"] = unmatched

    confidence = _confidence_from(parsed, ["description", "amount", "paid_by_user_id"])
    if unmatched:
        confidence = "low"
    return {"success": True, "confidence": confidence, "data": parsed}


def health_check() -> dict[str, Any]:
    """Returns auth/config diagnostics without calling the API."""
    settings = get_settings()
    cred_path = settings.GOOGLE_APPLICATION_CREDENTIALS
    if not cred_path:
        return {"configured": False, "reason": "GOOGLE_APPLICATION_CREDENTIALS unset"}
    try:
        resolved = _resolve_credentials_path(cred_path)
        if not resolved.is_file():
            return {"configured": False, "reason": f"file not found: {resolved}"}
        with resolved.open("r", encoding="utf-8") as f:
            data = json.load(f)
        return {
            "configured": True,
            "service_account_email": data.get("client_email", ""),
            "project_id": settings.GCP_PROJECT_ID or data.get("project_id", ""),
            "location": settings.GCP_LOCATION,
            "model": settings.GEMINI_MODEL,
        }
    except Exception as e:
        return {"configured": False, "reason": f"{type(e).__name__}: {e}"}

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
from functools import lru_cache
from pathlib import Path
from typing import Any

from google import genai
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

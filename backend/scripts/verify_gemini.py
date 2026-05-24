"""Standalone smoke test for Gemini/Vertex AI auth.

Run from backend/ with venv activated:
    python scripts/verify_gemini.py

Verifies:
  1. .env loaded
  2. service_account.json found
  3. credentials parse + scope OK
  4. Vertex AI reachable + model responds
"""
from __future__ import annotations

import sys
from pathlib import Path

# Make `app` importable when running this file directly.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from app.services.ai_service import generate_text, health_check  # noqa: E402


def main() -> int:
    print("=== Gemini config ===")
    hc = health_check()
    for k, v in hc.items():
        print(f"  {k}: {v}")
    if not hc.get("configured"):
        print("\nFAIL: configuration incomplete. Fix backend/.env and re-run.")
        return 1

    print("\n=== Live call ===")
    try:
        out = generate_text("Reply with exactly the single word: OK")
        print(f"  Model response: {out!r}")
    except Exception as e:
        print(f"\nFAIL: API call raised {type(e).__name__}: {e}")
        return 2

    print("\nPASS: Gemini/Vertex AI reachable with service-account auth.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

# SplitSmart

Intelligent expense-splitting web app — built for the Shortcut Asia Internship Challenge 2026.

See [SplitSmart_PRD.md](./SplitSmart_PRD.md) for the full product spec.

This repo currently contains the **Tier 1 core** scaffold:
- FastAPI backend (`backend/`) — Groups CRUD, Expenses CRUD with equal/exact/percentage splits, Balance engine with greedy debt simplification, Settlement recording
- Next.js 14 frontend (`frontend/`) — Supabase auth, group/expense UI, balance + settlement view

Out of scope for this scaffold (planned for future iterations): multi-currency conversion, activity timeline, analytics dashboard, AI receipt scanning + NLP, Three.js visual polish.

---

## Prerequisites

- **Node.js 20+** (for Next.js 14 + App Router)
- **Python 3.11+**
- **Supabase project** — create one at [supabase.com](https://supabase.com), then run every SQL block from PRD §4 in the Supabase SQL Editor *in order*. Also create the `receipts` storage bucket per the same section.
- **Gemini access via Vertex AI** — a GCP **service account JSON key** (no API key required). See [Gemini / Vertex AI setup](#gemini--vertex-ai-setup) below.

## Repo layout

```
SplitSmart/
├── backend/      FastAPI + SQLAlchemy + Supabase JWT verify
├── frontend/     Next.js 14 (App Router) + Tailwind + shadcn/ui + Supabase JS
└── SplitSmart_PRD.md
```

---

## Backend setup

The Python virtualenv lives at `backend/.venv/` — **never install requirements into the global Python env.**

```powershell
# from repo root
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
# edit .env with your Supabase URL / service key / DATABASE_URL
```

Run the dev server:

```powershell
# venv still activated
uvicorn app.main:app --reload --port 8000
```

- Health check: `http://localhost:8000/health`
- OpenAPI docs: `http://localhost:8000/docs`

Run tests:

```powershell
pytest -q
```

---

## Gemini / Vertex AI setup

SplitSmart calls Gemini through **Vertex AI** using a service-account JSON key — no Gemini API key required.

### One-time GCP setup

1. In GCP Console, pick (or create) a project. Note the **project ID**.
2. Enable the **Vertex AI API**: `gcloud services enable aiplatform.googleapis.com` (or via Console → APIs & Services).
3. Create a service account with the **Vertex AI User** (`roles/aiplatform.user`) IAM role.
4. Create a JSON key for the service account and download it.
5. Save the JSON file at `backend/service_account.json` (the path is gitignored by `service_account*.json`).

### Configure `backend/.env`

```dotenv
GOOGLE_APPLICATION_CREDENTIALS=./service_account.json
GCP_PROJECT_ID=your-gcp-project-id        # optional — read from JSON if omitted
GCP_LOCATION=us-central1
GEMINI_MODEL=gemini-2.0-flash              # optional override
```

### Verify auth end-to-end

With the backend venv activated:

```powershell
python scripts/verify_gemini.py
```

Expected output ends with `PASS: Gemini/Vertex AI reachable with service-account auth.`

The backend also exposes two probe endpoints (both require a Supabase JWT):

- `GET  /api/v1/ai/health` — returns config diagnostics, makes no API call.
- `POST /api/v1/ai/echo`   — sends `{"prompt": "..."}` to Gemini and returns the text response.

The factory lives in `backend/app/services/ai_service.py` and is reused by Tier 3 receipt OCR + NLP expense parsing once those land.

> **Security:** never commit `service_account.json`. The repo's `.gitignore` already blocks `service_account*.json`, `*-service-account.json`, and `gcp-credentials*.json`, but verify with `git status` before pushing.

---

## Frontend setup

```powershell
# from repo root
cd frontend
npm install
copy .env.local.example .env.local
# edit .env.local with NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / NEXT_PUBLIC_API_URL
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## End-to-end flow (after Supabase is configured)

1. Register a user on `/register`.
2. Repeat for 2-3 test users (so you have group members to split with).
3. Create a group on `/groups`, share the invite code with the other users.
4. Have other users join the group via invite code.
5. Add expenses with different split types (equal / exact / percentage).
6. View `/groups/[id]` → Balances tab to see the optimized settlement plan.
7. Record a settlement; balances update.

Without a real Supabase project + the PRD §4 schema applied, auth and DB-backed flows will not work — the scaffold itself runs but every protected request returns 401.

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind, shadcn/ui, axios, Supabase JS |
| Backend | FastAPI, SQLAlchemy (async), Pydantic v2, httpx |
| DB / Auth | Supabase (Postgres + Auth) |

---

## License

For evaluation / internship submission use only.

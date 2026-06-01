# SplitSmart

Intelligent expense-splitting web app — built for the Shortcut Asia Internship Challenge 2026.

This repo contains:
- FastAPI backend (`backend/`) — Groups CRUD, Expenses CRUD with equal/exact/percentage/itemized splits, balance engine with greedy debt simplification, settlement recording, activity feed, analytics, and AI receipt OCR + NLP expense parsing (Vertex AI Gemini)
- Next.js 14 frontend (`frontend/`) — Supabase auth, group/expense UI, balance + settlement view, analytics dashboard, and a Three.js landing scene

---

## Prerequisites

- **Node.js 20+** (for Next.js 14 + App Router)
- **Python 3.11+**
- **Supabase project** — create one at [supabase.com](https://supabase.com), then apply the database schema (tables in `backend/migrations/` plus the base schema for profiles, groups, group_members, expenses, expense_splits, and settlements) in the Supabase SQL Editor *in order*. Also create a `receipts` storage bucket.
- **Gemini access via Vertex AI** — a GCP **service account JSON key** (no API key required). See [Gemini / Vertex AI setup](#gemini--vertex-ai-setup) below.

## Repo layout

```
SplitSmart/
├── backend/      FastAPI + SQLAlchemy + Supabase JWT verify
└── frontend/     Next.js 14 (App Router) + Tailwind + shadcn/ui + Supabase JS
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

The backend exposes one probe endpoint (requires a Supabase JWT):

- `GET  /api/v1/ai/health` — returns config diagnostics, makes no API call.

The factory lives in `backend/app/services/ai_service.py` and powers receipt OCR (`POST /api/v1/ai/scan-receipt`) + NLP expense parsing (`POST /api/v1/ai/parse-expense`).

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

Other scripts:

```powershell
npm test            # run unit tests (Vitest)
npm run format      # format src/ with Prettier
npm run format:check
```

---

## End-to-end flow (after Supabase is configured)

1. Register a user on `/register`.
2. Repeat for 2-3 test users (so you have group members to split with).
3. Create a group on `/groups`, share the invite code with the other users.
4. Have other users join the group via invite code.
5. Add expenses with different split types (equal / exact / percentage).
6. View `/groups/[id]` → Balances tab to see the optimized settlement plan.
7. Record a settlement; balances update.

Without a real Supabase project + the database schema applied, auth and DB-backed flows will not work — the scaffold itself runs but every protected request returns 401.

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind, shadcn/ui, axios, Supabase JS |
| Backend | FastAPI, SQLAlchemy (async), Pydantic v2, httpx |
| DB / Auth | Supabase (Postgres + Auth) |

---

## Security

Hardening implemented for a production-style deployment:

- **Authentication** — Supabase-issued JWTs verified server-side against Supabase's JWKS (issuer, audience, and expiry checked). No per-request network call. Verification lives in `backend/app/utils/auth.py`.
- **Authorization** — every group-scoped endpoint checks the caller is a member of the group; expenses can only be edited/deleted by the original payer, and reassigning `paid_by` is restricted to existing group members.
- **Rate limiting** — `slowapi` middleware keyed by user id (falling back to client IP). Global default of 100/min, with tighter limits on abuse-prone routes: invite-code join (10/min) and the AI endpoints (15/min). Limits are in-memory, so on a multi-instance deploy (Cloud Run) they apply per instance; **Redis is the upgrade path for global limits.**
- **Security headers** — backend sends `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, and HSTS (in production) via middleware; the frontend sets a CSP plus the same headers in `next.config.mjs`.
- **CORS** — restricted to the origins in `ALLOWED_ORIGINS`, with explicit method/header allowlists (no wildcards).
- **Input validation** — Pydantic schemas enforce types, lengths, enums, and amount/percentage constraints; uploads are MIME- and size-limited (5 MB).
- **Secrets** — `.env` and `service_account.json` are gitignored and were never committed. Run `git status` before pushing.

**Known hardening backlog (not load-bearing today):** broad Supabase Row-Level Security. All data flows through the FastAPI backend (which connects via `DATABASE_URL` and bypasses RLS), so RLS is defense-in-depth rather than the primary control. Adding it across all tables is the next step if the database is ever exposed to direct client access.

---

## Troubleshooting

- **Every protected request returns 401** — the JWT failed verification. Confirm `SUPABASE_URL` in `backend/.env` matches the project that issued the token, and that the frontend's `NEXT_PUBLIC_SUPABASE_URL` points at the same project.
- **Backend exits on startup in production** — required config (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `DATABASE_URL`) is missing. In `development` this only logs a warning.
- **Frontend throws "env vars missing" in the browser** — set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_API_URL` in `frontend/.env.local`.
- **Requests start returning 429** — you hit a rate limit; wait a minute or raise the limit in `backend/app/utils/rate_limit.py` / the per-route `@limiter.limit(...)` decorators.
- **AI endpoints return 502** — Vertex AI auth/config issue; run `python scripts/verify_gemini.py` from the backend venv.

---

## License

For evaluation / internship submission use only.

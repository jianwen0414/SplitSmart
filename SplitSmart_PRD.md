# SplitSmart — Product Requirements Document (PRD)

## For: Claude Code Implementation Reference

---

## 1. Project Overview

### 1.1 What Is This?

SplitSmart is an intelligent expense-splitting web application built for the **Shortcut Asia Internship Challenge 2026**. It is based on **Topic 2: Expense Splitter** from the challenge brief, enhanced with AI-powered features that solve real user friction points.

### 1.2 Problem Statement

Splitting expenses among friends during meals, trips, or shared living is tedious. Existing solutions require manual data entry for every expense, produce suboptimal settlement plans with too many transactions, and lack intelligence around currency conversion for cross-border trips. SplitSmart solves these with a clean UI, a smart debt-simplification algorithm, and AI-powered receipt scanning and natural language expense entry.

### 1.3 Target Users

University students and young professionals in Malaysia who frequently share expenses during group meals, trips, and co-living situations.

### 1.4 Success Criteria (What Evaluators Care About)

- **Functionality**: The app works end-to-end — create group, add expenses, see balances, settle debts.
- **Code Quality**: Clean, readable, well-structured codebase with clear separation of concerns.
- **Problem-Solving**: Debt simplification algorithm, edge case handling, AI integration with graceful fallbacks.
- **Communication**: Clear documentation, explainable architecture, good demo story.

---

## 2. Tech Stack

### 2.1 Frontend

| Technology | Purpose |
|---|---|
| **Next.js 14+ (App Router)** | React framework, SSR, routing |
| **TypeScript** | Type safety (recommended by challenge) |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Pre-built accessible UI components |
| **Recharts** | Dashboard charts (pie, bar) |
| **Lucide React** | Icon library |
| **Axios** | HTTP client for API calls |
| **Three.js (r128)** | 3D animations — landing hero scene + settlement celebration |
| **@react-three/fiber** | React renderer for Three.js |
| **@react-three/drei** | Helper components for R3F (Float, Stars, etc.) |

### 2.2 Backend

| Technology | Purpose |
|---|---|
| **Python 3.11+** | Backend language |
| **FastAPI** | API framework with auto-generated OpenAPI docs |
| **SQLAlchemy 2.0** | ORM (async support) |
| **Pydantic v2** | Request/response validation |
| **Alembic** | Database migrations (optional, Supabase handles schema) |
| **Uvicorn** | ASGI server |
| **python-multipart** | File upload handling (receipt images) |
| **httpx** | Async HTTP client for external API calls |

### 2.3 Database

| Technology | Purpose |
|---|---|
| **Supabase (PostgreSQL)** | Managed database with auth |
| **Supabase Auth** | User authentication (email/password + OAuth) |
| **Supabase Storage** | Receipt image storage |

### 2.4 AI Layer

| Technology | Purpose |
|---|---|
| **Google Gemini Flash 2.0** | Receipt OCR + natural language parsing |
| **google-generativeai (Python SDK)** | Gemini API client |

### 2.5 Deployment

| Component | Platform |
|---|---|
| Frontend | **Vercel** |
| Backend | **Railway** or **Render** |
| Database | **Supabase** (managed) |

### 2.6 Repository Structure

```
splitsmart/
├── frontend/                   # Next.js application
│   ├── src/
│   │   ├── app/                # App Router pages
│   │   │   ├── (auth)/         # Auth pages (login, register)
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── register/
│   │   │   │       └── page.tsx
│   │   │   ├── (dashboard)/    # Protected pages
│   │   │   │   ├── groups/
│   │   │   │   │   ├── page.tsx              # Group list
│   │   │   │   │   ├── new/
│   │   │   │   │   │   └── page.tsx          # Create group
│   │   │   │   │   └── [groupId]/
│   │   │   │   │       ├── page.tsx          # Group detail (expenses + balances)
│   │   │   │   │       ├── expenses/
│   │   │   │   │       │   ├── new/
│   │   │   │   │       │   │   └── page.tsx  # Add expense (manual + AI)
│   │   │   │   │       │   └── [expenseId]/
│   │   │   │   │       │       └── page.tsx  # Expense detail / edit
│   │   │   │   │       ├── settle/
│   │   │   │   │       │   └── page.tsx      # Settlement view
│   │   │   │   │       ├── activity/
│   │   │   │   │       │   └── page.tsx      # Activity timeline
│   │   │   │   │       └── dashboard/
│   │   │   │   │           └── page.tsx      # Analytics dashboard
│   │   │   │   └── layout.tsx  # Dashboard layout with sidebar/nav
│   │   │   ├── layout.tsx      # Root layout
│   │   │   ├── page.tsx        # Landing page / redirect
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── ui/             # shadcn/ui components
│   │   │   ├── groups/         # Group-related components
│   │   │   │   ├── GroupCard.tsx
│   │   │   │   ├── GroupForm.tsx
│   │   │   │   └── MemberList.tsx
│   │   │   ├── expenses/       # Expense-related components
│   │   │   │   ├── ExpenseCard.tsx
│   │   │   │   ├── ExpenseForm.tsx
│   │   │   │   ├── SplitSelector.tsx
│   │   │   │   ├── ReceiptScanner.tsx
│   │   │   │   └── NaturalLanguageInput.tsx
│   │   │   ├── balances/       # Balance-related components
│   │   │   │   ├── BalanceSummary.tsx
│   │   │   │   └── SettlementPlan.tsx
│   │   │   ├── dashboard/      # Dashboard components
│   │   │   │   ├── SpendingByCategory.tsx
│   │   │   │   ├── SpendingOverTime.tsx
│   │   │   │   └── MemberContribution.tsx
│   │   │   ├── activity/       # Activity timeline
│   │   │   │   └── ActivityFeed.tsx
│   │   │   ├── three/          # Three.js 3D components
│   │   │   │   ├── HeroScene.tsx          # Landing page 3D hero
│   │   │   │   ├── FloatingCoin.tsx       # Individual coin mesh
│   │   │   │   ├── FloatingReceipt.tsx    # Individual receipt mesh
│   │   │   │   └── SettlementConfetti.tsx # Celebration particle effect
│   │   │   └── layout/         # Layout components
│   │   │       ├── Navbar.tsx
│   │   │       ├── Sidebar.tsx
│   │   │       └── MobileNav.tsx
│   │   ├── lib/
│   │   │   ├── api.ts          # Axios instance + API client functions
│   │   │   ├── auth.ts         # Supabase auth helpers
│   │   │   ├── supabase.ts     # Supabase client init
│   │   │   ├── utils.ts        # Utility functions
│   │   │   └── types.ts        # Shared TypeScript types
│   │   └── hooks/
│   │       ├── useAuth.ts
│   │       ├── useGroups.ts
│   │       ├── useExpenses.ts
│   │       └── useBalances.ts
│   ├── public/
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                    # FastAPI application
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py             # FastAPI app entry point, CORS, lifespan
│   │   ├── config.py           # Environment variables / settings
│   │   ├── database.py         # SQLAlchemy engine + session
│   │   ├── models/             # SQLAlchemy ORM models
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── group.py
│   │   │   ├── expense.py
│   │   │   └── activity.py
│   │   ├── schemas/            # Pydantic request/response models
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── group.py
│   │   │   ├── expense.py
│   │   │   ├── balance.py
│   │   │   └── ai.py
│   │   ├── routers/            # API route handlers
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── groups.py
│   │   │   ├── expenses.py
│   │   │   ├── balances.py
│   │   │   ├── activity.py
│   │   │   └── ai.py
│   │   ├── services/           # Business logic layer
│   │   │   ├── __init__.py
│   │   │   ├── group_service.py
│   │   │   ├── expense_service.py
│   │   │   ├── balance_service.py    # Debt simplification algorithm
│   │   │   ├── currency_service.py   # Exchange rate conversion
│   │   │   ├── activity_service.py
│   │   │   └── ai_service.py         # Gemini integration
│   │   ├── utils/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py               # JWT / Supabase token verification
│   │   │   └── helpers.py
│   │   └── tests/              # pytest test files
│   │       ├── test_balance_service.py
│   │       ├── test_expense_service.py
│   │       └── test_ai_service.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
└── README.md                   # Project documentation
```

---

## 3. Database Schema

### 3.1 Entity Relationship Overview

```
users
  └── group_members (many-to-many)
        └── groups
              ├── expenses
              │     └── expense_splits
              └── activities
```

### 3.2 Tables

#### 3.2.1 `profiles`

Extends Supabase's built-in `auth.users` table with app-specific data.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK, FK → auth.users.id | Matches Supabase auth user ID |
| display_name | VARCHAR(100) | NOT NULL | User's display name |
| avatar_url | TEXT | NULLABLE | Profile image URL |
| default_currency | VARCHAR(3) | NOT NULL, DEFAULT 'MYR' | User's preferred currency |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Account creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last profile update |

#### 3.2.2 `groups`

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK, DEFAULT gen_random_uuid() | Group identifier |
| name | VARCHAR(100) | NOT NULL | Group name (e.g., "KL Trip") |
| description | TEXT | NULLABLE | Optional group description |
| base_currency | VARCHAR(3) | NOT NULL, DEFAULT 'MYR' | Group's base currency for calculations |
| created_by | UUID | FK → profiles.id, NOT NULL | Group creator |
| invite_code | VARCHAR(8) | UNIQUE, NOT NULL | Shareable join code |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

#### 3.2.3 `group_members`

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| group_id | UUID | FK → groups.id, NOT NULL | |
| user_id | UUID | FK → profiles.id, NOT NULL | |
| nickname | VARCHAR(50) | NULLABLE | Display name override within group |
| role | VARCHAR(20) | NOT NULL, DEFAULT 'member' | 'admin' or 'member' |
| joined_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Unique constraint**: (group_id, user_id) — a user can only join a group once.

#### 3.2.4 `expenses`

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| group_id | UUID | FK → groups.id, NOT NULL | |
| paid_by | UUID | FK → profiles.id, NOT NULL | Who paid |
| amount | DECIMAL(12,2) | NOT NULL, CHECK > 0 | Total expense amount |
| currency | VARCHAR(3) | NOT NULL, DEFAULT 'MYR' | Currency of this expense |
| converted_amount | DECIMAL(12,2) | NULLABLE | Amount in group's base currency |
| exchange_rate | DECIMAL(12,6) | NULLABLE | Rate used for conversion |
| description | VARCHAR(255) | NOT NULL | What the expense is for |
| category | VARCHAR(50) | NOT NULL, DEFAULT 'general' | Expense category |
| split_type | VARCHAR(20) | NOT NULL | 'equal', 'exact', 'percentage' |
| receipt_url | TEXT | NULLABLE | URL to receipt image in Supabase Storage |
| date | DATE | NOT NULL, DEFAULT CURRENT_DATE | When the expense occurred |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Valid categories**: 'food', 'transport', 'accommodation', 'entertainment', 'shopping', 'utilities', 'groceries', 'general'

**Valid split_types**: 'equal', 'exact', 'percentage'

#### 3.2.5 `expense_splits`

Records how each expense is divided among members.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| expense_id | UUID | FK → expenses.id ON DELETE CASCADE, NOT NULL | |
| user_id | UUID | FK → profiles.id, NOT NULL | Member who owes this share |
| amount | DECIMAL(12,2) | NOT NULL, CHECK >= 0 | Amount this member owes |
| percentage | DECIMAL(5,2) | NULLABLE | For percentage splits |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Unique constraint**: (expense_id, user_id) — one split per member per expense.

**Validation rule** (enforced in application logic): The SUM of all expense_splits.amount for a given expense_id MUST equal the parent expense.amount.

#### 3.2.6 `settlements`

Records when a member pays another to settle debts.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| group_id | UUID | FK → groups.id, NOT NULL | |
| paid_by | UUID | FK → profiles.id, NOT NULL | Who is paying (the debtor) |
| paid_to | UUID | FK → profiles.id, NOT NULL | Who is receiving (the creditor) |
| amount | DECIMAL(12,2) | NOT NULL, CHECK > 0 | Settlement amount |
| currency | VARCHAR(3) | NOT NULL, DEFAULT 'MYR' | |
| note | TEXT | NULLABLE | Optional note |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

#### 3.2.7 `activities`

Audit log for all group actions.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| group_id | UUID | FK → groups.id, NOT NULL | |
| user_id | UUID | FK → profiles.id, NOT NULL | Who performed the action |
| action | VARCHAR(50) | NOT NULL | Action type |
| entity_type | VARCHAR(50) | NOT NULL | 'expense', 'settlement', 'group', 'member' |
| entity_id | UUID | NULLABLE | ID of the affected entity |
| metadata | JSONB | DEFAULT '{}' | Additional context data |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Valid actions**: 'expense_created', 'expense_updated', 'expense_deleted', 'settlement_created', 'member_joined', 'member_left', 'group_updated'

**Metadata examples**:
- expense_created: `{"description": "Dinner at Jalan Alor", "amount": 120.00, "currency": "MYR"}`
- settlement_created: `{"paid_to_name": "Amir", "amount": 45.00}`
- member_joined: `{"member_name": "Priya"}`

---

## 4. Supabase SQL Commands

Run these in the Supabase SQL Editor (Dashboard → SQL Editor → New Query) in the exact order listed.

```sql
-- ============================================
-- SPLITSMART DATABASE SCHEMA
-- Run in Supabase SQL Editor in order
-- ============================================

-- 1. PROFILES TABLE
-- Extends Supabase auth.users with app-specific data
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    default_currency VARCHAR(3) NOT NULL DEFAULT 'MYR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, display_name, default_currency)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
        'MYR'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. GROUPS TABLE
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_currency VARCHAR(3) NOT NULL DEFAULT 'MYR',
    created_by UUID NOT NULL REFERENCES profiles(id),
    invite_code VARCHAR(8) UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 8),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. GROUP MEMBERS TABLE
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    nickname VARCHAR(50),
    role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(group_id, user_id)
);

-- 4. EXPENSES TABLE
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    paid_by UUID NOT NULL REFERENCES profiles(id),
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'MYR',
    converted_amount DECIMAL(12,2),
    exchange_rate DECIMAL(12,6),
    description VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'general'
        CHECK (category IN ('food', 'transport', 'accommodation', 'entertainment', 'shopping', 'utilities', 'groceries', 'general')),
    split_type VARCHAR(20) NOT NULL
        CHECK (split_type IN ('equal', 'exact', 'percentage')),
    receipt_url TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. EXPENSE SPLITS TABLE
CREATE TABLE expense_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    percentage DECIMAL(5,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(expense_id, user_id)
);

-- 6. SETTLEMENTS TABLE
CREATE TABLE settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    paid_by UUID NOT NULL REFERENCES profiles(id),
    paid_to UUID NOT NULL REFERENCES profiles(id),
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'MYR',
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. ACTIVITIES TABLE
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    action VARCHAR(50) NOT NULL
        CHECK (action IN ('expense_created', 'expense_updated', 'expense_deleted', 'settlement_created', 'member_joined', 'member_left', 'group_updated')),
    entity_type VARCHAR(50) NOT NULL
        CHECK (entity_type IN ('expense', 'settlement', 'group', 'member')),
    entity_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_expenses_group_id ON expenses(group_id);
CREATE INDEX idx_expenses_paid_by ON expenses(paid_by);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expense_splits_expense_id ON expense_splits(expense_id);
CREATE INDEX idx_expense_splits_user_id ON expense_splits(user_id);
CREATE INDEX idx_settlements_group_id ON settlements(group_id);
CREATE INDEX idx_activities_group_id ON activities(group_id);
CREATE INDEX idx_activities_created_at ON activities(created_at);
CREATE INDEX idx_groups_invite_code ON groups(invite_code);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read any profile, update only their own
CREATE POLICY "Profiles are viewable by authenticated users"
    ON profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Groups: members can view their groups
CREATE POLICY "Group members can view groups"
    ON groups FOR SELECT
    TO authenticated
    USING (
        id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Authenticated users can create groups"
    ON groups FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Group admins can update groups"
    ON groups FOR UPDATE
    TO authenticated
    USING (
        id IN (
            SELECT group_id FROM group_members
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Group Members: members can view co-members
CREATE POLICY "Group members can view members"
    ON group_members FOR SELECT
    TO authenticated
    USING (
        group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can join groups"
    ON group_members FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave groups"
    ON group_members FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Expenses: group members can CRUD expenses
CREATE POLICY "Group members can view expenses"
    ON expenses FOR SELECT
    TO authenticated
    USING (
        group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Group members can create expenses"
    ON expenses FOR INSERT
    TO authenticated
    WITH CHECK (
        group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Expense creator can update"
    ON expenses FOR UPDATE
    TO authenticated
    USING (paid_by = auth.uid());

CREATE POLICY "Expense creator can delete"
    ON expenses FOR DELETE
    TO authenticated
    USING (paid_by = auth.uid());

-- Expense Splits: inherit access from expense
CREATE POLICY "Group members can view splits"
    ON expense_splits FOR SELECT
    TO authenticated
    USING (
        expense_id IN (
            SELECT id FROM expenses
            WHERE group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Group members can create splits"
    ON expense_splits FOR INSERT
    TO authenticated
    WITH CHECK (
        expense_id IN (
            SELECT id FROM expenses
            WHERE group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Group members can delete splits"
    ON expense_splits FOR DELETE
    TO authenticated
    USING (
        expense_id IN (
            SELECT id FROM expenses
            WHERE group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
        )
    );

-- Settlements: group members can view and create
CREATE POLICY "Group members can view settlements"
    ON settlements FOR SELECT
    TO authenticated
    USING (
        group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Group members can create settlements"
    ON settlements FOR INSERT
    TO authenticated
    WITH CHECK (
        group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
        AND paid_by = auth.uid()
    );

-- Activities: group members can view
CREATE POLICY "Group members can view activities"
    ON activities FOR SELECT
    TO authenticated
    USING (
        group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Group members can create activities"
    ON activities FOR INSERT
    TO authenticated
    WITH CHECK (
        group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    );

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_groups_updated_at
    BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SUPABASE STORAGE BUCKET FOR RECEIPTS
-- ============================================
-- Run this in Supabase Dashboard → Storage → Create Bucket
-- Bucket name: receipts
-- Public: false
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp

-- Storage policies (run in SQL editor after creating bucket):
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'receipts',
    'receipts',
    false,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
);

CREATE POLICY "Authenticated users can upload receipts"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'receipts');

CREATE POLICY "Authenticated users can view receipts"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'receipts');
```

---

## 5. Feature Specifications

### 5.1 TIER 1 — Core Features (Must Have)

#### Feature 1: Group Expense Tracker

**User Stories:**
- As a user, I can create a new expense group with a name and base currency.
- As a user, I can invite friends to join my group via a shareable invite code.
- As a user, I can log an expense specifying who paid, the amount, description, category, and how to split it.
- As a user, I can choose between equal, exact amount, or percentage-based splits.
- As a user, I can edit or delete expenses I created.

**API Endpoints:**

```
POST   /api/v1/groups                          → Create group
GET    /api/v1/groups                          → List user's groups
GET    /api/v1/groups/{group_id}               → Get group details + members
PUT    /api/v1/groups/{group_id}               → Update group
POST   /api/v1/groups/join                     → Join group via invite code
DELETE /api/v1/groups/{group_id}/members/{user_id} → Leave/remove from group

POST   /api/v1/groups/{group_id}/expenses      → Create expense
GET    /api/v1/groups/{group_id}/expenses      → List group expenses (paginated, filterable)
GET    /api/v1/groups/{group_id}/expenses/{id} → Get expense detail with splits
PUT    /api/v1/groups/{group_id}/expenses/{id} → Update expense
DELETE /api/v1/groups/{group_id}/expenses/{id} → Delete expense
```

**Expense Creation Request Schema:**

```json
{
    "amount": 120.00,
    "currency": "MYR",
    "description": "Dinner at Jalan Alor",
    "category": "food",
    "date": "2026-05-25",
    "split_type": "equal",
    "splits": [
        {"user_id": "uuid-1"},
        {"user_id": "uuid-2"},
        {"user_id": "uuid-3"}
    ]
}
```

For **exact** split_type:
```json
{
    "split_type": "exact",
    "splits": [
        {"user_id": "uuid-1", "amount": 50.00},
        {"user_id": "uuid-2", "amount": 40.00},
        {"user_id": "uuid-3", "amount": 30.00}
    ]
}
```

For **percentage** split_type:
```json
{
    "split_type": "percentage",
    "splits": [
        {"user_id": "uuid-1", "percentage": 50.0},
        {"user_id": "uuid-2", "percentage": 30.0},
        {"user_id": "uuid-3", "percentage": 20.0}
    ]
}
```

**Validation Rules:**
- For equal splits: amount is divided equally. Handle rounding by assigning the remainder cent(s) to the first member(s). E.g., RM100 ÷ 3 = RM33.34, RM33.33, RM33.33.
- For exact splits: sum of split amounts MUST equal expense amount. Return 400 if not.
- For percentage splits: percentages MUST sum to 100.0. Calculate amounts from percentages, handle rounding same as equal.
- The payer (paid_by) does NOT need to be in the splits list. They may pay for others without being part of the split.

#### Feature 2: Smart Balance Engine & Settlement

**User Stories:**
- As a user, I can see each member's net balance in the group (positive = owed money, negative = owes money).
- As a user, I can see the optimized settlement plan showing the minimum number of transactions to settle all debts.
- As a user, I can record a settlement payment between two members.

**API Endpoints:**

```
GET    /api/v1/groups/{group_id}/balances       → Get all member balances
GET    /api/v1/groups/{group_id}/settlements     → Get optimized settlement plan
POST   /api/v1/groups/{group_id}/settlements     → Record a settlement
```

**Debt Simplification Algorithm (implement in `balance_service.py`):**

```
Input: List of all expenses and their splits for a group, plus any recorded settlements.

Step 1 — Calculate net balances:
    For each member:
        net_balance = (total they paid) - (total they owe from splits) + (settlements received) - (settlements paid)
    Positive = they are owed money. Negative = they owe money.

Step 2 — Simplify debts (greedy algorithm):
    Create two lists: creditors (positive balances, sorted descending) and debtors (negative balances, sorted by absolute value descending).
    
    transactions = []
    While creditors and debtors are not empty:
        Take the largest creditor and largest debtor.
        transfer_amount = min(creditor.balance, abs(debtor.balance))
        Record transaction: debtor pays creditor transfer_amount
        Update both balances.
        Remove anyone with balance == 0.
    
    Return transactions (this is the minimum settlement plan).

Step 3 — Handle rounding:
    All calculations use DECIMAL(12,2). 
    After simplification, verify total credits == total debits (should net to 0).
    If off by 0.01 due to rounding, adjust the smallest transaction.
```

**Balance Response Schema:**

```json
{
    "group_id": "uuid",
    "balances": [
        {
            "user_id": "uuid-1",
            "display_name": "Ali",
            "total_paid": 250.00,
            "total_owed": 180.00,
            "settlements_paid": 0,
            "settlements_received": 0,
            "net_balance": 70.00
        }
    ],
    "settlement_plan": [
        {
            "from": {"user_id": "uuid-2", "display_name": "Priya"},
            "to": {"user_id": "uuid-1", "display_name": "Ali"},
            "amount": 45.00,
            "currency": "MYR"
        }
    ],
    "is_settled": false
}
```

---

### 5.2 TIER 2 — Enhancement Features

#### Feature 3: Activity Timeline

**User Stories:**
- As a user, I can see a chronological feed of all group activity.
- As a user, I can filter activities by type and member.

**API Endpoint:**

```
GET /api/v1/groups/{group_id}/activities?type=expense_created&member=uuid&limit=20&offset=0
```

**Implementation Notes:**
- Activities are created automatically by the backend whenever an expense, settlement, or membership change occurs. The frontend does NOT create activity records directly.
- Store human-readable metadata in the JSONB field so the frontend can render meaningful messages without extra queries.
- Activity feed is sorted by `created_at DESC`.

#### Feature 4: Multi-Currency Support

**User Stories:**
- As a user, I can log expenses in any currency.
- The system automatically converts foreign currencies to the group's base currency for balance calculations.

**Implementation Notes:**
- Use the free ExchangeRate API: `https://api.exchangerate-api.com/v4/latest/{base}` or `https://open.er-api.com/v6/latest/{base}` (no API key required).
- Cache exchange rates in memory for 1 hour (use a simple Python dict with timestamp).
- When an expense is created with a currency different from the group's base_currency:
  1. Fetch the exchange rate.
  2. Calculate `converted_amount = amount * rate`.
  3. Store both `amount` (original), `converted_amount`, and `exchange_rate` on the expense.
- Balance calculations always use `converted_amount` when present, falling back to `amount`.
- Supported currencies (at minimum): MYR, USD, SGD, THB, IDR, PHP, EUR, GBP, JPY, KRW, AUD, CNY.
- The frontend currency selector should show common currencies with their symbols.

#### Feature 5: Dashboard & Visual Analytics

**User Stories:**
- As a user, I can see a dashboard showing total group spending, spending by category, spending over time, and member contribution breakdown.

**API Endpoint:**

```
GET /api/v1/groups/{group_id}/analytics
```

**Response Schema:**

```json
{
    "total_spending": 1250.00,
    "currency": "MYR",
    "expense_count": 15,
    "by_category": [
        {"category": "food", "amount": 580.00, "percentage": 46.4},
        {"category": "transport", "amount": 320.00, "percentage": 25.6}
    ],
    "by_date": [
        {"date": "2026-05-20", "amount": 120.00},
        {"date": "2026-05-21", "amount": 85.00}
    ],
    "by_member": [
        {
            "user_id": "uuid-1",
            "display_name": "Ali",
            "total_paid": 450.00,
            "total_share": 416.67,
            "net": 33.33
        }
    ]
}
```

**Frontend Charts (use Recharts):**
- Spending by category → Donut/Pie chart
- Spending over time → Bar chart
- Member contribution vs consumption → Horizontal bar chart

---

### 5.3 TIER 3 — AI Features

#### Feature 6: Receipt Scanner (AI-Powered OCR)

**User Stories:**
- As a user, I can upload a photo of a receipt and the app automatically extracts the merchant name, total amount, date, line items, and currency.
- If extraction is uncertain, the form is pre-filled for me to review and correct before submitting.

**API Endpoint:**

```
POST /api/v1/ai/scan-receipt
Content-Type: multipart/form-data
Body: image file (JPEG, PNG, WebP; max 5MB)
```

**Response Schema:**

```json
{
    "success": true,
    "confidence": "high",
    "data": {
        "merchant": "Restoran Nasi Kandar Pelita",
        "total_amount": 45.60,
        "currency": "MYR",
        "date": "2026-05-25",
        "category": "food",
        "line_items": [
            {"description": "Nasi Kandar", "amount": 12.50, "quantity": 2},
            {"description": "Teh Tarik", "amount": 3.50, "quantity": 3},
            {"description": "Roti Canai", "amount": 2.80, "quantity": 1}
        ]
    },
    "raw_text": "..."
}
```

**Gemini Prompt Template (for `ai_service.py`):**

```python
RECEIPT_SCAN_PROMPT = """
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
```

**Implementation Notes:**
- Upload the receipt image to Supabase Storage first, then pass the image bytes to Gemini.
- Use Gemini's vision capability: `model.generate_content([prompt, image_part])`.
- Parse the JSON response with a try/except. If parsing fails, return `{"success": false, "error": "Could not parse receipt"}`.
- The frontend should show a pre-filled expense form with extracted data, allowing the user to review and correct before submitting.
- Add a "confidence" field based on how many fields were successfully extracted: "high" (all fields), "medium" (missing 1-2 fields), "low" (missing 3+).

#### Feature 7: Natural Language Expense Entry

**User Stories:**
- As a user, I can type a natural sentence like "Lunch at Nando's RM85 split with Amir and Priya" and the app parses it into a structured expense.
- If parsing is uncertain, the form is pre-filled for me to correct.

**API Endpoint:**

```
POST /api/v1/ai/parse-expense
Body: {
    "text": "Lunch at Nando's RM85 split with Amir and Priya",
    "group_id": "uuid",
    "group_members": [
        {"user_id": "uuid-1", "display_name": "Ali"},
        {"user_id": "uuid-2", "display_name": "Amir"},
        {"user_id": "uuid-3", "display_name": "Priya"}
    ]
}
```

**Response Schema:**

```json
{
    "success": true,
    "confidence": "high",
    "data": {
        "description": "Lunch at Nando's",
        "amount": 85.00,
        "currency": "MYR",
        "category": "food",
        "date": "2026-05-25",
        "paid_by_name": "Ali",
        "split_type": "equal",
        "split_among": ["Amir", "Priya"]
    }
}
```

**Gemini Prompt Template:**

```python
NLP_EXPENSE_PROMPT = """
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
```

**Implementation Notes:**
- The frontend provides a text input field with a "magic wand" icon. User types naturally, hits enter.
- The backend receives the text along with the group context (member names) so Gemini can match names.
- Fuzzy name matching: Gemini handles this in the prompt, but the backend should also validate that returned names exist in the group member list. If a name doesn't match any member, flag it for the user to resolve.
- The frontend shows a pre-filled form with parsed data. User confirms or edits, then submits normally through the standard expense creation flow.
- If Gemini returns unparseable output, the frontend shows an error toast and opens the blank manual form.

---

### 5.4 TIER 4 — 3D Visual Polish (Three.js)

These are scoped, self-contained Three.js elements that add visual distinction without affecting core functionality. They are built using `@react-three/fiber` (R3F) and `@react-three/drei` — the React wrappers for Three.js. All 3D components MUST be wrapped in Next.js `dynamic(() => import(...), { ssr: false })` to prevent server-side rendering crashes since Three.js requires the browser's WebGL context.

**Important Three.js constraints for this environment:**
- Three.js version is r128. `THREE.CapsuleGeometry` is NOT available (r142+). Use `CylinderGeometry` + `SphereGeometry` combinations instead.
- `THREE.OrbitControls` is NOT available as a direct import. Use `@react-three/drei`'s `<OrbitControls />` component instead.
- All 3D components must be client-side only — use `"use client"` directive and dynamic imports with `ssr: false`.
- Keep 3D scenes lightweight — no more than ~50 meshes per scene. Performance on low-end devices matters.

#### Feature 8: Landing Page 3D Hero Scene

**Location**: Landing page (`/`) — visible only to unauthenticated users.

**What it looks like**: A full-width canvas behind the hero text showing gently floating 3D coins, receipt-like rectangles, and subtle particle effects. The objects drift slowly, rotating on their axes, with a soft depth-of-field feel. Mouse movement creates a subtle parallax — objects shift slightly in the opposite direction of the cursor, creating depth.

**Technical Specification:**

```
Component: HeroScene.tsx
Wrapper: dynamic import with ssr: false

Scene composition:
├── Canvas (from @react-three/fiber)
│   ├── ambientLight (intensity: 0.5)
│   ├── pointLight (position: [10, 10, 10], intensity: 0.8)
│   ├── FloatingCoin × 5-7 instances
│   │   ├── Geometry: CylinderGeometry(radius=0.5, height=0.08, segments=32)
│   │   ├── Material: MeshStandardMaterial(color=#FFD700, metalness=0.8, roughness=0.2)
│   │   ├── Animation: useFrame() — slow Y-axis rotation (0.005 rad/frame) + sine-wave float on Y position
│   │   └── Random initial positions scattered in range x:[-4,4], y:[-2,2], z:[-2,1]
│   ├── FloatingReceipt × 3-4 instances
│   │   ├── Geometry: BoxGeometry(width=0.8, height=1.2, depth=0.02) — thin rectangle
│   │   ├── Material: MeshStandardMaterial(color=#FFFFFF, opacity=0.85, transparent=true)
│   │   ├── Animation: gentle tumble rotation on X and Z axes + sine-wave float
│   │   └── Random positions, offset from coins
│   ├── Stars (from @react-three/drei, count=100, small, subtle background sparkle)
│   └── Mouse parallax: useFrame + pointer state → camera.position.x/y lerps toward pointer * 0.3

Camera: perspective, fov=45, position=[0, 0, 6]
Background: transparent (CSS gradient on the parent div shows through)
```

**Performance safeguards:**
- Use `<Float>` from drei for simple bobbing instead of custom useFrame where possible.
- Set `frameloop="demand"` on Canvas if the scene is purely decorative (re-renders only on state change / pointer move).
- Add a `<Suspense fallback={null}>` around the Canvas content.
- On mobile (detect via viewport width < 768px): reduce coin count to 3, remove receipts, remove mouse parallax. Or consider replacing the entire 3D scene with a simpler CSS animation fallback on mobile for performance.

**Parent container styling:**
```
<div className="relative h-[60vh] min-h-[400px] overflow-hidden">
    {/* 3D Canvas — absolute positioned behind text */}
    <div className="absolute inset-0 z-0">
        <HeroScene />
    </div>
    {/* Hero text content — on top */}
    <div className="relative z-10 flex flex-col items-center justify-center h-full">
        <h1>SplitSmart</h1>
        <p>Split expenses. Not friendships.</p>
        <Button>Get Started</Button>
    </div>
</div>
```

#### Feature 9: Settlement Celebration Effect

**Location**: Balances tab on group detail page — triggers when all group balances reach zero (fully settled).

**What it looks like**: When the last settlement is recorded and all balances hit zero, a brief (3-4 second) 3D confetti burst erupts from the center of the screen. Colorful particles shoot upward and drift down with gravity. After the animation completes, it fades out and a "All settled up! 🎉" message remains.

**Technical Specification:**

```
Component: SettlementConfetti.tsx
Trigger: Parent passes `isSettled={true}` prop when all balances === 0

Approach: Particle system using instanced meshes for performance.

├── Canvas (from @react-three/fiber)
│   ├── <instancedMesh ref={meshRef} args={[null, null, PARTICLE_COUNT=80]}>
│   │   ├── Geometry: BoxGeometry(0.08, 0.08, 0.08) — small cubes
│   │   └── Material: MeshStandardMaterial(vertexColors=true)
│   ├── useFrame animation loop:
│   │   ├── On trigger: initialize particles with random upward velocities
│   │   │   ├── position: center of screen, slight random spread
│   │   │   ├── velocity: x=random(-2,2), y=random(4,8), z=random(-1,1)
│   │   │   └── color: random from palette [#FF6B6B, #4ECDC4, #45B7D1, #96CEB4, #FFEAA7, #DDA0DD, #98D8C8]
│   │   ├── Each frame: apply gravity (vy -= 0.06), update positions via dummy Object3D + setMatrixAt
│   │   └── After 3.5 seconds: fade out canvas opacity, then unmount
│   └── ambientLight + pointLight

Canvas props:
- style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 50 }}
- camera={{ position: [0, 0, 10], fov: 50 }}
```

**Trigger logic (in BalanceSummary.tsx or SettlementPlan.tsx):**
```typescript
const [showConfetti, setShowConfetti] = useState(false);
const prevIsSettled = useRef(false);

useEffect(() => {
    // Only trigger on transition from unsettled → settled (not on initial load of settled group)
    if (isSettled && !prevIsSettled.current) {
        setShowConfetti(true);
        const timer = setTimeout(() => setShowConfetti(false), 4000);
        return () => clearTimeout(timer);
    }
    prevIsSettled.current = isSettled;
}, [isSettled]);

// Render
{showConfetti && <SettlementConfetti />}
```

**Key behavior:**
- Only triggers on the TRANSITION to settled, not if the page loads already settled.
- Canvas has `pointerEvents: none` so it doesn't block UI interaction.
- Fixed position overlay that auto-removes after 4 seconds.
- Lightweight: 80 instanced cubes is trivial for any GPU.

---

## 6. API Architecture

### 6.1 Authentication Flow

The frontend uses Supabase Auth (client-side SDK) for login/signup. After authentication, the frontend sends the Supabase JWT access token in the `Authorization: Bearer <token>` header with every request to the FastAPI backend.

**FastAPI Auth Middleware (`utils/auth.py`):**

```python
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx

security = HTTPBearer()

SUPABASE_URL = settings.SUPABASE_URL
SUPABASE_KEY = settings.SUPABASE_SERVICE_KEY  # service_role key for server-side verification

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    """Verify Supabase JWT and return user data."""
    token = credentials.credentials
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                "Authorization": f"Bearer {token}",
                "apikey": SUPABASE_KEY
            }
        )
    
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return response.json()
```

### 6.2 CORS Configuration

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",         # Local dev
        "https://splitsmart.vercel.app", # Production (update with actual domain)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 6.3 Error Response Format

All API errors follow this consistent format:

```json
{
    "detail": {
        "code": "VALIDATION_ERROR",
        "message": "Split amounts do not sum to expense total",
        "field": "splits"
    }
}
```

Standard HTTP status codes:
- 200: Success
- 201: Created
- 400: Validation error
- 401: Unauthorized
- 403: Forbidden (not a group member)
- 404: Not found
- 500: Server error

### 6.4 Complete API Route Summary

```
AUTH
POST   /api/v1/auth/verify                    → Verify token + return profile

GROUPS
POST   /api/v1/groups                          → Create group
GET    /api/v1/groups                          → List user's groups
GET    /api/v1/groups/{group_id}               → Get group detail
PUT    /api/v1/groups/{group_id}               → Update group
POST   /api/v1/groups/join                     → Join via invite code
DELETE /api/v1/groups/{group_id}/members/{uid} → Leave group

EXPENSES
POST   /api/v1/groups/{group_id}/expenses      → Create expense
GET    /api/v1/groups/{group_id}/expenses      → List expenses (?category=&from=&to=&page=&limit=)
GET    /api/v1/groups/{group_id}/expenses/{id} → Get expense + splits
PUT    /api/v1/groups/{group_id}/expenses/{id} → Update expense
DELETE /api/v1/groups/{group_id}/expenses/{id} → Delete expense

BALANCES & SETTLEMENTS
GET    /api/v1/groups/{group_id}/balances      → Member balances + settlement plan
POST   /api/v1/groups/{group_id}/settlements   → Record settlement
GET    /api/v1/groups/{group_id}/settlements   → List settlements

ACTIVITY
GET    /api/v1/groups/{group_id}/activities    → Activity feed (?type=&limit=&offset=)

ANALYTICS
GET    /api/v1/groups/{group_id}/analytics     → Dashboard data

AI
POST   /api/v1/ai/scan-receipt                 → Upload receipt → parsed data
POST   /api/v1/ai/parse-expense                → Natural language → parsed data
```

---

## 7. Frontend Page Specifications

### 7.1 Landing Page (`/`)

If authenticated → redirect to `/groups`. If not → show the landing page with:
- **3D Hero Section**: Full-width HeroScene component (see Feature 8 in Section 5.4) with floating coins and receipts behind the hero text. The hero text ("SplitSmart — Split expenses. Not friendships.") sits on top with CTA buttons for login/register.
- Below the hero: brief feature highlights (3 cards: Smart Splitting, AI Receipt Scanner, Multi-Currency) with icons, then a final CTA.
- The HeroScene MUST be dynamically imported with `ssr: false` to avoid hydration errors.

### 7.2 Auth Pages (`/login`, `/register`)

- Use Supabase Auth UI or custom form.
- Email + password authentication.
- Optional: Google OAuth for faster onboarding.
- After login → redirect to `/groups`.

### 7.3 Groups List (`/groups`)

- Card grid showing all user's groups.
- Each card shows: group name, member count, total spending, base currency.
- "Create Group" button opens a modal/page.
- "Join Group" button with invite code input.

### 7.4 Group Detail (`/groups/[groupId]`)

This is the main working page. It has a tabbed or sidebar layout with sections:

**Expenses Tab (default view):**
- List of all expenses, most recent first.
- Each row: description, amount, who paid, date, category badge, split type icon.
- "Add Expense" FAB/button → opens expense form.
- Click expense → detail/edit view.

**Balances Tab:**
- Summary cards showing each member's net balance (green for positive, red for negative).
- Settlement plan section: list of optimized transactions (e.g., "Priya pays Ali RM45.00").
- "Record Settlement" button for each suggested transaction.

**Activity Tab:**
- Chronological feed with filter chips (All, Expenses, Settlements, Members).

**Dashboard Tab:**
- Charts rendered with Recharts.
- Category donut chart, spending-over-time bar chart, member contribution chart.

### 7.5 Add Expense Page (`/groups/[groupId]/expenses/new`)

Three entry modes, selectable via tabs at the top:

**Manual Entry (default):**
- Form fields: Description, Amount, Currency selector, Category dropdown, Date picker, Who paid (member dropdown), Split type selector (equal/exact/percentage), Member checkboxes for who's included.
- For exact/percentage: show per-member input fields that appear when those split types are selected.
- Running validation: show warning if splits don't sum correctly.

**Scan Receipt (AI):**
- Camera/file upload button.
- Loading state while Gemini processes.
- Results populate the manual form for review.
- User confirms or edits, then submits.

**Quick Entry (AI Natural Language):**
- Large text input with placeholder: "e.g., Dinner at Jalan Alor RM120 split with Amir and Priya"
- Submit → loading → pre-filled form for review → confirm.

### 7.6 UI/UX Guidelines

- **Color scheme**: Clean, modern. Primary: indigo/blue. Success: green. Danger: red. Neutral: slate/gray.
- **Typography**: Inter or system font stack.
- **Mobile-first**: All pages must work on mobile. Use responsive breakpoints.
- **Loading states**: Skeleton loaders for data fetching, spinner for AI processing.
- **Empty states**: Friendly illustrations/messages when no groups, no expenses, etc.
- **Toast notifications**: For success/error feedback on actions.
- **Dark mode**: Optional but nice to have. Tailwind's `dark:` classes make this straightforward.

---

## 8. Environment Variables

### 8.1 Frontend (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
NEXT_PUBLIC_API_URL=http://localhost:8000  (or production URL)
```

### 8.2 Backend (`.env`)

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOi...   (service_role key, NOT anon key)
SUPABASE_ANON_KEY=eyJhbGciOi...
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
GEMINI_API_KEY=AIzaSy...
ENVIRONMENT=development  (or production)
ALLOWED_ORIGINS=http://localhost:3000,https://splitsmart.vercel.app
```

---

## 9. Development Sequence

This is the recommended build order. Each step produces a testable increment.

### Day 1: Foundation
1. Initialize Next.js project with TypeScript, Tailwind, shadcn/ui.
2. Initialize FastAPI project with folder structure.
3. Set up Supabase project — run all SQL commands from Section 4.
4. Implement Supabase Auth on frontend (login, register, session management).
5. Implement auth middleware on backend (JWT verification).
6. Build the Groups CRUD (backend routes + frontend pages).
7. Verify: Can create a group, see it in the list, join via invite code.

### Day 2: Core Expense Flow
1. Build expense CRUD endpoints (backend).
2. Build expense form (frontend) with all three split types.
3. Implement split validation logic.
4. Build expense list view on group detail page.
5. Verify: Can add expenses with equal/exact/percentage splits, see them listed.

### Day 3: Balance Engine
1. Implement the debt simplification algorithm in `balance_service.py`.
2. Build balance + settlement API endpoints.
3. Build the balance summary UI with settlement plan.
4. Implement settlement recording.
5. Write unit tests for the balance algorithm (edge cases: single member, all equal, rounding).
6. Verify: Balances calculate correctly, settlement plan minimizes transactions.

### Day 4: Enhancements
1. Add multi-currency support (exchange rate fetching, conversion on expense creation).
2. Build the activity timeline (backend auto-logging + frontend feed).
3. Build the analytics dashboard (backend aggregation + frontend charts).
4. Add currency selector to expense form.
5. Verify: Foreign currency expenses convert correctly, activity logs appear, charts render.

### Day 5: AI Features
1. Set up Gemini integration in `ai_service.py`.
2. Implement receipt scanning endpoint + frontend upload flow.
3. Implement natural language parsing endpoint + frontend input.
4. Build the pre-fill → review → confirm flow for both AI features.
5. Test with real Malaysian receipts (Grab, restaurants, convenience stores).
6. Verify: Receipt scanning extracts data, NLP parses natural sentences, fallback to manual form works.

### Day 6: Three.js + Polish
1. Install Three.js dependencies: `@react-three/fiber`, `@react-three/drei`, `three`.
2. Build HeroScene.tsx with floating coins and receipts for the landing page.
3. Build SettlementConfetti.tsx particle effect with trigger logic.
4. Mobile responsiveness pass on all pages (including 3D fallbacks on mobile).
5. Error handling: network failures, empty states, validation messages.
6. Loading states and skeleton loaders.
7. Edge case fixes from testing (zero balances, single-person groups, decimal rounding).
8. Deploy frontend to Vercel, backend to Railway/Render.
9. End-to-end testing on deployed version.

### Day 7: Documentation & Demo
1. Write README.md with setup instructions, tech stack, architecture overview.
2. Create 1-2 flowcharts (expense creation flow, debt simplification algorithm).
3. Record 3-5 minute demo video.
4. Final deploy verification.
5. Submit.

---

## 10. Key Algorithm Reference

### 10.1 Debt Simplification — Pseudocode

```
function simplify_debts(expenses, splits, settlements, members):
    # Step 1: Calculate net balance for each member
    balances = {}
    for member in members:
        balances[member.id] = 0
    
    for expense in expenses:
        amount = expense.converted_amount or expense.amount
        balances[expense.paid_by] += amount  # payer is owed
    
    for split in splits:
        amount = split.amount
        # If the parent expense has a conversion, scale the split proportionally
        expense = get_expense(split.expense_id)
        if expense.converted_amount:
            ratio = expense.converted_amount / expense.amount
            amount = split.amount * ratio
        balances[split.user_id] -= amount  # member owes
    
    for settlement in settlements:
        balances[settlement.paid_by] += settlement.amount   # debtor paid, reduce debt
        balances[settlement.paid_to] -= settlement.amount   # creditor received, reduce credit
    
    # Step 2: Separate into creditors and debtors
    creditors = [(id, bal) for id, bal in balances.items() if bal > 0.01]
    debtors = [(id, abs(bal)) for id, bal in balances.items() if bal < -0.01]
    
    # Sort both descending by amount
    creditors.sort(key=lambda x: -x[1])
    debtors.sort(key=lambda x: -x[1])
    
    # Step 3: Greedy matching
    transactions = []
    i, j = 0, 0
    while i < len(creditors) and j < len(debtors):
        creditor_id, credit = creditors[i]
        debtor_id, debt = debtors[j]
        
        transfer = min(credit, debt)
        transfer = round(transfer, 2)
        
        transactions.append({
            "from": debtor_id,
            "to": creditor_id,
            "amount": transfer
        })
        
        creditors[i] = (creditor_id, round(credit - transfer, 2))
        debtors[j] = (debtor_id, round(debt - transfer, 2))
        
        if creditors[i][1] < 0.01:
            i += 1
        if debtors[j][1] < 0.01:
            j += 1
    
    return transactions
```

### 10.2 Equal Split Rounding

```
function split_equally(total_amount, num_members):
    base = floor(total_amount * 100 / num_members) / 100  # Round down to cents
    remainder_cents = round(total_amount * 100) - (round(base * 100) * num_members)
    
    splits = []
    for i in range(num_members):
        if i < remainder_cents:
            splits.append(base + 0.01)  # First N members get +1 cent
        else:
            splits.append(base)
    
    return splits

# Example: RM100 ÷ 3 = [33.34, 33.33, 33.33]
```

---

## 11. Testing Requirements

### 11.1 Backend Unit Tests (pytest)

**Critical tests for `balance_service.py`:**
- Two members, one expense, equal split → correct balances and one settlement.
- Three members, multiple expenses, mixed payers → verify net balances sum to zero.
- Debt simplification reduces N*(N-1)/2 possible debts to fewer transactions.
- Settlement recording correctly reduces outstanding balances.
- Rounding: RM100 split 3 ways → total of splits == 100.00 exactly.
- Edge: group with zero expenses → all balances zero, no settlements.
- Edge: one member paid everything → N-1 settlements.

**Tests for expense validation:**
- Exact split amounts not summing to total → 400 error.
- Percentage splits not summing to 100 → 400 error.
- Negative amount → 400 error.
- Non-member in splits → 400 error.

### 11.2 Frontend Testing

Manual testing checklist (no automated frontend tests required for this challenge):
- [ ] Login/register flow works
- [ ] Create group, see it listed
- [ ] Join group via invite code
- [ ] Add expense with each split type
- [ ] Balances update correctly after adding expenses
- [ ] Settlement plan shows correct minimized transactions
- [ ] Record settlement, balances update
- [ ] Multi-currency expense converts correctly
- [ ] Activity timeline shows all events
- [ ] Dashboard charts render with data
- [ ] Receipt scanner returns parsed data
- [ ] Natural language parser returns parsed data
- [ ] AI fallback: shows manual form on parse failure
- [ ] Mobile layout works on 375px width
- [ ] Empty states display correctly

---

## 12. Deployment Checklist

### 12.1 Supabase
- [ ] Project created
- [ ] All SQL from Section 4 executed
- [ ] Storage bucket "receipts" created
- [ ] Auth providers enabled (email, optional Google OAuth)
- [ ] API keys noted (anon key, service role key, project URL)

### 12.2 Backend (Railway/Render)
- [ ] GitHub repo connected
- [ ] Environment variables set (see Section 8.2)
- [ ] Build command: `pip install -r requirements.txt`
- [ ] Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- [ ] Health check endpoint: `GET /health` returns `{"status": "ok"}`
- [ ] CORS origins updated with production frontend URL

### 12.3 Frontend (Vercel)
- [ ] GitHub repo connected
- [ ] Environment variables set (see Section 8.1)
- [ ] `NEXT_PUBLIC_API_URL` points to production backend URL
- [ ] Build succeeds, pages load

### 12.4 Post-Deploy Verification
- [ ] End-to-end: register → create group → add expense → check balance → settle
- [ ] AI features work with production API keys
- [ ] No CORS errors in browser console
- [ ] Mobile responsive on real device

---

## 13. Documentation Deliverable Outline

The 1-2 page documentation should cover:

1. **Project Overview** (2-3 sentences): What SplitSmart is and the problem it solves.
2. **Tech Stack**: Frontend, backend, database, AI — and why each was chosen.
3. **Architecture**: High-level diagram showing Frontend ↔ FastAPI ↔ Supabase + Gemini.
4. **Key Technical Decisions**:
   - Why split architecture (Next.js + FastAPI) instead of monolith.
   - Debt simplification algorithm choice (greedy approach, why it works).
   - AI integration strategy (pre-fill + review pattern, graceful fallback).
5. **Flowcharts** (1-2):
   - Expense creation flow (manual vs AI entry → validation → save).
   - Debt simplification algorithm visualization.
6. **Challenges Faced**: Honest account of what was hard and how you solved it.
7. **Future Improvements**: What you'd add with more time (real-time updates via WebSockets, recurring expenses, payment integration, etc.).

---

*End of PRD. This document contains everything needed to build SplitSmart from scratch without ambiguity.*

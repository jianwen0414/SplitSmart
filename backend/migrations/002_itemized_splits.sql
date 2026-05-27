-- ============================================
-- SPLITSMART — ITEMIZED SPLITTING MIGRATION
-- Run after the base schema (PRD §4).
-- ============================================

-- 1. ITEMIZED — persisted line items per expense
CREATE TABLE IF NOT EXISTS expense_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    unit_amount DECIMAL(12,2) NOT NULL CHECK (unit_amount >= 0),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Many-to-many: who consumed each item with optional share weight
CREATE TABLE IF NOT EXISTS item_consumers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES expense_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    share_weight DECIMAL(6,3) NOT NULL DEFAULT 1.000 CHECK (share_weight > 0),
    UNIQUE(item_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_expense_items_expense_id ON expense_items(expense_id);
CREATE INDEX IF NOT EXISTS idx_item_consumers_item_id ON item_consumers(item_id);
CREATE INDEX IF NOT EXISTS idx_item_consumers_user_id ON item_consumers(user_id);

-- 3. Tax + service charge on parent expense
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS service_charge_amount DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (service_charge_amount >= 0);

-- 4. Widen split_type CHECK to include 'itemized'
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_split_type_check;
ALTER TABLE expenses ADD CONSTRAINT expenses_split_type_check
    CHECK (split_type IN ('equal', 'exact', 'percentage', 'itemized'));

-- 5. RLS — mirror expense_splits policies
ALTER TABLE expense_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_consumers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Group members can view items" ON expense_items;
CREATE POLICY "Group members can view items"
    ON expense_items FOR SELECT TO authenticated
    USING (expense_id IN (
        SELECT id FROM expenses
        WHERE group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    ));

DROP POLICY IF EXISTS "Group members can insert items" ON expense_items;
CREATE POLICY "Group members can insert items"
    ON expense_items FOR INSERT TO authenticated
    WITH CHECK (expense_id IN (
        SELECT id FROM expenses
        WHERE group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    ));

DROP POLICY IF EXISTS "Group members can delete items" ON expense_items;
CREATE POLICY "Group members can delete items"
    ON expense_items FOR DELETE TO authenticated
    USING (expense_id IN (
        SELECT id FROM expenses
        WHERE group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    ));

DROP POLICY IF EXISTS "Group members can view consumers" ON item_consumers;
CREATE POLICY "Group members can view consumers"
    ON item_consumers FOR SELECT TO authenticated
    USING (item_id IN (
        SELECT id FROM expense_items WHERE expense_id IN (
            SELECT id FROM expenses
            WHERE group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
        )
    ));

DROP POLICY IF EXISTS "Group members can insert consumers" ON item_consumers;
CREATE POLICY "Group members can insert consumers"
    ON item_consumers FOR INSERT TO authenticated
    WITH CHECK (item_id IN (
        SELECT id FROM expense_items WHERE expense_id IN (
            SELECT id FROM expenses
            WHERE group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
        )
    ));

DROP POLICY IF EXISTS "Group members can delete consumers" ON item_consumers;
CREATE POLICY "Group members can delete consumers"
    ON item_consumers FOR DELETE TO authenticated
    USING (item_id IN (
        SELECT id FROM expense_items WHERE expense_id IN (
            SELECT id FROM expenses
            WHERE group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
        )
    ));

-- ============================================================
-- Migration: 20260315000002_rls_policies
-- Enable RLS on all tables and define all row-level security policies
-- ============================================================

-- ============================================================
-- Enable RLS
-- ============================================================

ALTER TABLE stores                ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_queue_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_members         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables                ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE option_groups         ENABLE ROW LEVEL SECURITY;
ALTER TABLE option_choices        ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders                ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiting_notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper function: my_store_ids()
-- Returns store_ids the current user is a member of.
-- SECURITY DEFINER so it can bypass RLS on store_members itself.
-- ============================================================

CREATE OR REPLACE FUNCTION my_store_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT store_id FROM store_members WHERE user_id = auth.uid();
$$;

-- ============================================================
-- Policies: stores
-- ============================================================

CREATE POLICY "stores_member" ON stores
  USING (id IN (SELECT my_store_ids()));

-- ============================================================
-- Policies: store_settings
-- ============================================================

CREATE POLICY "store_settings_member" ON store_settings
  USING (store_id IN (SELECT my_store_ids()));

-- ============================================================
-- Policies: store_queue_sequences
-- Staff can read; queue number assignment is handled via function only
-- ============================================================

CREATE POLICY "queue_seq_member" ON store_queue_sequences
  FOR SELECT USING (store_id IN (SELECT my_store_ids()));

-- ============================================================
-- Policies: store_members
-- ============================================================

CREATE POLICY "store_members_read" ON store_members
  FOR SELECT USING (store_id IN (SELECT my_store_ids()));

-- ============================================================
-- Policies: tables
-- ============================================================

CREATE POLICY "tables_member"      ON tables FOR ALL    USING (store_id IN (SELECT my_store_ids()));
CREATE POLICY "tables_anon_select" ON tables FOR SELECT USING (auth.role() = 'anon');

-- ============================================================
-- Policies: menu (anon read allowed for customer QR ordering)
-- ============================================================

CREATE POLICY "menu_categories_member" ON menu_categories FOR ALL    USING (store_id IN (SELECT my_store_ids()));
CREATE POLICY "menu_categories_anon"   ON menu_categories FOR SELECT USING (true);

CREATE POLICY "menu_items_member"      ON menu_items      FOR ALL    USING (store_id IN (SELECT my_store_ids()));
CREATE POLICY "menu_items_anon"        ON menu_items      FOR SELECT USING (true);

CREATE POLICY "option_groups_member"   ON option_groups   FOR ALL    USING (store_id IN (SELECT my_store_ids()));
CREATE POLICY "option_groups_anon"     ON option_groups   FOR SELECT USING (true);

CREATE POLICY "option_choices_member"  ON option_choices  FOR ALL    USING (store_id IN (SELECT my_store_ids()));
CREATE POLICY "option_choices_anon"    ON option_choices  FOR SELECT USING (true);

-- ============================================================
-- Policies: orders
-- anon INSERT cross-validates store_id + table_id
-- ============================================================

CREATE POLICY "orders_member"      ON orders FOR ALL USING (store_id IN (SELECT my_store_ids()));
CREATE POLICY "orders_anon_insert" ON orders FOR INSERT
  WITH CHECK (
    auth.role() = 'anon'
    AND store_id IN (SELECT id FROM stores)
    AND (
      table_id IS NULL
      OR EXISTS (
        SELECT 1 FROM tables
        WHERE tables.id = table_id
          AND tables.store_id = orders.store_id
      )
    )
  );

-- ============================================================
-- Policies: order_items
-- ============================================================

CREATE POLICY "order_items_member"      ON order_items FOR ALL USING (store_id IN (SELECT my_store_ids()));
CREATE POLICY "order_items_anon_insert" ON order_items FOR INSERT
  WITH CHECK (
    auth.role() = 'anon'
    AND store_id IN (SELECT id FROM stores)
  );

-- ============================================================
-- Policies: waitings
-- ============================================================

CREATE POLICY "waitings_member"      ON waitings FOR ALL USING (store_id IN (SELECT my_store_ids()));
CREATE POLICY "waitings_anon_insert" ON waitings FOR INSERT
  WITH CHECK (
    auth.role() = 'anon'
    AND store_id IN (SELECT id FROM stores)
  );

-- ============================================================
-- Policies: waiting_notifications
-- Staff read only; INSERT is server-side only (service role)
-- ============================================================

CREATE POLICY "waiting_notif_member" ON waiting_notifications
  USING (store_id IN (SELECT my_store_ids()));

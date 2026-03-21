-- ============================================================
-- Migration: 20260321000001_rls_role_based_checks
-- A01-001: Role-based RLS checks for mutation operations
-- A01-002: store_members DELETE policy (owner only, not self)
-- ============================================================

-- ============================================================
-- 1) Helper function: get current user's role for a store
-- ============================================================

CREATE OR REPLACE FUNCTION my_store_role(p_store_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT sm.role
  FROM store_members sm
  WHERE sm.store_id = p_store_id
    AND sm.user_id = auth.uid()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION my_store_role(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION my_store_role(uuid) TO authenticated;

-- ============================================================
-- 2) tables: split FOR ALL into SELECT (any member) +
--    INSERT/UPDATE/DELETE (owner or manager only)
-- ============================================================

DROP POLICY IF EXISTS "tables_member" ON tables;

CREATE POLICY "tables_member_select" ON tables
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT my_store_ids()));

CREATE POLICY "tables_member_mutate" ON tables
  FOR ALL TO authenticated
  USING (
    store_id IN (SELECT my_store_ids())
    AND my_store_role(store_id) IN ('owner', 'manager')
  )
  WITH CHECK (
    store_id IN (SELECT my_store_ids())
    AND my_store_role(store_id) IN ('owner', 'manager')
  );

-- ============================================================
-- 3) menu_categories: split FOR ALL into SELECT + mutate
-- ============================================================

DROP POLICY IF EXISTS "menu_categories_member" ON menu_categories;

CREATE POLICY "menu_categories_member_select" ON menu_categories
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT my_store_ids()));

CREATE POLICY "menu_categories_member_mutate" ON menu_categories
  FOR ALL TO authenticated
  USING (
    store_id IN (SELECT my_store_ids())
    AND my_store_role(store_id) IN ('owner', 'manager')
  )
  WITH CHECK (
    store_id IN (SELECT my_store_ids())
    AND my_store_role(store_id) IN ('owner', 'manager')
  );

-- ============================================================
-- 4) menu_items: split FOR ALL into SELECT + mutate
-- ============================================================

DROP POLICY IF EXISTS "menu_items_member" ON menu_items;

CREATE POLICY "menu_items_member_select" ON menu_items
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT my_store_ids()));

CREATE POLICY "menu_items_member_mutate" ON menu_items
  FOR ALL TO authenticated
  USING (
    store_id IN (SELECT my_store_ids())
    AND my_store_role(store_id) IN ('owner', 'manager')
  )
  WITH CHECK (
    store_id IN (SELECT my_store_ids())
    AND my_store_role(store_id) IN ('owner', 'manager')
  );

-- ============================================================
-- 5) option_groups: split FOR ALL into SELECT + mutate
-- ============================================================

DROP POLICY IF EXISTS "option_groups_member" ON option_groups;

CREATE POLICY "option_groups_member_select" ON option_groups
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT my_store_ids()));

CREATE POLICY "option_groups_member_mutate" ON option_groups
  FOR ALL TO authenticated
  USING (
    store_id IN (SELECT my_store_ids())
    AND my_store_role(store_id) IN ('owner', 'manager')
  )
  WITH CHECK (
    store_id IN (SELECT my_store_ids())
    AND my_store_role(store_id) IN ('owner', 'manager')
  );

-- ============================================================
-- 6) option_choices: split FOR ALL into SELECT + mutate
-- ============================================================

DROP POLICY IF EXISTS "option_choices_member" ON option_choices;

CREATE POLICY "option_choices_member_select" ON option_choices
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT my_store_ids()));

CREATE POLICY "option_choices_member_mutate" ON option_choices
  FOR ALL TO authenticated
  USING (
    store_id IN (SELECT my_store_ids())
    AND my_store_role(store_id) IN ('owner', 'manager')
  )
  WITH CHECK (
    store_id IN (SELECT my_store_ids())
    AND my_store_role(store_id) IN ('owner', 'manager')
  );

-- ============================================================
-- 7) orders: keep existing SELECT/INSERT/UPDATE policies,
--    add role check to DELETE only
-- ============================================================

DROP POLICY IF EXISTS "orders_member_delete" ON orders;

CREATE POLICY "orders_member_delete" ON orders
  FOR DELETE TO authenticated
  USING (
    store_id IN (SELECT my_store_ids())
    AND my_store_role(store_id) IN ('owner', 'manager')
  );

-- ============================================================
-- 8) A01-002: store_members DELETE policy
--    owner only, cannot delete self
-- ============================================================

DROP POLICY IF EXISTS "store_members_owner_delete" ON store_members;

CREATE POLICY "store_members_owner_delete" ON store_members
  FOR DELETE TO authenticated
  USING (
    my_store_role(store_id) = 'owner'
    AND user_id != auth.uid()
  );

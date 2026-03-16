-- Drop ALL existing waitings policies and recreate cleanly.
-- Previous migrations left conflicting policies due to ALTER/DO block ordering issues.

DROP POLICY IF EXISTS "waitings_member" ON waitings;
DROP POLICY IF EXISTS "waitings_anon_insert" ON waitings;
DROP POLICY IF EXISTS "waitings_anon_select" ON waitings;

-- Authenticated members: full access to their store's waitings
CREATE POLICY "waitings_member" ON waitings
  FOR ALL TO authenticated
  USING (store_id IN (SELECT my_store_ids()));

-- Anonymous: INSERT allowed for accessible stores
CREATE POLICY "waitings_anon_insert" ON waitings
  FOR INSERT TO anon
  WITH CHECK (is_store_accessible(store_id));

-- Anonymous: SELECT allowed to check their waiting status
CREATE POLICY "waitings_anon_select" ON waitings
  FOR SELECT TO anon
  USING (is_store_accessible(store_id));

-- Fix SEC-001 policy v2: simplify WITH CHECK to remove subquery (causes RLS evaluation error)
-- The client only sends { is_first_login: false } — role column is not sent in this UPDATE.
-- Row-level filter (USING) ensures only is_first_login=true rows can be targeted.

DROP POLICY IF EXISTS "store_members_self_update_first_login" ON store_members;

CREATE POLICY "store_members_self_update_first_login" ON store_members
  FOR UPDATE
  USING (user_id = auth.uid() AND is_first_login = true)
  WITH CHECK (user_id = auth.uid() AND is_first_login = false);

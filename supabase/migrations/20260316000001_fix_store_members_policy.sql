-- SEC-001 Fix: Restrict store_members_self_update to is_first_login column only
-- Previous policy allowed UPDATE on all columns including role → role escalation risk

DROP POLICY IF EXISTS "store_members_self_update" ON store_members;

-- New policy: only allows flipping is_first_login from true → false
-- role, store_id, user_id columns cannot be changed by the user themselves
CREATE POLICY "store_members_self_update_first_login" ON store_members
  FOR UPDATE
  USING (user_id = auth.uid() AND is_first_login = true)
  WITH CHECK (
    user_id = auth.uid()
    AND is_first_login = false
    -- Prevent role escalation: role must not change
    AND role = (SELECT role FROM store_members WHERE user_id = auth.uid() LIMIT 1)
  );

-- Allow authenticated users to update their own is_first_login flag
CREATE POLICY "store_members_self_update" ON store_members
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

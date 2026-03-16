DO $$ BEGIN
  DROP POLICY IF EXISTS "waitings_member" ON waitings;
  CREATE POLICY "waitings_member" ON waitings FOR ALL TO authenticated USING (store_id IN (SELECT my_store_ids()));
END $$;

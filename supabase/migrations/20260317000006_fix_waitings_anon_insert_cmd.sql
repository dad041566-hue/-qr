DO $$ BEGIN
  DROP POLICY IF EXISTS "waitings_anon_insert" ON waitings;
  CREATE POLICY "waitings_anon_insert" ON waitings FOR INSERT WITH CHECK (auth.role() = 'anon' AND is_store_accessible(store_id));
END $$;

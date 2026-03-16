ALTER POLICY "waitings_anon_insert" ON waitings TO anon WITH CHECK (is_store_accessible(store_id));

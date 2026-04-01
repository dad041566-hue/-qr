-- waitings anon insert 정책 명시적으로 재생성
DROP POLICY IF EXISTS "waitings_anon_insert" ON waitings;

CREATE POLICY "waitings_anon_insert" ON waitings
  FOR INSERT
  WITH CHECK (
    is_store_accessible(store_id)
  );

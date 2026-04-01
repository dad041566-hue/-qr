-- ============================================================
-- Migration: 20260331000002_superadmin_rls_bypass_retry
-- 20260331000001 트랜잭션 롤백 가능성으로 재적용
-- CREATE OR REPLACE는 멱등이므로 중복 적용 무해
-- ============================================================

CREATE OR REPLACE FUNCTION my_store_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM stores
  WHERE (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  UNION
  SELECT store_id FROM store_members WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION my_store_role(p_store_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
    THEN 'owner'
    ELSE (
      SELECT sm.role
      FROM store_members sm
      WHERE sm.store_id = p_store_id
        AND sm.user_id = auth.uid()
      LIMIT 1
    )
  END;
$$;

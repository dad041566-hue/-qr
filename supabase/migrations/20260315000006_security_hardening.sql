-- ============================================================
-- Migration: 20260315000006_security_hardening
-- - is_first_login 플래그 추가
-- - 공개 조회/등록 시점에 사용 기간(accessibility) 정책 강화
-- - 테이블 접근을 위한 헬퍼 함수 추가
-- ============================================================

-- ============================================================
-- 1) is_first_login 컬럼
-- ============================================================

ALTER TABLE store_members
  ADD COLUMN IF NOT EXISTS is_first_login boolean NOT NULL DEFAULT false;

UPDATE store_members
SET is_first_login = false;

-- ============================================================
-- 2) 매장 이용 가능 여부 헬퍼
--    - is_active = true
--    - subscription_end is null or >= KST today
-- ============================================================

CREATE OR REPLACE FUNCTION is_store_accessible(p_store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS(
    SELECT 1
    FROM stores
    WHERE id = p_store_id
      AND is_active = true
      AND (
        subscription_end IS NULL
        OR subscription_end >= (now() AT TIME ZONE 'Asia/Seoul')::date
      )
  );
$$;

-- ============================================================
-- 3) 기존 정책 정리
-- ============================================================

DROP POLICY IF EXISTS "stores_member" ON stores;
DROP POLICY IF EXISTS "tables_anon_select" ON tables;
DROP POLICY IF EXISTS "menu_categories_member" ON menu_categories;
DROP POLICY IF EXISTS "menu_categories_anon" ON menu_categories;
DROP POLICY IF EXISTS "menu_items_member" ON menu_items;
DROP POLICY IF EXISTS "menu_items_anon" ON menu_items;
DROP POLICY IF EXISTS "option_groups_member" ON option_groups;
DROP POLICY IF EXISTS "option_groups_anon" ON option_groups;
DROP POLICY IF EXISTS "option_choices_member" ON option_choices;
DROP POLICY IF EXISTS "option_choices_anon" ON option_choices;
DROP POLICY IF EXISTS "orders_member" ON orders;
DROP POLICY IF EXISTS "orders_anon_insert" ON orders;
DROP POLICY IF EXISTS "order_items_member" ON order_items;
DROP POLICY IF EXISTS "order_items_anon_insert" ON order_items;
DROP POLICY IF EXISTS "waitings_member" ON waitings;
DROP POLICY IF EXISTS "waitings_anon_insert" ON waitings;

-- ============================================================
-- 4) stores: anonymous 조회 허용은 이용 가능 매장만
-- ============================================================

CREATE POLICY "stores_anon_active" ON stores
  FOR SELECT USING (is_store_accessible(id));

-- 멤버는 기존 규칙 유지
CREATE POLICY "stores_member" ON stores
  FOR SELECT USING (id IN (SELECT my_store_ids()));

-- ============================================================
-- 5) 메뉴/테이블 공개 조회는 이용 가능 매장만 허용
-- ============================================================

CREATE POLICY "tables_member" ON tables
  FOR ALL USING (store_id IN (SELECT my_store_ids()));

CREATE POLICY "tables_anon_active" ON tables
  FOR SELECT USING (
    auth.role() = 'anon'
    AND is_store_accessible(store_id)
  );

CREATE POLICY "menu_categories_member" ON menu_categories
  FOR ALL USING (store_id IN (SELECT my_store_ids()));

CREATE POLICY "menu_categories_anon" ON menu_categories
  FOR SELECT USING (
    auth.role() = 'anon'
    AND is_store_accessible(store_id)
  );

CREATE POLICY "menu_items_member" ON menu_items
  FOR ALL USING (store_id IN (SELECT my_store_ids()));

CREATE POLICY "menu_items_anon" ON menu_items
  FOR SELECT USING (
    auth.role() = 'anon'
    AND is_store_accessible(store_id)
  );

CREATE POLICY "option_groups_member" ON option_groups
  FOR ALL USING (store_id IN (SELECT my_store_ids()));

CREATE POLICY "option_groups_anon" ON option_groups
  FOR SELECT USING (
    auth.role() = 'anon'
    AND is_store_accessible(store_id)
  );

CREATE POLICY "option_choices_member" ON option_choices
  FOR ALL USING (store_id IN (SELECT my_store_ids()));

CREATE POLICY "option_choices_anon" ON option_choices
  FOR SELECT USING (
    auth.role() = 'anon'
    AND is_store_accessible(store_id)
  );

-- ============================================================
-- 6) 주문/웨이팅 익명 INSERT는 이용 가능 매장만 허용
-- ============================================================

CREATE POLICY "orders_member" ON orders
  FOR ALL USING (store_id IN (SELECT my_store_ids()));

CREATE POLICY "orders_anon_insert" ON orders
  WITH CHECK (
    auth.role() = 'anon'
    AND is_store_accessible(store_id)
    AND (
      table_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM tables
        WHERE tables.id = table_id
          AND tables.store_id = orders.store_id
      )
    )
  );

CREATE POLICY "order_items_member" ON order_items
  FOR ALL USING (store_id IN (SELECT my_store_ids()));

CREATE POLICY "order_items_anon_insert" ON order_items
  WITH CHECK (
    auth.role() = 'anon'
    AND is_store_accessible(store_id)
    AND EXISTS (
      SELECT 1
      FROM orders o
      WHERE o.id = order_id
        AND o.store_id = store_id
    )
  );

CREATE POLICY "waitings_member" ON waitings
  FOR ALL USING (store_id IN (SELECT my_store_ids()));

CREATE POLICY "waitings_anon_insert" ON waitings
  WITH CHECK (
    auth.role() = 'anon'
    AND is_store_accessible(store_id)
  );

-- ============================================================
-- 7) DB 함수 캐시/권한 유틸 강제
-- ============================================================

REVOKE ALL ON FUNCTION is_store_accessible(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_store_accessible(uuid) TO PUBLIC;

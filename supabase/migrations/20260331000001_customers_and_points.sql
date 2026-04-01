-- ============================================================
-- Migration: 20260331000001_customers_and_points
-- 고객 멤버십 + 포인트 시스템
-- Tables: customers, customer_point_history, store_point_events
-- ============================================================

-- ============================================================
-- ENUM
-- ============================================================

CREATE TYPE point_reason AS ENUM ('manual_grant', 'event_grant', 'order_use');

-- ============================================================
-- 1. customers
--    카카오 소셜 로그인 고객. store_id + auth_user_id 복합 unique.
--    한 카카오 계정이 여러 매장에 등록 가능 (각각 독립된 포인트).
-- ============================================================

CREATE TABLE customers (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        uuid        NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  auth_user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            text        NOT NULL DEFAULT '카카오 사용자',
  profile_image   text,
  total_points    int         NOT NULL DEFAULT 0 CHECK (total_points >= 0),
  visit_count     int         NOT NULL DEFAULT 0,
  last_visited_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, auth_user_id)
);

CREATE INDEX idx_customers_store_id     ON customers(store_id);
CREATE INDEX idx_customers_auth_user_id ON customers(auth_user_id);

-- ============================================================
-- 2. customer_point_history
--    포인트 적립/사용 이력. 모든 변경은 이 테이블에 기록.
--    total_points 변경은 grant_points() RPC를 통해서만 허용.
-- ============================================================

CREATE TABLE customer_point_history (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id     uuid        NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_id  uuid        NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_id     uuid        REFERENCES orders(id) ON DELETE SET NULL,
  delta        int         NOT NULL,   -- 양수: 적립, 음수: 사용
  reason       point_reason NOT NULL DEFAULT 'manual_grant',
  memo         text,
  granted_by   uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_point_history_customer_id ON customer_point_history(customer_id);
CREATE INDEX idx_point_history_store_id    ON customer_point_history(store_id);

-- ============================================================
-- 3. store_point_events
--    점주가 정의한 포인트 지급 이벤트 템플릿.
--    예: "카카오 비즈채널 친구 추가 → 500P"
-- ============================================================

CREATE TABLE store_point_events (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id   uuid        NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  points     int         NOT NULL CHECK (points > 0),
  is_active  bool        NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_store_point_events_store_id ON store_point_events(store_id);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE customers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_point_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_point_events   ENABLE ROW LEVEL SECURITY;

-- ---------- customers ----------

-- 매장 멤버 또는 본인(고객)만 읽기 가능
CREATE POLICY "customers_read" ON customers
  FOR SELECT TO authenticated
  USING (
    store_id IN (SELECT my_store_ids())
    OR auth_user_id = auth.uid()
  );

-- 카카오 로그인 후 고객 본인만 자신을 등록
CREATE POLICY "customers_self_insert" ON customers
  FOR INSERT TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

-- 포인트 직접 UPDATE 금지: grant_points() RPC(SECURITY DEFINER)로만 변경
-- 이름/프로필 이미지는 본인이 수정 가능
CREATE POLICY "customers_self_update" ON customers
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- owner/manager만 고객 삭제 가능
CREATE POLICY "customers_member_delete" ON customers
  FOR DELETE TO authenticated
  USING (
    store_id IN (SELECT my_store_ids())
    AND my_store_role(store_id) IN ('owner', 'manager')
  );

-- ---------- customer_point_history ----------

-- 매장 멤버 또는 본인(고객)만 이력 조회 가능
CREATE POLICY "point_history_read" ON customer_point_history
  FOR SELECT TO authenticated
  USING (
    store_id IN (SELECT my_store_ids())
    OR customer_id IN (
      SELECT id FROM customers WHERE auth_user_id = auth.uid()
    )
  );

-- 직접 INSERT 금지: grant_points() RPC(SECURITY DEFINER)로만 허용
-- (정책 없음 = 기본 거부)

-- ---------- store_point_events ----------

-- 매장 멤버만 조회
CREATE POLICY "store_point_events_read" ON store_point_events
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT my_store_ids()));

-- owner/manager만 생성·수정·삭제
CREATE POLICY "store_point_events_mutate" ON store_point_events
  FOR ALL TO authenticated
  USING (
    store_id IN (SELECT my_store_ids())
    AND my_store_role(store_id) IN ('owner', 'manager')
  )
  WITH CHECK (
    store_id IN (SELECT my_store_ids())
    AND my_store_role(store_id) IN ('owner', 'manager')
  );

-- ============================================================
-- grant_points() — 포인트 원자적 변경 함수
--   INSERT customer_point_history + UPDATE customers.total_points
--   SECURITY DEFINER: RLS 우회 (직접 INSERT/UPDATE 차단)
-- ============================================================

CREATE OR REPLACE FUNCTION grant_points(
  p_customer_id uuid,
  p_delta       int,
  p_reason      point_reason DEFAULT 'manual_grant',
  p_memo        text         DEFAULT NULL,
  p_order_id    uuid         DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_id uuid;
BEGIN
  SELECT store_id INTO v_store_id
  FROM customers
  WHERE id = p_customer_id;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'customer_not_found';
  END IF;

  -- 인증된 사용자가 있는 경우 해당 매장 멤버인지 확인
  IF auth.uid() IS NOT NULL
     AND v_store_id NOT IN (SELECT my_store_ids())
     -- 고객 본인이 포인트 사용(order_use)하는 경우는 허용
     AND NOT (p_reason = 'order_use'
              AND (SELECT auth_user_id FROM customers WHERE id = p_customer_id) = auth.uid())
  THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  -- 사용(음수)일 때 잔액 부족 체크
  IF p_delta < 0 THEN
    UPDATE customers
    SET total_points    = total_points + p_delta,
        last_visited_at = now(),
        visit_count     = CASE WHEN p_reason = 'order_use' THEN visit_count + 1 ELSE visit_count END
    WHERE id = p_customer_id
      AND total_points + p_delta >= 0;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'insufficient_points';
    END IF;
  ELSE
    UPDATE customers
    SET total_points = total_points + p_delta
    WHERE id = p_customer_id;
  END IF;

  INSERT INTO customer_point_history (store_id, customer_id, order_id, delta, reason, memo, granted_by)
  VALUES (v_store_id, p_customer_id, p_order_id, p_delta, p_reason, p_memo, auth.uid());
END;
$$;

REVOKE ALL ON FUNCTION grant_points(uuid, int, point_reason, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION grant_points(uuid, int, point_reason, text, uuid) TO authenticated;

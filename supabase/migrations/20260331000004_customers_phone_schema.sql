-- ============================================================
-- Migration: 20260331000004_customers_phone_schema
-- 전화번호 기반 고객 등록 지원
-- - auth_user_id nullable (직원 등록 고객은 인증 계정 없음)
-- - phone, kakao_friend 컬럼 추가
-- - RLS: 직원도 고객 INSERT/UPDATE 가능
-- ============================================================

-- auth_user_id nullable로 변경
ALTER TABLE customers ALTER COLUMN auth_user_id DROP NOT NULL;

-- 전화번호 컬럼 추가
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone text;

-- 카카오 비즈채널 친구 여부
ALTER TABLE customers ADD COLUMN IF NOT EXISTS kakao_friend boolean NOT NULL DEFAULT false;

-- 같은 매장 내 전화번호 중복 방지 (NULL은 제외)
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_store_phone
  ON customers(store_id, phone)
  WHERE phone IS NOT NULL;

-- ============================================================
-- RLS 업데이트
-- ============================================================

-- 기존 INSERT 정책 교체: 직원도 고객 등록 가능
DROP POLICY IF EXISTS "customers_self_insert" ON customers;

CREATE POLICY "customers_insert" ON customers
  FOR INSERT TO authenticated
  WITH CHECK (
    -- 고객 본인 셀프 등록 (카카오 로그인)
    auth_user_id = auth.uid()
    OR
    -- 직원이 매장 고객 등록
    (
      store_id IN (SELECT my_store_ids())
      AND my_store_role(store_id) IN ('owner', 'manager', 'staff')
    )
  );

-- 기존 UPDATE 정책 교체: 직원도 고객 정보 수정 가능
DROP POLICY IF EXISTS "customers_self_update" ON customers;

CREATE POLICY "customers_update" ON customers
  FOR UPDATE TO authenticated
  USING (
    auth_user_id = auth.uid()
    OR store_id IN (SELECT my_store_ids())
  )
  WITH CHECK (
    auth_user_id = auth.uid()
    OR (
      store_id IN (SELECT my_store_ids())
      AND my_store_role(store_id) IN ('owner', 'manager', 'staff')
    )
  );

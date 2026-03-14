-- stores 테이블에 이용기간 컬럼 추가
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS subscription_start date,
  ADD COLUMN IF NOT EXISTS subscription_end   date,
  ADD COLUMN IF NOT EXISTS is_active          boolean NOT NULL DEFAULT true;

-- 기존 매장은 활성 상태로 설정
UPDATE stores SET is_active = true WHERE is_active IS NULL;

COMMENT ON COLUMN stores.subscription_start IS '이용 시작일';
COMMENT ON COLUMN stores.subscription_end   IS '이용 만료일 (NULL이면 무제한)';
COMMENT ON COLUMN stores.is_active          IS '강제 정지 플래그';

-- ============================================================
-- seed.sql — Development test data for TableFlow
-- Run after all migrations have been applied.
-- NOTE: stores.owner_id references auth.users — replace the UUID
--       below with a real user ID from your Supabase Auth or use
--       Supabase Dashboard to create a user first.
-- ============================================================

-- ============================================================
-- Store
-- ============================================================

INSERT INTO stores (id, owner_id, name, slug, address, phone)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000', -- replace with real auth.users id
  '테스트카페',
  'test-cafe',
  '서울시 강남구 테헤란로 123',
  '02-1234-5678'
);

-- Store settings
INSERT INTO store_settings (store_id, alimtalk_enabled)
VALUES ('00000000-0000-0000-0000-000000000001', false);

-- ============================================================
-- Tables (좌석)
-- ============================================================

INSERT INTO tables (store_id, table_number, name, capacity)
VALUES
  ('00000000-0000-0000-0000-000000000001', 1, '1번 테이블', 2),
  ('00000000-0000-0000-0000-000000000001', 2, '2번 테이블', 4),
  ('00000000-0000-0000-0000-000000000001', 3, '3번 테이블', 6);

-- ============================================================
-- Menu categories
-- ============================================================

INSERT INTO menu_categories (id, store_id, name, sort_order)
VALUES
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '커피', 0),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '디저트', 1);

-- ============================================================
-- Menu items
-- ============================================================

INSERT INTO menu_items (id, store_id, category_id, name, description, price, sort_order)
VALUES
  (
    '00000000-0000-0000-0000-000000000020',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000010',
    '아메리카노',
    '진한 에스프레소와 물의 조화',
    4500,
    0
  ),
  (
    '00000000-0000-0000-0000-000000000021',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000010',
    '카페라떼',
    '부드러운 우유와 에스프레소',
    5500,
    1
  ),
  (
    '00000000-0000-0000-0000-000000000022',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000011',
    '크로플',
    '바삭한 크루아상 와플',
    8500,
    0
  );

-- ============================================================
-- Platform alimtalk templates
-- ============================================================

INSERT INTO platform_alimtalk_templates (event, template_code, template_body, is_active)
VALUES
  (
    'order_created',
    'TF_ORDER_CREATED',
    '[#{store_name}] 주문이 접수되었습니다.\n테이블: #{table_name}\n주문번호: #{number}\n\n잠시 후 음식이 준비됩니다.',
    true
  ),
  (
    'waiting_created',
    'TF_WAITING_CREATED',
    '[#{store_name}] 웨이팅 등록이 완료되었습니다.\n대기번호: #{number}번\n\n순서가 되면 알림을 보내드립니다.',
    true
  ),
  (
    'waiting_called',
    'TF_WAITING_CALLED',
    '[#{store_name}] 입장 순서가 되었습니다!\n대기번호: #{number}번\n테이블: #{table_name}\n\n5분 내로 입장해 주세요.',
    true
  ),
  (
    'waiting_cancelled',
    'TF_WAITING_CANCELLED',
    '[#{store_name}] 웨이팅이 취소되었습니다.\n대기번호: #{number}번\n\n다음에 또 방문해 주세요.',
    true
  );

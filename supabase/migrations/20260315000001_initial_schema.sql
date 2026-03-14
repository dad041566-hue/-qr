-- ============================================================
-- Migration: 20260315000001_initial_schema
-- TableFlow DB Schema v4 (Final)
-- Creates all ENUMs and tables in foreign-key dependency order
-- ============================================================

-- ============================================================
-- ENUMs
-- ============================================================

CREATE TYPE alimtalk_event AS ENUM (
  'order_created',
  'waiting_created',
  'waiting_called',
  'waiting_cancelled'
);

CREATE TYPE member_role AS ENUM ('owner', 'manager', 'staff');

CREATE TYPE table_status AS ENUM ('available', 'occupied', 'cleaning');

CREATE TYPE item_badge AS ENUM ('best', 'recommended');

CREATE TYPE order_status AS ENUM (
  'created',
  'confirmed',
  'preparing',
  'ready',
  'served',
  'cancelled'
);

CREATE TYPE payment_status AS ENUM ('unpaid', 'paid', 'failed', 'refunded');

CREATE TYPE payment_method AS ENUM ('card', 'cash', 'kakaopay', 'naverpay');

CREATE TYPE waiting_status AS ENUM (
  'waiting',
  'called',
  'seated',
  'completed',
  'cancelled',
  'no_show'
);

CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed');

CREATE TYPE notification_provider AS ENUM ('kakao_alimtalk');

-- ============================================================
-- 1. stores
-- ============================================================
CREATE TABLE stores (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  slug       text NOT NULL UNIQUE,
  address    text,
  phone      text,
  logo_url   text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. store_settings (1:1)
-- ============================================================
CREATE TABLE store_settings (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id             uuid NOT NULL UNIQUE REFERENCES stores(id) ON DELETE CASCADE,
  kakao_receiver_phone text,
  alimtalk_enabled     bool NOT NULL DEFAULT false
);

-- ============================================================
-- 3. store_queue_sequences
-- ============================================================
CREATE TABLE store_queue_sequences (
  store_id       uuid PRIMARY KEY REFERENCES stores(id) ON DELETE CASCADE,
  current_number int NOT NULL DEFAULT 0
);

-- ============================================================
-- 4. platform_alimtalk_templates
-- ============================================================
CREATE TABLE platform_alimtalk_templates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event         alimtalk_event NOT NULL UNIQUE,
  template_code text NOT NULL,
  template_body text NOT NULL,
  is_active     bool NOT NULL DEFAULT true,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. store_members
-- ============================================================
CREATE TABLE store_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id   uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       member_role NOT NULL DEFAULT 'staff',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, user_id)
);

-- ============================================================
-- 6. tables
-- ============================================================
CREATE TABLE tables (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id     uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  table_number int  NOT NULL,
  name         text,
  capacity     int,
  status       table_status NOT NULL DEFAULT 'available',
  qr_token     uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, table_number),
  UNIQUE (store_id, qr_token)
);

-- ============================================================
-- 7. menu_categories
-- ============================================================
CREATE TABLE menu_categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id   uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name       text NOT NULL,
  sort_order int  NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 8. menu_items
-- ============================================================
CREATE TABLE menu_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id     uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  category_id  uuid NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name         text NOT NULL,
  description  text,
  price        int  NOT NULL CHECK (price >= 0),
  image_url    text,
  badge        item_badge,
  is_available bool NOT NULL DEFAULT true,
  is_deleted   bool NOT NULL DEFAULT false,
  deleted_at   timestamptz,
  sort_order   int  NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 9. option_groups
-- ============================================================
CREATE TABLE option_groups (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id     uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  menu_item_id uuid NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  name         text NOT NULL,
  is_required  bool NOT NULL DEFAULT false,
  sort_order   int  NOT NULL DEFAULT 0
);

-- ============================================================
-- 10. option_choices
-- ============================================================
CREATE TABLE option_choices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  option_group_id uuid NOT NULL REFERENCES option_groups(id) ON DELETE CASCADE,
  name            text NOT NULL,
  extra_price     int  NOT NULL DEFAULT 0 CHECK (extra_price >= 0),
  sort_order      int  NOT NULL DEFAULT 0
);

-- ============================================================
-- 11. orders
-- ============================================================
CREATE TABLE orders (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id         uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  table_id         uuid REFERENCES tables(id) ON DELETE SET NULL,
  status           order_status   NOT NULL DEFAULT 'created',
  payment_status   payment_status NOT NULL DEFAULT 'unpaid',
  payment_method   payment_method,
  subtotal_price   int  NOT NULL CHECK (subtotal_price >= 0),
  discount_price   int  NOT NULL DEFAULT 0,
  tax_price        int  NOT NULL DEFAULT 0,
  total_price      int  NOT NULL CHECK (total_price >= 0),
  guest_name       text,
  special_requests text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 12. order_items
-- ============================================================
CREATE TABLE order_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id         uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  order_id         uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id     uuid REFERENCES menu_items(id) ON DELETE SET NULL,
  menu_item_name   text NOT NULL,
  unit_price       int  NOT NULL,
  quantity         int  NOT NULL CHECK (quantity > 0),
  total_price      int  NOT NULL,
  selected_options jsonb
);

-- ============================================================
-- 13. waitings
-- ============================================================
CREATE TABLE waitings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id     uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  queue_number int  NOT NULL,
  phone        text NOT NULL,
  party_size   int  NOT NULL CHECK (party_size > 0),
  status       waiting_status NOT NULL DEFAULT 'waiting',
  table_id     uuid REFERENCES tables(id) ON DELETE SET NULL,
  called_at    timestamptz,
  seated_at    timestamptz,
  completed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, queue_number)
);

-- ============================================================
-- 14. waiting_notifications
-- ============================================================
CREATE TABLE waiting_notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id   uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  waiting_id uuid NOT NULL REFERENCES waitings(id) ON DELETE CASCADE,
  event      alimtalk_event NOT NULL,
  status     notification_status NOT NULL DEFAULT 'pending',
  provider   notification_provider NOT NULL DEFAULT 'kakao_alimtalk',
  sent_at    timestamptz,
  error_msg  text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Migration: 20260315000003_indexes
-- Performance indexes for all major query patterns
-- ============================================================

-- store_members (core for RLS helper function)
CREATE INDEX idx_store_members_user     ON store_members(user_id);
CREATE INDEX idx_store_members_store    ON store_members(store_id);

-- tables
CREATE INDEX idx_tables_store           ON tables(store_id);

-- menu
CREATE INDEX idx_menu_categories_store  ON menu_categories(store_id);
CREATE INDEX idx_menu_items_store       ON menu_items(store_id);
CREATE INDEX idx_menu_items_category    ON menu_items(category_id);
CREATE INDEX idx_menu_items_active      ON menu_items(store_id) WHERE is_deleted = false;

-- option
CREATE INDEX idx_option_groups_store    ON option_groups(store_id);
CREATE INDEX idx_option_groups_item     ON option_groups(menu_item_id);
CREATE INDEX idx_option_choices_store   ON option_choices(store_id);
CREATE INDEX idx_option_choices_group   ON option_choices(option_group_id);

-- orders (real-time query critical path)
CREATE INDEX idx_orders_store_created   ON orders(store_id, created_at DESC);
CREATE INDEX idx_orders_store_status    ON orders(store_id, status);

-- order_items
CREATE INDEX idx_order_items_store      ON order_items(store_id);
CREATE INDEX idx_order_items_order      ON order_items(order_id);

-- waitings
CREATE INDEX idx_waitings_store_queue   ON waitings(store_id, queue_number);
CREATE INDEX idx_waitings_store_status  ON waitings(store_id, status);
CREATE INDEX idx_waitings_active        ON waitings(store_id) WHERE status = 'waiting';

-- waiting_notifications
CREATE INDEX idx_waiting_notif_waiting  ON waiting_notifications(waiting_id);
CREATE INDEX idx_waiting_notif_store    ON waiting_notifications(store_id);

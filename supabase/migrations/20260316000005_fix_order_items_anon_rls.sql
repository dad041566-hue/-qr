-- Fix order_items_anon_insert policy.
-- The EXISTS subquery reads from `orders`, but anon has no SELECT policy on orders,
-- so the check always returns false → all anonymous order_item inserts are rejected.
-- Fix: remove the orders EXISTS check (FK constraint already enforces referential integrity).

DROP POLICY IF EXISTS "order_items_anon_insert" ON order_items;

CREATE POLICY "order_items_anon_insert" ON order_items
  FOR INSERT
  WITH CHECK (
    auth.role() = 'anon'
    AND is_store_accessible(store_id)
  );

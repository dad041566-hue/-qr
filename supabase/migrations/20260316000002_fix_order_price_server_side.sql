-- SEC-002 Fix: Recalculate order_items prices server-side to prevent client price manipulation
-- This trigger overwrites unit_price and total_price with the actual DB value from menu_items

CREATE OR REPLACE FUNCTION enforce_menu_item_price()
RETURNS TRIGGER AS $$
DECLARE
  actual_price NUMERIC;
BEGIN
  -- Look up the real price from menu_items
  SELECT price INTO actual_price
  FROM menu_items
  WHERE id = NEW.menu_item_id;

  IF actual_price IS NULL THEN
    RAISE EXCEPTION 'menu_item_id % not found', NEW.menu_item_id;
  END IF;

  -- Overwrite client-supplied prices with server-side values
  NEW.unit_price := actual_price;
  NEW.total_price := actual_price * NEW.quantity;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER order_items_enforce_price
  BEFORE INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION enforce_menu_item_price();

-- Also recalculate orders.subtotal_price and total_price after items are inserted
CREATE OR REPLACE FUNCTION recalculate_order_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE orders
  SET
    subtotal_price = (SELECT COALESCE(SUM(total_price), 0) FROM order_items WHERE order_id = NEW.order_id),
    total_price    = (SELECT COALESCE(SUM(total_price), 0) FROM order_items WHERE order_id = NEW.order_id)
  WHERE id = NEW.order_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER order_items_recalculate_totals
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_order_totals();

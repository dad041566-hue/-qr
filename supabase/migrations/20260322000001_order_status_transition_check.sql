-- ============================================================
-- Enforce valid order status transitions via BEFORE UPDATE trigger.
-- ============================================================

CREATE OR REPLACE FUNCTION check_order_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  IF NOT (
    (OLD.status = 'created'   AND NEW.status IN ('confirmed', 'preparing', 'cancelled')) OR
    (OLD.status = 'confirmed' AND NEW.status IN ('preparing', 'cancelled')) OR
    (OLD.status = 'preparing' AND NEW.status IN ('ready', 'cancelled')) OR
    (OLD.status = 'ready'     AND NEW.status IN ('served', 'cancelled'))
  ) THEN
    RAISE EXCEPTION 'Invalid order status transition: % -> %', OLD.status, NEW.status
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_status_transition ON orders;

CREATE TRIGGER trg_order_status_transition
  BEFORE UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION check_order_status_transition();

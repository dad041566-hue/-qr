-- ============================================================
-- Migration: 20260315000004_functions
-- Database functions for business logic
-- ============================================================

-- ============================================================
-- next_queue_number(p_store_id uuid) -> int
--
-- Atomically increments and returns the next waiting queue number
-- for the given store. Uses row-level locking (FOR UPDATE via UPDATE)
-- to prevent duplicate numbers under concurrent requests.
--
-- If no sequence row exists yet for the store, inserts one starting at 1.
-- ============================================================

CREATE OR REPLACE FUNCTION next_queue_number(p_store_id uuid)
RETURNS int LANGUAGE plpgsql AS $$
DECLARE
  v_next int;
BEGIN
  UPDATE store_queue_sequences
  SET current_number = current_number + 1
  WHERE store_id = p_store_id
  RETURNING current_number INTO v_next;

  IF NOT FOUND THEN
    INSERT INTO store_queue_sequences(store_id, current_number)
    VALUES (p_store_id, 1)
    RETURNING current_number INTO v_next;
  END IF;

  RETURN v_next;
END;
$$;

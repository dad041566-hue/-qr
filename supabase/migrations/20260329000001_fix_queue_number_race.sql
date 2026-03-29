-- Fix: TOCTOU race condition in next_queue_number()
-- Problem: UPDATE + conditional INSERT is not atomic when no row exists.
--          Two concurrent calls can both see NOT FOUND and both INSERT with current_number=1.
-- Solution: Single UPSERT (INSERT ... ON CONFLICT DO UPDATE) is atomic.

CREATE OR REPLACE FUNCTION next_queue_number(p_store_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next integer;
BEGIN
  INSERT INTO store_queue_sequences (store_id, current_number)
  VALUES (p_store_id, 1)
  ON CONFLICT (store_id) DO UPDATE
    SET current_number = store_queue_sequences.current_number + 1
  RETURNING current_number INTO v_next;

  RETURN v_next;
END;
$$;

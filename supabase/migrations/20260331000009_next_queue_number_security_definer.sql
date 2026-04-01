-- next_queue_number에 SECURITY DEFINER 추가
-- anon 사용자가 RPC 호출 시 store_queue_sequences INSERT 가능하도록
CREATE OR REPLACE FUNCTION next_queue_number(p_store_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_next  int;
  v_today date := (now() AT TIME ZONE 'Asia/Seoul')::date;
BEGIN
  UPDATE store_queue_sequences
  SET
    current_number  = CASE WHEN last_reset_date < v_today THEN 1 ELSE current_number + 1 END,
    last_reset_date = v_today
  WHERE store_id = p_store_id
  RETURNING current_number INTO v_next;

  IF NOT FOUND THEN
    INSERT INTO store_queue_sequences (store_id, current_number, last_reset_date)
    VALUES (p_store_id, 1, v_today)
    RETURNING current_number INTO v_next;
  END IF;

  RETURN v_next;
END;
$func$;

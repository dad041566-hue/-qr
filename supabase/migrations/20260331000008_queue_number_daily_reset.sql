-- store_queue_sequences에 마지막 리셋 날짜 컬럼 추가
ALTER TABLE store_queue_sequences
  ADD COLUMN IF NOT EXISTS last_reset_date date NOT NULL
    DEFAULT (now() AT TIME ZONE 'Asia/Seoul')::date;

-- next_queue_number 함수 업데이트
-- 당일 첫 채번 시 자동 리셋 (크론 불필요)
CREATE OR REPLACE FUNCTION next_queue_number(p_store_id uuid)
RETURNS int LANGUAGE plpgsql AS $func$
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

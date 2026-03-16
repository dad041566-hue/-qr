-- Fix: next_queue_number() 함수가 store_queue_sequences RLS에 막혀서 대기 등록 실패
-- 원인: store_queue_sequences에 SELECT만 허용하는 RLS 정책이 있으나,
--       next_queue_number()는 UPDATE/INSERT를 수행하면서 INVOKER 권한으로 실행됨
-- 해결: SECURITY DEFINER로 변경하여 함수가 테이블 소유자 권한으로 실행되도록 함

CREATE OR REPLACE FUNCTION next_queue_number(p_store_id uuid)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER AS $$
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

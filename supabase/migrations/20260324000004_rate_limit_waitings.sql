-- ============================================================
-- Migration: 20260324000004_rate_limit_waitings
-- Rate limiting for waiting registrations (per phone per store)
-- Max 3 per phone per 10 minutes
-- ============================================================

CREATE OR REPLACE FUNCTION check_waiting_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recent_count int;
BEGIN
  SELECT COUNT(*) INTO v_recent_count
  FROM waitings
  WHERE store_id = NEW.store_id
    AND phone = NEW.phone
    AND created_at > now() - interval '10 minutes';

  IF v_recent_count >= 3 THEN
    RAISE EXCEPTION 'rate limit exceeded: too many waiting requests for this phone number';
  END IF;

  RETURN NEW;
END;
$$;

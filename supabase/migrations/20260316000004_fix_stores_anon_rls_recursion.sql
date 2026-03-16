-- Fix infinite RLS recursion for anonymous store access.
-- The is_store_accessible() function queries `stores` which triggers the
-- stores_anon_active RLS policy, which calls is_store_accessible() again
-- → stack depth limit exceeded.
-- Fix: add SECURITY DEFINER so the inner stores query bypasses RLS.

CREATE OR REPLACE FUNCTION is_store_accessible(p_store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1
    FROM stores
    WHERE id = p_store_id
      AND is_active = true
      AND (
        subscription_end IS NULL
        OR subscription_end >= (now() AT TIME ZONE 'Asia/Seoul')::date
      )
  );
$$;

REVOKE ALL ON FUNCTION is_store_accessible(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_store_accessible(uuid) TO PUBLIC;

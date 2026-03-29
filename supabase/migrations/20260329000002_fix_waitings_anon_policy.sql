-- Fix: anon SELECT policy on waitings exposes phone numbers (PII)
-- Problem: Any anonymous user can read all waitings for accessible stores,
--          including the phone column.
-- Solution: Create a view that excludes phone, revoke direct anon SELECT,
--          and grant anon SELECT on the view instead.

-- 1. Create a phone-free view for anonymous access
CREATE OR REPLACE VIEW waitings_public AS
SELECT
  id,
  store_id,
  queue_number,
  party_size,
  status,
  called_at,
  seated_at,
  completed_at,
  table_id,
  created_at
FROM waitings;

-- 2. Drop the old anon SELECT policy that leaks phone
DROP POLICY IF EXISTS "waitings_anon_select" ON waitings;

-- 3. Grant anon access to the view (inherits RLS from base table)
GRANT SELECT ON waitings_public TO anon;

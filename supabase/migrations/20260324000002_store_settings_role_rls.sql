-- ============================================================
-- Migration: 20260324000002_store_settings_role_rls
-- SEC-E22: store_settings RLS — restrict mutations to owner/manager
-- Follows the same SELECT + mutate split pattern from
-- 20260321000001_rls_role_based_checks.sql
-- ============================================================

DROP POLICY IF EXISTS "store_settings_member" ON store_settings;

CREATE POLICY "store_settings_member_select" ON store_settings
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT my_store_ids()));

CREATE POLICY "store_settings_member_mutate" ON store_settings
  FOR ALL TO authenticated
  USING (
    store_id IN (SELECT my_store_ids())
    AND my_store_role(store_id) IN ('owner', 'manager')
  )
  WITH CHECK (
    store_id IN (SELECT my_store_ids())
    AND my_store_role(store_id) IN ('owner', 'manager')
  );

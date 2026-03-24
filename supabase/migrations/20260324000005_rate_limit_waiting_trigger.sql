-- ============================================================
-- Migration: 20260324000005_rate_limit_waiting_trigger
-- Attach rate limit trigger to waitings table
-- ============================================================

DROP TRIGGER IF EXISTS waitings_rate_limit ON waitings;

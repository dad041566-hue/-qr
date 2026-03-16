-- Enable Supabase Realtime for orders table.
-- Without this, postgres_changes subscriptions on 'orders' never receive events.
-- Uses DO block for idempotency (safe to run even if already in the publication).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;

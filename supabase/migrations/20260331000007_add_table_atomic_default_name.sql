CREATE OR REPLACE FUNCTION add_table_atomic(p_store_id UUID)
RETURNS tables
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_result tables;
BEGIN
  LOOP
    BEGIN
      INSERT INTO tables (store_id, table_number, name, qr_token)
      SELECT
        p_store_id,
        COALESCE(MAX(table_number), 0) + 1,
        (COALESCE(MAX(table_number), 0) + 1)::text || '번',
        gen_random_uuid()
      FROM tables WHERE store_id = p_store_id
      RETURNING * INTO v_result;
      RETURN v_result;
    EXCEPTION WHEN unique_violation THEN
      NULL;
    END;
  END LOOP;
END;
$func$;

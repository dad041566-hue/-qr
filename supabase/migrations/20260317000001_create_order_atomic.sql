-- Atomically create an order with all items and mark the table occupied.
-- This prevents partial writes when the client or network fails between inserts.

CREATE OR REPLACE FUNCTION create_order_atomic(
  p_store_id uuid,
  p_table_id uuid,
  p_items jsonb,
  p_guest_name text DEFAULT NULL,
  p_special_requests text DEFAULT NULL,
  p_payment_method payment_method DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id uuid := gen_random_uuid();
  v_role text := auth.role();
  v_uid uuid := auth.uid();
  v_item_count int := 0;
BEGIN
  IF p_store_id IS NULL THEN
    RAISE EXCEPTION 'store_id is required';
  END IF;

  IF p_table_id IS NULL THEN
    RAISE EXCEPTION 'table_id is required';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'items must be a non-empty array';
  END IF;

  IF v_role = 'anon' THEN
    IF NOT is_store_accessible(p_store_id) THEN
      RAISE EXCEPTION 'store is not accessible';
    END IF;
  ELSIF v_uid IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM store_members
      WHERE store_id = p_store_id
        AND user_id = v_uid
    ) THEN
      RAISE EXCEPTION 'no access to store';
    END IF;
  ELSE
    RAISE EXCEPTION 'authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM tables
    WHERE id = p_table_id
      AND store_id = p_store_id
  ) THEN
    RAISE EXCEPTION 'table does not belong to store';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(p_items) AS item(menu_item_id uuid, quantity int)
    LEFT JOIN menu_items mi
      ON mi.id = item.menu_item_id
     AND mi.store_id = p_store_id
     AND mi.is_available = true
     AND mi.is_deleted = false
    WHERE item.menu_item_id IS NULL
       OR item.quantity IS NULL
       OR item.quantity <= 0
       OR mi.id IS NULL
  ) THEN
    RAISE EXCEPTION 'invalid order items';
  END IF;

  INSERT INTO orders (
    id,
    store_id,
    table_id,
    subtotal_price,
    total_price,
    guest_name,
    special_requests,
    payment_method
  ) VALUES (
    v_order_id,
    p_store_id,
    p_table_id,
    0,
    0,
    p_guest_name,
    p_special_requests,
    p_payment_method
  );

  INSERT INTO order_items (
    store_id,
    order_id,
    menu_item_id,
    menu_item_name,
    unit_price,
    quantity,
    total_price,
    selected_options
  )
  SELECT
    p_store_id,
    v_order_id,
    item.menu_item_id,
    COALESCE(NULLIF(item.menu_item_name, ''), mi.name),
    mi.price,
    item.quantity,
    mi.price * item.quantity,
    CASE
      WHEN item.selected_options IS NULL OR jsonb_typeof(item.selected_options) <> 'array' THEN NULL
      ELSE item.selected_options
    END
  FROM jsonb_to_recordset(p_items) AS item(
    menu_item_id uuid,
    menu_item_name text,
    quantity int,
    selected_options jsonb
  )
  JOIN menu_items mi
    ON mi.id = item.menu_item_id
   AND mi.store_id = p_store_id;

  GET DIAGNOSTICS v_item_count = ROW_COUNT;
  IF v_item_count = 0 THEN
    RAISE EXCEPTION 'no valid order items inserted';
  END IF;

  UPDATE tables
  SET status = 'occupied'
  WHERE id = p_table_id
    AND store_id = p_store_id
    AND status <> 'occupied';

  RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION create_order_atomic(uuid, uuid, jsonb, text, text, payment_method) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_order_atomic(uuid, uuid, jsonb, text, text, payment_method) TO anon, authenticated;

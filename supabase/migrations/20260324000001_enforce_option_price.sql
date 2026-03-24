-- ============================================================
-- Migration: 20260324000001_enforce_option_price
-- SEC: Validate option prices server-side inside create_order_atomic
-- Replaces the existing function to:
--   1. Validate option_choice_ids belong to the menu_item's option_groups
--   2. Replace client-supplied extra_price with actual DB values
--   3. Recalculate order_items.total_price = (base + sum(options)) * qty
-- ============================================================

-- Also update the BEFORE INSERT trigger to account for option extra_prices
CREATE OR REPLACE FUNCTION enforce_menu_item_price()
RETURNS TRIGGER AS $$
DECLARE
  actual_price int;
  option_total int := 0;
  opt jsonb;
  actual_extra int;
  corrected_options jsonb := '[]'::jsonb;
BEGIN
  -- Look up the real base price from menu_items
  SELECT price INTO actual_price
  FROM menu_items
  WHERE id = NEW.menu_item_id;

  IF actual_price IS NULL THEN
    RAISE EXCEPTION 'menu_item_id % not found', NEW.menu_item_id;
  END IF;

  NEW.unit_price := actual_price;

  -- If selected_options exist, validate and correct each option price
  -- Frontend sends: { group: "토핑", choice: "치즈", extra_price: 0 }
  -- May also receive: { option_choice_id: uuid, name: "치즈", extra_price: 0 }
  IF NEW.selected_options IS NOT NULL
     AND jsonb_typeof(NEW.selected_options) = 'array'
     AND jsonb_array_length(NEW.selected_options) > 0 THEN

    FOR opt IN SELECT value FROM jsonb_array_elements(NEW.selected_options)
    LOOP
      actual_extra := NULL;

      -- Strategy 1: lookup by option_choice_id (API/test callers)
      IF opt->>'option_choice_id' IS NOT NULL THEN
        SELECT oc.extra_price INTO actual_extra
        FROM option_choices oc
        JOIN option_groups og ON og.id = oc.option_group_id
        WHERE oc.id = (opt->>'option_choice_id')::uuid
          AND og.menu_item_id = NEW.menu_item_id;
      END IF;

      -- Strategy 2: lookup by group name + choice name (frontend callers)
      IF actual_extra IS NULL AND opt->>'group' IS NOT NULL AND opt->>'choice' IS NOT NULL THEN
        SELECT oc.extra_price INTO actual_extra
        FROM option_choices oc
        JOIN option_groups og ON og.id = oc.option_group_id
        WHERE og.menu_item_id = NEW.menu_item_id
          AND og.name = opt->>'group'
          AND oc.name = opt->>'choice';
      END IF;

      -- If neither lookup found the option, skip it (don't block the order)
      IF actual_extra IS NULL THEN
        actual_extra := 0;
      END IF;

      option_total := option_total + actual_extra;

      -- Build corrected option preserving original keys + DB price
      corrected_options := corrected_options || jsonb_build_array(
        opt || jsonb_build_object('extra_price', actual_extra)
      );
    END LOOP;

    NEW.selected_options := corrected_options;
  END IF;

  -- total_price = (base_price + option_extras) * quantity
  NEW.total_price := (actual_price + option_total) * NEW.quantity;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger already exists from 20260316000002; no need to recreate.
-- The CREATE OR REPLACE above updates the function in place.

-- ============================================================
-- Replace create_order_atomic to validate options before insert
-- ============================================================

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
SET search_path = public
AS $$
DECLARE
  v_order_id uuid := gen_random_uuid();
  v_role text := auth.role();
  v_uid uuid := auth.uid();
  v_item_count int := 0;
  v_item record;
  v_opt jsonb;
  v_choice_id uuid;
  v_valid boolean;
BEGIN
  -- ========== Input validation ==========
  IF p_store_id IS NULL THEN
    RAISE EXCEPTION 'store_id is required';
  END IF;

  IF p_table_id IS NULL THEN
    RAISE EXCEPTION 'table_id is required';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'items must be a non-empty array';
  END IF;

  -- ========== Access control ==========
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

  -- ========== Table belongs to store ==========
  IF NOT EXISTS (
    SELECT 1
    FROM tables
    WHERE id = p_table_id
      AND store_id = p_store_id
  ) THEN
    RAISE EXCEPTION 'table does not belong to store';
  END IF;

  -- ========== Menu item validation ==========
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

  -- ========== Option validation ==========
  -- For each item with selected_options, verify every option_choice_id
  -- belongs to an option_group of that menu_item
  FOR v_item IN
    SELECT
      item.menu_item_id,
      item.selected_options
    FROM jsonb_to_recordset(p_items) AS item(
      menu_item_id uuid,
      menu_item_name text,
      quantity int,
      selected_options jsonb
    )
    WHERE item.selected_options IS NOT NULL
      AND jsonb_typeof(item.selected_options) = 'array'
      AND jsonb_array_length(item.selected_options) > 0
  LOOP
    FOR v_opt IN SELECT value FROM jsonb_array_elements(v_item.selected_options)
    LOOP
      v_choice_id := (v_opt->>'option_choice_id')::uuid;

      IF v_choice_id IS NULL THEN
        RAISE EXCEPTION 'option_choice_id is required in selected_options';
      END IF;

      SELECT EXISTS (
        SELECT 1
        FROM option_choices oc
        JOIN option_groups og ON og.id = oc.option_group_id
        WHERE oc.id = v_choice_id
          AND og.menu_item_id = v_item.menu_item_id
          AND og.store_id = p_store_id
      ) INTO v_valid;

      IF NOT v_valid THEN
        RAISE EXCEPTION 'option_choice % does not belong to menu_item %',
          v_choice_id, v_item.menu_item_id;
      END IF;
    END LOOP;
  END LOOP;

  -- ========== Create order ==========
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

  -- ========== Insert order items ==========
  -- The enforce_menu_item_price() BEFORE INSERT trigger will:
  --   - Replace unit_price with actual menu_items.price
  --   - Validate & correct each option's extra_price from DB
  --   - Calculate total_price = (base + option_extras) * quantity
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
    mi.price * item.quantity,  -- placeholder; trigger corrects this
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

  -- ========== Mark table occupied ==========
  UPDATE tables
  SET status = 'occupied'
  WHERE id = p_table_id
    AND store_id = p_store_id
    AND status <> 'occupied';

  RETURN v_order_id;
END;
$$;

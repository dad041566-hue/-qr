-- Fix: enforce_menu_item_price supports both frontend format (group/choice names)
-- and API format (option_choice_id). Previous version only supported option_choice_id.

CREATE OR REPLACE FUNCTION enforce_menu_item_price()
RETURNS TRIGGER AS $$
DECLARE
  actual_price int;
  option_total int := 0;
  opt jsonb;
  actual_extra int;
  corrected_options jsonb := '[]'::jsonb;
BEGIN
  SELECT price INTO actual_price
  FROM menu_items
  WHERE id = NEW.menu_item_id;

  IF actual_price IS NULL THEN
    RAISE EXCEPTION 'menu_item_id % not found', NEW.menu_item_id;
  END IF;

  NEW.unit_price := actual_price;

  IF NEW.selected_options IS NOT NULL
     AND jsonb_typeof(NEW.selected_options) = 'array'
     AND jsonb_array_length(NEW.selected_options) > 0 THEN

    FOR opt IN SELECT value FROM jsonb_array_elements(NEW.selected_options)
    LOOP
      actual_extra := NULL;

      IF opt->>'option_choice_id' IS NOT NULL THEN
        SELECT oc.extra_price INTO actual_extra
        FROM option_choices oc
        JOIN option_groups og ON og.id = oc.option_group_id
        WHERE oc.id = (opt->>'option_choice_id')::uuid
          AND og.menu_item_id = NEW.menu_item_id;
      END IF;

      IF actual_extra IS NULL AND opt->>'group' IS NOT NULL AND opt->>'choice' IS NOT NULL THEN
        SELECT oc.extra_price INTO actual_extra
        FROM option_choices oc
        JOIN option_groups og ON og.id = oc.option_group_id
        WHERE og.menu_item_id = NEW.menu_item_id
          AND og.name = opt->>'group'
          AND oc.name = opt->>'choice';
      END IF;

      IF actual_extra IS NULL THEN
        actual_extra := 0;
      END IF;

      option_total := option_total + actual_extra;

      corrected_options := corrected_options || jsonb_build_array(
        opt || jsonb_build_object('extra_price', actual_extra)
      );
    END LOOP;

    NEW.selected_options := corrected_options;
  END IF;

  NEW.total_price := (actual_price + option_total) * NEW.quantity;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER waitings_rate_limit
  BEFORE INSERT ON waitings
  FOR EACH ROW
  EXECUTE FUNCTION check_waiting_rate_limit();

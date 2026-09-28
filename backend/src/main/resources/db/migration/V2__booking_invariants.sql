CREATE FUNCTION guard_booking() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status <> 'PENDING' THEN
    RAISE EXCEPTION 'Bookings must start pending' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.request_id <> OLD.request_id OR NEW.starts_at <> OLD.starts_at OR NEW.ends_at <> OLD.ends_at THEN
      RAISE EXCEPTION 'Booking identity and time are immutable; cancel and rebook' USING ERRCODE = '23514';
    END IF;
    IF NEW.status <> OLD.status AND NOT (
      (OLD.status = 'PENDING' AND NEW.status IN ('CONFIRMED','CANCELLED')) OR
      (OLD.status = 'CONFIRMED' AND NEW.status IN ('IN_PROGRESS','CANCELLED')) OR
      (OLD.status = 'IN_PROGRESS' AND NEW.status = 'COMPLETED')) THEN
      RAISE EXCEPTION 'Invalid booking state transition' USING ERRCODE = '23514';
    END IF;
    IF NEW.status = 'CONFIRMED' AND OLD.status = 'PENDING' THEN
      PERFORM 1 FROM booking_requests WHERE id = NEW.request_id AND status = 'ACCEPTED' FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'Request must be accepted' USING ERRCODE = '23514'; END IF;
      IF NOT EXISTS (SELECT 1 FROM booking_workers WHERE booking_id = NEW.id) THEN
        RAISE EXCEPTION 'Assign workers before confirming' USING ERRCODE = '23514';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER guard_booking BEFORE INSERT OR UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION guard_booking();

CREATE FUNCTION guard_booking_worker() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE b bookings%ROWTYPE; r booking_requests%ROWTYPE;
BEGIN
  -- Serialize assignment edits with confirmation. Direct derived-field edits cannot bypass exclusion.
  IF TG_OP = 'DELETE' THEN
    SELECT * INTO b FROM bookings WHERE id = OLD.booking_id FOR UPDATE;
    IF b.status <> 'PENDING' THEN RAISE EXCEPTION 'Assigned roster is immutable' USING ERRCODE = '23514'; END IF;
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE' AND (NEW.booking_id <> OLD.booking_id OR NEW.worker_id <> OLD.worker_id) THEN
    RAISE EXCEPTION 'Assignment identity is immutable' USING ERRCODE = '23514';
  END IF;
  SELECT * INTO b FROM bookings WHERE id = NEW.booking_id FOR UPDATE;
  IF TG_OP = 'INSERT' THEN
    IF b.status <> 'PENDING' THEN RAISE EXCEPTION 'Assign only while pending' USING ERRCODE = '23514'; END IF;
    SELECT * INTO r FROM booking_requests WHERE id = b.request_id;
    IF (r.worker_id IS NOT NULL AND r.worker_id <> NEW.worker_id) OR
       (r.team_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM team_memberships WHERE team_id = r.team_id AND worker_id = NEW.worker_id)) THEN
      RAISE EXCEPTION 'Worker does not match booking request' USING ERRCODE = '23514';
    END IF;
  END IF;
  NEW.starts_at = b.starts_at; NEW.ends_at = b.ends_at;
  NEW.reserved = b.status IN ('CONFIRMED','IN_PROGRESS','COMPLETED');
  RETURN NEW;
END $$;
CREATE TRIGGER guard_booking_worker BEFORE INSERT OR UPDATE OR DELETE ON booking_workers FOR EACH ROW EXECUTE FUNCTION guard_booking_worker();

CREATE FUNCTION synchronize_booking_workers() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE booking_workers SET reserved = NEW.status IN ('CONFIRMED','IN_PROGRESS','COMPLETED') WHERE booking_id = NEW.id;
  RETURN NEW;
END $$;
CREATE TRIGGER synchronize_booking_workers AFTER UPDATE OF status ON bookings FOR EACH ROW EXECUTE FUNCTION synchronize_booking_workers();

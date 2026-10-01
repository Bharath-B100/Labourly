CREATE TABLE quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id uuid NOT NULL REFERENCES labour_requirements(id),
  worker_id uuid NOT NULL REFERENCES worker_profiles(user_id),
  amount numeric(12,2) NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'INR',
  pricing_basis varchar(32) NOT NULL CHECK (pricing_basis IN ('FIXED_TOTAL', 'PER_DAY', 'PER_WORKER_PER_DAY')),
  starts_at timestamptz NOT NULL,
  duration_days int NOT NULL CHECK (duration_days > 0),
  worker_note text,
  status varchar(16) NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED','ACCEPTED','REJECTED','WITHDRAWN')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (amount >= 0)
);

CREATE TRIGGER update_quotations_timestamp BEFORE UPDATE ON quotations FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE UNIQUE INDEX quote_worker_requirement_idx ON quotations(requirement_id, worker_id) WHERE status = 'SUBMITTED';

ALTER TABLE bookings
  ALTER COLUMN request_id DROP NOT NULL,
  ADD COLUMN quotation_id uuid REFERENCES quotations(id),
  ADD COLUMN amount numeric(12,2),
  ADD COLUMN currency varchar(3),
  ADD COLUMN pricing_basis varchar(32),
  ADD CHECK (num_nonnulls(request_id, quotation_id) = 1);

CREATE OR REPLACE FUNCTION guard_booking() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status <> 'PENDING' THEN
    RAISE EXCEPTION 'Bookings must start pending' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.request_id IS DISTINCT FROM OLD.request_id OR NEW.quotation_id IS DISTINCT FROM OLD.quotation_id OR NEW.starts_at <> OLD.starts_at OR NEW.ends_at <> OLD.ends_at THEN
      RAISE EXCEPTION 'Booking identity and time are immutable; cancel and rebook' USING ERRCODE = '23514';
    END IF;
    IF NEW.status <> OLD.status AND NOT (
      (OLD.status = 'PENDING' AND NEW.status IN ('CONFIRMED','CANCELLED')) OR
      (OLD.status = 'CONFIRMED' AND NEW.status IN ('IN_PROGRESS','CANCELLED')) OR
      (OLD.status = 'IN_PROGRESS' AND NEW.status = 'COMPLETED')) THEN
      RAISE EXCEPTION 'Invalid booking state transition' USING ERRCODE = '23514';
    END IF;
    IF NEW.status = 'CONFIRMED' AND OLD.status = 'PENDING' THEN
      IF NEW.request_id IS NOT NULL THEN
        PERFORM 1 FROM booking_requests WHERE id = NEW.request_id AND status = 'ACCEPTED' FOR UPDATE;
        IF NOT FOUND THEN RAISE EXCEPTION 'Request must be accepted' USING ERRCODE = '23514'; END IF;
      ELSIF NEW.quotation_id IS NOT NULL THEN
        PERFORM 1 FROM quotations WHERE id = NEW.quotation_id AND status = 'ACCEPTED' FOR UPDATE;
        IF NOT FOUND THEN RAISE EXCEPTION 'Quotation must be accepted' USING ERRCODE = '23514'; END IF;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM booking_workers WHERE booking_id = NEW.id) THEN
        RAISE EXCEPTION 'Assign workers before confirming' USING ERRCODE = '23514';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION guard_booking_worker() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE b bookings%ROWTYPE; r booking_requests%ROWTYPE; q quotations%ROWTYPE;
BEGIN
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
    IF b.request_id IS NOT NULL THEN
      SELECT * INTO r FROM booking_requests WHERE id = b.request_id;
      IF (r.worker_id IS NOT NULL AND r.worker_id <> NEW.worker_id) OR
         (r.team_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM team_memberships WHERE team_id = r.team_id AND worker_id = NEW.worker_id)) THEN
        RAISE EXCEPTION 'Worker does not match booking request' USING ERRCODE = '23514';
      END IF;
    ELSIF b.quotation_id IS NOT NULL THEN
      SELECT * INTO q FROM quotations WHERE id = b.quotation_id;
      IF q.worker_id <> NEW.worker_id THEN
        RAISE EXCEPTION 'Worker does not match quotation' USING ERRCODE = '23514';
      END IF;
    END IF;
  END IF;
  NEW.starts_at = b.starts_at; NEW.ends_at = b.ends_at;
  NEW.reserved = b.status IN ('CONFIRMED','IN_PROGRESS','COMPLETED');
  RETURN NEW;
END $$;

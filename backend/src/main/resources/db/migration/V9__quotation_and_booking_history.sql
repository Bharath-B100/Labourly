-- Preserve V1–V8; enforce Phase 4 history and singleton acceptance in the database.
CREATE UNIQUE INDEX quotation_one_accepted_per_requirement ON quotations(requirement_id) WHERE status='ACCEPTED';
CREATE UNIQUE INDEX booking_one_per_quotation ON bookings(quotation_id) WHERE quotation_id IS NOT NULL;
ALTER TABLE quotations ADD CONSTRAINT quotation_positive_amount CHECK(amount>0);
ALTER TABLE quotations ADD CONSTRAINT quotation_duration_bound CHECK(duration_days<=3650);
ALTER TABLE quotations ADD CONSTRAINT quotation_note_bound CHECK(worker_note IS NULL OR length(worker_note)<=2000);
CREATE FUNCTION guard_quotation_history() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.requirement_id IS DISTINCT FROM OLD.requirement_id OR NEW.worker_id IS DISTINCT FROM OLD.worker_id OR NEW.currency IS DISTINCT FROM OLD.currency THEN
    RAISE EXCEPTION 'Quotation ownership and currency are immutable' USING ERRCODE='23514';
  END IF;
  IF OLD.status <> 'SUBMITTED' AND (to_jsonb(NEW)-'updated_at') IS DISTINCT FROM (to_jsonb(OLD)-'updated_at') THEN
    RAISE EXCEPTION 'Finalized quotation is immutable' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER quotation_history BEFORE UPDATE ON quotations FOR EACH ROW EXECUTE FUNCTION guard_quotation_history();
CREATE FUNCTION guard_booking_commercial_history() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.amount IS DISTINCT FROM OLD.amount OR NEW.currency IS DISTINCT FROM OLD.currency OR NEW.pricing_basis IS DISTINCT FROM OLD.pricing_basis THEN
    RAISE EXCEPTION 'Booking commercial terms are immutable' USING ERRCODE='23514';
  END IF;
  IF OLD.cancelled_at IS NOT NULL AND (NEW.cancelled_at IS DISTINCT FROM OLD.cancelled_at OR NEW.cancelled_by IS DISTINCT FROM OLD.cancelled_by OR NEW.cancel_reason IS DISTINCT FROM OLD.cancel_reason) THEN
    RAISE EXCEPTION 'Cancellation audit is immutable' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER booking_commercial_history BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION guard_booking_commercial_history();
ALTER TABLE bookings ADD CONSTRAINT cancellation_audit_complete CHECK(
  (cancelled_by IS NULL AND cancelled_at IS NULL AND cancel_reason IS NULL) OR
  (status='CANCELLED' AND cancelled_by IS NOT NULL AND cancelled_at IS NOT NULL AND cancel_reason IS NOT NULL AND length(trim(cancel_reason)) BETWEEN 1 AND 2000));

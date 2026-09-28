-- Lock each worker before changing reservation rows. Concurrent exclusion-index
-- updates can otherwise deadlock before either confirmation commits.
CREATE OR REPLACE FUNCTION synchronize_booking_workers() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Stable ordering also covers bookings assigning more than one worker.
  -- NO KEY UPDATE keeps foreign-key KEY SHARE checks compatible.
  PERFORM 1 FROM worker_profiles w
    WHERE EXISTS (SELECT 1 FROM booking_workers bw WHERE bw.booking_id = NEW.id AND bw.worker_id = w.user_id)
    ORDER BY w.user_id FOR NO KEY UPDATE;
  UPDATE booking_workers SET reserved = NEW.status IN ('CONFIRMED','IN_PROGRESS','COMPLETED') WHERE booking_id = NEW.id;
  RETURN NEW;
END $$;

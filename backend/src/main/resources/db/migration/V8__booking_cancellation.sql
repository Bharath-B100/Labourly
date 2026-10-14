ALTER TABLE bookings
  ADD COLUMN cancelled_by uuid REFERENCES users(id),
  ADD COLUMN cancel_reason varchar(2000),
  ADD COLUMN cancelled_at timestamptz;

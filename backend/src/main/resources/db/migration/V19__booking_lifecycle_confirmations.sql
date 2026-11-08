CREATE TABLE booking_lifecycle_confirmations (
 booking_id uuid NOT NULL REFERENCES bookings(id),
 actor_id uuid NOT NULL REFERENCES users(id),
 action varchar(16) NOT NULL CHECK(action IN ('START','COMPLETE')),
 confirmed_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(booking_id,actor_id,action)
);

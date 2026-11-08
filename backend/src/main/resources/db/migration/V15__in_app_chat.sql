-- V15: In-app messaging between customer and worker on a booking
CREATE TABLE chat_threads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id   UUID NOT NULL REFERENCES users(id),
  worker_id     UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (booking_id)
);

CREATE TABLE chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id   UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES users(id),
  body        TEXT NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 2000),
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at     TIMESTAMPTZ
);

CREATE INDEX chat_messages_thread_idx ON chat_messages(thread_id, sent_at);
CREATE INDEX chat_threads_customer_idx ON chat_threads(customer_id);
CREATE INDEX chat_threads_worker_idx   ON chat_threads(worker_id);


CREATE TABLE saved_workers (
  customer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  worker_id uuid NOT NULL REFERENCES worker_profiles(user_id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (customer_id, worker_id)
);
CREATE INDEX saved_workers_customer_created_idx
  ON saved_workers(customer_id, created_at DESC, worker_id);

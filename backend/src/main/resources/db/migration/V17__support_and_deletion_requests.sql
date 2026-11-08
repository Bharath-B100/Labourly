-- Requests are retained separately from marketplace records; this migration deletes nothing.
CREATE TABLE support_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES users(id),
 kind varchar(24) NOT NULL CHECK(kind IN ('SUPPORT','ACCOUNT_DELETION')),
 details varchar(2000) NOT NULL CHECK(length(trim(details)) BETWEEN 1 AND 2000),
 status varchar(24) NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','IN_REVIEW','RESOLVED')),
 resolution varchar(2000),
 reviewed_by uuid REFERENCES users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(status <> 'RESOLVED' OR (resolution IS NOT NULL AND length(trim(resolution)) BETWEEN 1 AND 2000 AND reviewed_by IS NOT NULL))
);
CREATE UNIQUE INDEX support_one_open_kind ON support_requests(user_id,kind) WHERE status <> 'RESOLVED';
CREATE INDEX support_queue ON support_requests(status,created_at);
CREATE INDEX support_owner ON support_requests(user_id,created_at DESC);
CREATE TABLE support_request_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 request_id uuid NOT NULL REFERENCES support_requests(id),
 actor_id uuid NOT NULL REFERENCES users(id),
 status varchar(24) NOT NULL CHECK(status IN ('OPEN','IN_REVIEW','RESOLVED')),
 note varchar(2000) NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);

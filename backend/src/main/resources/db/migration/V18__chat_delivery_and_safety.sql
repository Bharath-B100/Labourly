-- Additive chat reliability and per-conversation safety; existing messages remain intact.
ALTER TABLE chat_messages ADD COLUMN client_message_id varchar(80);
ALTER TABLE chat_messages ADD CONSTRAINT chat_client_message_id_valid CHECK(client_message_id IS NULL OR client_message_id ~ '^[A-Za-z0-9_-]{16,80}$');
CREATE UNIQUE INDEX chat_message_retry_key ON chat_messages(thread_id,sender_id,client_message_id) WHERE client_message_id IS NOT NULL;
CREATE TABLE chat_thread_blocks (
 thread_id uuid NOT NULL REFERENCES chat_threads(id),
 blocker_id uuid NOT NULL REFERENCES users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(thread_id,blocker_id)
);

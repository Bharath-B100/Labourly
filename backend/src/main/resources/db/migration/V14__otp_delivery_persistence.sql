-- Dormant OTP persistence foundation. No provider, dispatcher or auth activation.
ALTER TABLE otp_challenges ADD COLUMN invalidated_at timestamptz;
ALTER TABLE otp_challenges ADD COLUMN invalidation_reason varchar(24);
ALTER TABLE otp_challenges ADD CONSTRAINT otp_invalidation_pair CHECK (
 (invalidated_at IS NULL AND invalidation_reason IS NULL) OR
 (invalidated_at IS NOT NULL AND invalidation_reason IS NOT NULL AND invalidation_reason IN ('SUPERSEDED','DELIVERY_REJECTED')));
CREATE INDEX otp_challenges_created_idx ON otp_challenges(created_at);

CREATE TABLE otp_operational_control (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 generation uuid NOT NULL,
 mode varchar(12) NOT NULL CHECK(mode IN ('CLOSED','RESTRICTED','NORMAL')),
 changed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 quiesced_at timestamptz,
 approved_at timestamptz,
 restricted_until timestamptz,
 incident_ref varchar(128),
 CHECK(mode='CLOSED' OR (quiesced_at IS NOT NULL AND approved_at IS NOT NULL AND incident_ref IS NOT NULL)),
 CHECK(mode<>'RESTRICTED' OR (restricted_until IS NOT NULL AND restricted_until>approved_at AND restricted_until<=approved_at+interval '1 hour'))
);
INSERT INTO otp_operational_control(singleton,generation,mode) VALUES(true,gen_random_uuid(),'CLOSED');

CREATE TABLE otp_sms_outbox (
 id uuid PRIMARY KEY,
 challenge_id uuid NOT NULL UNIQUE REFERENCES otp_challenges(id),
 provider varchar(16) NOT NULL CHECK(provider IN ('MSG91','TWILIO')),
 template_key varchar(64) NOT NULL,
 template_version varchar(64) NOT NULL,
 state varchar(16) NOT NULL CHECK(state IN ('PENDING','CLAIMED','SENDING','RETRY_WAIT','ACCEPTED','DELIVERED','FAILED','UNKNOWN','EXPIRED','CANCELLED')),
 payload_ciphertext bytea,
 payload_nonce bytea,
 key_id varchar(64) NOT NULL,
 expires_at timestamptz NOT NULL,
 available_at timestamptz NOT NULL,
 lease_owner uuid,
 lease_until timestamptz,
 control_generation uuid,
 fence bigint NOT NULL DEFAULT 0 CHECK(fence>=0),
 attempt_count smallint NOT NULL DEFAULT 0 CHECK(attempt_count BETWEEN 0 AND 3),
 request_key_hash bytea CHECK(request_key_hash IS NULL OR octet_length(request_key_hash)=32),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CHECK((payload_ciphertext IS NULL AND payload_nonce IS NULL) OR
       (payload_ciphertext IS NOT NULL AND payload_nonce IS NOT NULL AND octet_length(payload_nonce)=12 AND octet_length(payload_ciphertext) BETWEEN 16 AND 4096)),
 CHECK(state NOT IN ('PENDING','CLAIMED','SENDING','RETRY_WAIT') OR payload_ciphertext IS NOT NULL),
 CHECK((lease_owner IS NULL AND lease_until IS NULL) OR (lease_owner IS NOT NULL AND lease_until IS NOT NULL)),
 CHECK(state NOT IN ('CLAIMED','SENDING') OR (lease_owner IS NOT NULL AND control_generation IS NOT NULL)),
 CHECK(expires_at>created_at)
);
CREATE UNIQUE INDEX otp_outbox_request_key_idx ON otp_sms_outbox(request_key_hash) WHERE request_key_hash IS NOT NULL;
CREATE INDEX otp_outbox_poll_idx ON otp_sms_outbox(available_at,id) WHERE state IN ('PENDING','RETRY_WAIT');
CREATE INDEX otp_outbox_lease_idx ON otp_sms_outbox(lease_until,id) WHERE state IN ('CLAIMED','SENDING');
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON otp_sms_outbox FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TABLE otp_sms_attempts (
 id uuid PRIMARY KEY,
 outbox_id uuid NOT NULL REFERENCES otp_sms_outbox(id),
 attempt_no smallint NOT NULL CHECK(attempt_no BETWEEN 1 AND 3),
 fence bigint NOT NULL CHECK(fence>0),
 state varchar(24) NOT NULL CHECK(state IN ('STARTED','ACCEPTED','DEFINITELY_NOT_SENT','REJECTED','UNKNOWN','DELIVERED','UNDELIVERED')),
 retryable boolean NOT NULL DEFAULT false,
 provider varchar(16) NOT NULL CHECK(provider IN ('MSG91','TWILIO')),
 provider_message_id varchar(200),
 started_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 completed_at timestamptz,
 UNIQUE(outbox_id,attempt_no),
 CHECK(NOT retryable OR state='DEFINITELY_NOT_SENT'),
 CHECK((state='STARTED' AND completed_at IS NULL) OR (state<>'STARTED' AND completed_at IS NOT NULL))
);
CREATE UNIQUE INDEX otp_attempt_message_idx ON otp_sms_attempts(provider,provider_message_id) WHERE provider_message_id IS NOT NULL;
CREATE INDEX otp_attempt_started_idx ON otp_sms_attempts(started_at);

CREATE TABLE otp_sms_callback_events (
 id uuid PRIMARY KEY,
 provider varchar(16) NOT NULL CHECK(provider IN ('MSG91','TWILIO')),
 dedupe_hash bytea NOT NULL CHECK(octet_length(dedupe_hash)=32),
 provider_message_id varchar(200) NOT NULL,
 attempt_id uuid REFERENCES otp_sms_attempts(id),
 status varchar(16) NOT NULL CHECK(status IN ('PENDING','DELIVERED','UNDELIVERED','UNKNOWN')),
 provider_occurred_at timestamptz,
 received_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 processed_at timestamptz,
 authentication_mode varchar(16) NOT NULL CHECK(authentication_mode IN ('SIGNATURE','SECRET_HEADER','API_RECONCILED')),
 UNIQUE(provider,dedupe_hash)
);
CREATE INDEX otp_callback_unresolved_idx ON otp_sms_callback_events(provider,provider_message_id,received_at) WHERE processed_at IS NULL;

CREATE INDEX otp_outbox_retention_idx ON otp_sms_outbox(expires_at,id)
 WHERE payload_ciphertext IS NULL AND state IN ('ACCEPTED','DELIVERED','FAILED','UNKNOWN','EXPIRED','CANCELLED');
CREATE INDEX otp_callback_received_idx ON otp_sms_callback_events(received_at);
CREATE INDEX otp_callback_attempt_idx ON otp_sms_callback_events(attempt_id) WHERE attempt_id IS NOT NULL;

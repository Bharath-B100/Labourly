-- Preserve existing OTP login bindings. Entered contact numbers are not login identities.
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE users ADD COLUMN contact_phone varchar(16)
  CHECK (contact_phone IS NULL OR contact_phone ~ '^\+[1-9][0-9]{7,14}$');
CREATE TABLE external_identities (
  provider varchar(16) NOT NULL CHECK (provider = 'GOOGLE'),
  subject varchar(255) NOT NULL CHECK (length(subject) > 0),
  user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(provider, subject),
  UNIQUE(provider, user_id)
);
CREATE TABLE google_login_redemptions (
  challenge_id uuid PRIMARY KEY,
  expires_at timestamptz NOT NULL
);
CREATE INDEX google_login_redemptions_expiry ON google_login_redemptions(expires_at);

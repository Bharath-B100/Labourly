-- Make display_name nullable to support OTP-first registration
ALTER TABLE users ALTER COLUMN display_name DROP NOT NULL;

-- Track onboarding state and step for resuming
ALTER TABLE users ADD COLUMN onboarding_state varchar(16) NOT NULL DEFAULT 'NOT_STARTED' 
  CHECK (onboarding_state IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'));
ALTER TABLE users ADD COLUMN onboarding_step varchar(32);

-- OTP Challenges
CREATE TABLE otp_challenges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    phone varchar(16) NOT NULL,
    code_hash varchar(255) NOT NULL,
    attempts smallint NOT NULL DEFAULT 0,
    max_attempts smallint NOT NULL DEFAULT 3,
    verified boolean NOT NULL DEFAULT false,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX otp_challenges_phone_idx ON otp_challenges(phone, created_at DESC);

-- Refresh Tokens
CREATE TABLE refresh_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash varchar(255) NOT NULL UNIQUE,
    revoked boolean NOT NULL DEFAULT false,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX refresh_tokens_user_idx ON refresh_tokens(user_id);

-- Add worker type to worker_profiles
ALTER TABLE worker_profiles ADD COLUMN worker_type varchar(16) 
  CHECK (worker_type IN ('INDIVIDUAL', 'TEAM'));

-- Pre-populate required initial categories
INSERT INTO labour_categories (code, name) VALUES 
('CARPENTER', 'Carpenter'),
('ELECTRICIAN', 'Electrician'),
('PLUMBER', 'Plumber')
ON CONFLICT (code) DO NOTHING;

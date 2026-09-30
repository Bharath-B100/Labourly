-- Forward-only correction: V1-V4 are preserved for existing installations.
ALTER TABLE otp_challenges ADD CONSTRAINT otp_phone_valid CHECK (phone ~ '^\+[1-9][0-9]{7,14}$');
ALTER TABLE otp_challenges ADD CONSTRAINT otp_attempt_bounds CHECK (max_attempts BETWEEN 1 AND 10 AND attempts BETWEEN 0 AND max_attempts);
ALTER TABLE otp_challenges ADD CONSTRAINT otp_expiry_valid CHECK (expires_at > created_at);
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON otp_challenges FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TABLE auth_sessions (
  id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  revoked boolean NOT NULL DEFAULT false, expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id, user_id), CHECK (expires_at > created_at)
);
CREATE INDEX auth_sessions_user_idx ON auth_sessions(user_id);
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON auth_sessions FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
ALTER TABLE refresh_tokens ADD COLUMN session_id uuid;
-- Existing tokens are retired during this security upgrade; users must authenticate again.
INSERT INTO auth_sessions(id, user_id, revoked, expires_at, created_at)
SELECT id, user_id, true, expires_at, created_at FROM refresh_tokens;
UPDATE refresh_tokens SET session_id = id, revoked = true;
ALTER TABLE refresh_tokens ALTER COLUMN session_id SET NOT NULL;
ALTER TABLE refresh_tokens ADD CONSTRAINT refresh_session_owner FOREIGN KEY(session_id,user_id) REFERENCES auth_sessions(id,user_id) ON DELETE CASCADE;
ALTER TABLE refresh_tokens ADD CONSTRAINT refresh_expiry_valid CHECK(expires_at > created_at);
CREATE INDEX refresh_tokens_session_idx ON refresh_tokens(session_id);
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON refresh_tokens FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

ALTER TABLE customer_profiles DROP CONSTRAINT customer_profiles_customer_type_check;
ALTER TABLE customer_profiles ADD CONSTRAINT customer_profiles_customer_type_check CHECK(customer_type IN ('HOMEOWNER','ARCHITECT','INTERIOR_DESIGNER','CONTRACTOR','BUILDER','COMPANY','SITE_ENGINEER','PROJECT_MANAGER','OTHER'));
ALTER TABLE customer_profiles ADD COLUMN location jsonb;
ALTER TABLE customer_profiles ADD CONSTRAINT customer_location_object CHECK(location IS NULL OR jsonb_typeof(location) = 'object');
ALTER TABLE worker_profiles ADD COLUMN profile_photo_url varchar(2048);
ALTER TABLE worker_profiles ADD COLUMN primary_trade_id uuid REFERENCES labour_categories(id);
ALTER TABLE worker_profiles ADD COLUMN availability_status varchar(16) CHECK(availability_status IN ('AVAILABLE','BUSY','UNAVAILABLE'));
ALTER TABLE worker_profiles ADD COLUMN team_name varchar(120);
ALTER TABLE worker_profiles ADD COLUMN team_size integer CHECK(team_size BETWEEN 2 AND 1000);
ALTER TABLE worker_profiles ADD CONSTRAINT worker_team_fields CHECK(
 (worker_type = 'TEAM' AND team_name IS NOT NULL AND length(trim(team_name)) > 0 AND team_size IS NOT NULL)
 OR (team_name IS NULL AND team_size IS NULL));

CREATE TABLE trade_skills (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), trade_id uuid NOT NULL REFERENCES labour_categories(id),
 code varchar(60) NOT NULL UNIQUE, name varchar(120) NOT NULL, active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(id, trade_id)
);
CREATE INDEX trade_skills_trade_idx ON trade_skills(trade_id);
CREATE TABLE worker_subskills (
 worker_id uuid NOT NULL REFERENCES worker_profiles(user_id), skill_id uuid NOT NULL,
 trade_id uuid NOT NULL, PRIMARY KEY(worker_id,skill_id),
 FOREIGN KEY(skill_id,trade_id) REFERENCES trade_skills(id,trade_id),
 FOREIGN KEY(worker_id,trade_id) REFERENCES worker_skills(worker_id,category_id),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX worker_subskills_skill_idx ON worker_subskills(skill_id);
INSERT INTO trade_skills(trade_id,code,name)
SELECT c.id, s.code, s.name FROM labour_categories c JOIN (VALUES
 ('CARPENTER','CARPENTRY_FURNITURE','Furniture'),('CARPENTER','CARPENTRY_DOORS','Doors and frames'),
 ('ELECTRICIAN','ELECTRICAL_WIRING','Wiring'),('ELECTRICIAN','ELECTRICAL_FIXTURES','Fixtures'),
 ('PLUMBER','PLUMBING_PIPES','Pipe installation'),('PLUMBER','PLUMBING_REPAIRS','Repairs')
) AS s(trade,code,name) ON c.code=s.trade;
CREATE TABLE onboarding_drafts (
 user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 role varchar(16) NOT NULL CHECK(role IN ('CUSTOMER','WORKER')),
 step smallint NOT NULL DEFAULT 0 CHECK(step BETWEEN 0 AND 3),
 data jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(data)='object'),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON onboarding_drafts FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON trade_skills FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- Carry legacy profile information into resumable drafts. Older completion flags
-- did not certify the newly required fields, so those accounts must finish onboarding.
INSERT INTO onboarding_drafts(user_id,role,data)
SELECT DISTINCT ON (u.id) u.id,r.role_code,jsonb_build_object(
 'fullName',u.display_name,'customerType',c.customer_type,'companyName',c.company_name,
 'workerType',w.worker_type,'experienceYears',w.experience_years)
FROM users u JOIN user_roles r ON r.user_id=u.id
LEFT JOIN customer_profiles c ON c.user_id=u.id
LEFT JOIN worker_profiles w ON w.user_id=u.id
WHERE r.role_code IN ('CUSTOMER','WORKER') ORDER BY u.id,r.role_code;
UPDATE users SET onboarding_state='IN_PROGRESS',onboarding_step='0'
WHERE id IN (SELECT user_id FROM onboarding_drafts);

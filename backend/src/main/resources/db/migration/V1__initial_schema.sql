CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone varchar(16) NOT NULL UNIQUE CHECK (phone ~ '^\+[1-9][0-9]{7,14}$'),
  display_name varchar(120) NOT NULL CHECK (length(trim(display_name)) > 0),
  status varchar(16) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','ACTIVE','SUSPENDED','DEACTIVATED')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE roles (
  code varchar(16) PRIMARY KEY CHECK (code IN ('CUSTOMER','WORKER','ADMIN')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO roles(code) VALUES ('CUSTOMER'),('WORKER'),('ADMIN');
CREATE TABLE user_roles (
  user_id uuid NOT NULL REFERENCES users(id), role_code varchar(16) NOT NULL REFERENCES roles(code),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, role_code)
);
CREATE INDEX user_roles_role_idx ON user_roles(role_code);
CREATE TABLE customer_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id),
  customer_type varchar(24) NOT NULL CHECK (customer_type IN ('ARCHITECT','INTERIOR_DESIGNER','CONTRACTOR','BUILDER','COMPANY','SITE_ENGINEER','PROJECT_MANAGER','HOMEOWNER')),
  company_name varchar(180),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE worker_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id), bio varchar(1200),
  experience_years smallint NOT NULL DEFAULT 0 CHECK (experience_years BETWEEN 0 AND 80),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE labour_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(40) NOT NULL UNIQUE,
  name varchar(100) NOT NULL, active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE worker_skills (
  worker_id uuid NOT NULL REFERENCES worker_profiles(user_id), category_id uuid NOT NULL REFERENCES labour_categories(id),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(worker_id, category_id)
);
CREATE INDEX worker_skills_category_idx ON worker_skills(category_id);
CREATE TABLE worker_service_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), worker_id uuid NOT NULL REFERENCES worker_profiles(user_id),
  state_code varchar(8) NOT NULL, district varchar(100) NOT NULL, city varchar(100) NOT NULL,
  postal_code varchar(6) CHECK (postal_code ~ '^[1-9][0-9]{5}$'),
  center geography(Point,4326), radius_km numeric(6,2) CHECK (radius_km > 0 AND radius_km <= 500),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX worker_locations_worker_idx ON worker_service_locations(worker_id);
CREATE INDEX worker_locations_city_idx ON worker_service_locations(state_code, city);
CREATE INDEX worker_locations_geo_idx ON worker_service_locations USING gist(center);
CREATE TABLE worker_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), worker_id uuid NOT NULL REFERENCES worker_profiles(user_id),
  starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL,
  available boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at),
  EXCLUDE USING gist (worker_id WITH =, tstzrange(starts_at, ends_at, '[)') WITH &&)
);
CREATE TABLE worker_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(120) NOT NULL,
  owner_id uuid NOT NULL REFERENCES worker_profiles(user_id), active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX teams_owner_idx ON worker_teams(owner_id);
CREATE TABLE team_memberships (
  team_id uuid NOT NULL REFERENCES worker_teams(id), worker_id uuid NOT NULL REFERENCES worker_profiles(user_id),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(team_id, worker_id)
);
CREATE INDEX team_memberships_worker_idx ON team_memberships(worker_id);
CREATE TABLE labour_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), customer_id uuid NOT NULL REFERENCES customer_profiles(user_id),
  category_id uuid NOT NULL REFERENCES labour_categories(id), description varchar(2000) NOT NULL,
  worker_count integer NOT NULL CHECK (worker_count > 0),
  starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL,
  city varchar(100) NOT NULL, state_code varchar(8) NOT NULL, site_location geography(Point,4326),
  status varchar(16) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','OPEN','CLOSED','CANCELLED')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CHECK (ends_at > starts_at)
);
CREATE INDEX requirements_customer_idx ON labour_requirements(customer_id, created_at DESC);
CREATE INDEX requirements_discovery_idx ON labour_requirements(category_id, state_code, city, status);
CREATE TABLE booking_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), requirement_id uuid NOT NULL REFERENCES labour_requirements(id),
  worker_id uuid REFERENCES worker_profiles(user_id), team_id uuid REFERENCES worker_teams(id),
  status varchar(16) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','ACCEPTED','REJECTED','WITHDRAWN','EXPIRED')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(worker_id, team_id) = 1)
);
CREATE INDEX requests_requirement_idx ON booking_requests(requirement_id);
CREATE INDEX requests_worker_idx ON booking_requests(worker_id, status);
CREATE INDEX requests_team_idx ON booking_requests(team_id, status);
CREATE UNIQUE INDEX requests_worker_pending_idx ON booking_requests(requirement_id,worker_id) WHERE status IN ('PENDING','ACCEPTED');
CREATE UNIQUE INDEX requests_team_pending_idx ON booking_requests(requirement_id,team_id) WHERE status IN ('PENDING','ACCEPTED');
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), request_id uuid NOT NULL UNIQUE REFERENCES booking_requests(id),
  starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED')),
  version bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CHECK (ends_at > starts_at)
);
CREATE INDEX bookings_status_time_idx ON bookings(status, starts_at);
-- Snapshot of individual workers, even for team bookings. Derived fields are trigger-owned.
CREATE TABLE booking_workers (
  booking_id uuid NOT NULL REFERENCES bookings(id), worker_id uuid NOT NULL REFERENCES worker_profiles(user_id),
  starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL, reserved boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(booking_id, worker_id), CHECK (ends_at > starts_at),
  CONSTRAINT worker_no_overlapping_bookings EXCLUDE USING gist
    (worker_id WITH =, tstzrange(starts_at, ends_at, '[)') WITH &&) WHERE (reserved)
);
CREATE TABLE worker_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), worker_id uuid NOT NULL REFERENCES worker_profiles(user_id),
  status varchar(16) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  reviewer_id uuid REFERENCES users(id), reviewed_at timestamptz,
  verification_type varchar(24) NOT NULL CHECK (verification_type IN ('SYNTHETIC_REVIEW')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status = 'PENDING' AND reviewer_id IS NULL AND reviewed_at IS NULL) OR
         (status <> 'PENDING' AND reviewer_id IS NOT NULL AND reviewed_at IS NOT NULL))
);
CREATE INDEX verification_queue_idx ON worker_verifications(status, created_at);
CREATE INDEX verification_worker_idx ON worker_verifications(worker_id);
CREATE INDEX verification_reviewer_idx ON worker_verifications(reviewer_id);

CREATE FUNCTION touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['users','roles','user_roles','customer_profiles','worker_profiles','labour_categories',
  'worker_skills','worker_service_locations','worker_availability','worker_teams','team_memberships',
  'labour_requirements','booking_requests','bookings','booking_workers','worker_verifications'] LOOP
    EXECUTE format('CREATE TRIGGER touch_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION touch_updated_at()', t);
  END LOOP;
END $$;

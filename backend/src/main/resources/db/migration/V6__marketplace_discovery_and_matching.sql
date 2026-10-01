-- Phase 3: Marketplace Discovery, Requirement Posting & Basic Matching

-- 1. Worker Profile Visibility
ALTER TABLE worker_profiles ADD COLUMN visibility_enabled boolean NOT NULL DEFAULT true;

-- 2. Enhance Labour Requirements
ALTER TABLE labour_requirements ADD COLUMN title varchar(120);
-- Set a default title for any existing requirements before making it NOT NULL
UPDATE labour_requirements SET title = 'General Requirement' WHERE title IS NULL;
ALTER TABLE labour_requirements ALTER COLUMN title SET NOT NULL;

ALTER TABLE labour_requirements ADD COLUMN district varchar(100);
ALTER TABLE labour_requirements ADD COLUMN postal_code varchar(6) CHECK (postal_code ~ '^[1-9][0-9]{5}$');

-- Ensure updated_at triggers work correctly on the new table
CREATE TABLE requirement_skills (
  requirement_id uuid NOT NULL REFERENCES labour_requirements(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL,
  trade_id uuid NOT NULL,
  PRIMARY KEY (requirement_id, skill_id),
  FOREIGN KEY (skill_id, trade_id) REFERENCES trade_skills(id, trade_id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX req_skills_idx ON requirement_skills(skill_id);

-- 3. Enhance Location Indexes for Marketplace PostGIS Queries
-- V1 already has gist(center) for worker_service_locations. We'll add one for requirements.
CREATE INDEX requirements_geo_idx ON labour_requirements USING gist(site_location);

-- Marketplace discovery index: quickly find available workers by trade and visibility
CREATE INDEX workers_discovery_idx ON worker_profiles(primary_trade_id, availability_status, visibility_enabled);

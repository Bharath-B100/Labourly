-- Additive canonical references; no existing profile, requirement or coverage backfill.
CREATE TABLE location_states (
 id varchar(20) PRIMARY KEY, country_code char(2) NOT NULL CHECK(country_code='IN'),
 lgd_code integer NOT NULL UNIQUE, geonames_key varchar(4) NOT NULL UNIQUE,
 name text NOT NULL, application_code varchar(8) NOT NULL UNIQUE, provenance jsonb NOT NULL
);
CREATE TABLE location_districts (
 id varchar(40) PRIMARY KEY, state_id varchar(20) NOT NULL REFERENCES location_states(id),
 name text NOT NULL, provenance jsonb NOT NULL, UNIQUE(id,state_id)
);
CREATE INDEX location_district_state_idx ON location_districts(state_id);
CREATE TABLE location_cities (
 id varchar(40) PRIMARY KEY, state_id varchar(20) NOT NULL REFERENCES location_states(id),
 name text NOT NULL, latitude double precision NOT NULL CHECK(latitude BETWEEN -90 AND 90),
 longitude double precision NOT NULL CHECK(longitude BETWEEN -180 AND 180),
 district_resolution varchar(24) NOT NULL CHECK(district_resolution IN ('SOURCE_VERIFIED','UNRESOLVED','MULTI_DISTRICT')),
 provenance jsonb NOT NULL, UNIQUE(id,state_id)
);
CREATE INDEX location_city_state_idx ON location_cities(state_id);
CREATE TABLE location_city_districts (
 city_id varchar(40) NOT NULL, district_id varchar(40) NOT NULL, state_id varchar(20) NOT NULL,
 PRIMARY KEY(city_id,district_id),
 FOREIGN KEY(city_id,state_id) REFERENCES location_cities(id,state_id),
 FOREIGN KEY(district_id,state_id) REFERENCES location_districts(id,state_id)
);
CREATE INDEX location_city_district_reverse_idx ON location_city_districts(district_id);
CREATE TABLE worker_service_coverage (
 worker_id uuid PRIMARY KEY REFERENCES worker_profiles(user_id),
 nationwide boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE worker_coverage_states (
 worker_id uuid NOT NULL REFERENCES worker_service_coverage(worker_id) ON DELETE CASCADE,
 state_id varchar(20) NOT NULL REFERENCES location_states(id),
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(worker_id,state_id)
);
CREATE TABLE worker_coverage_districts (
 worker_id uuid NOT NULL REFERENCES worker_service_coverage(worker_id) ON DELETE CASCADE,
 district_id varchar(40) NOT NULL REFERENCES location_districts(id),
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(worker_id,district_id)
);
CREATE TABLE worker_coverage_radii (
 worker_id uuid PRIMARY KEY REFERENCES worker_service_coverage(worker_id) ON DELETE CASCADE,
 base_city_id varchar(40) NOT NULL REFERENCES location_cities(id),
 center geography(Point,4326) NOT NULL,
 radius_km numeric(6,2) NOT NULL CHECK(radius_km>0 AND radius_km<=500),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX worker_coverage_radius_geo_idx ON worker_coverage_radii USING gist(center);
ALTER TABLE labour_requirements ADD COLUMN location_source varchar(24) CHECK(location_source IN ('CITY_CENTRE','GPS'));
ALTER TABLE labour_requirements ADD COLUMN location_state_id varchar(20) REFERENCES location_states(id);
ALTER TABLE labour_requirements ADD COLUMN location_city_id varchar(40);
ALTER TABLE labour_requirements ADD CONSTRAINT requirement_city_state_fk FOREIGN KEY(location_city_id,location_state_id) REFERENCES location_cities(id,state_id);
-- Legacy rows retain NULL source. No reinterpretation of legacy city labels as verified geography.
ALTER TABLE labour_requirements ADD CONSTRAINT requirement_canonical_location_check CHECK (
 location_source IS NULL OR (site_location IS NOT NULL AND
 ((location_source='CITY_CENTRE' AND location_state_id IS NOT NULL AND location_city_id IS NOT NULL)
 OR (location_source='GPS' AND location_city_id IS NULL AND location_state_id IS NULL)))
);

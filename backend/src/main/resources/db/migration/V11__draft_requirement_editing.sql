ALTER TABLE labour_requirements ADD COLUMN edit_version bigint NOT NULL DEFAULT 0;
ALTER TABLE labour_requirements ADD COLUMN budget numeric(12,2) CHECK(budget IS NULL OR budget>0);

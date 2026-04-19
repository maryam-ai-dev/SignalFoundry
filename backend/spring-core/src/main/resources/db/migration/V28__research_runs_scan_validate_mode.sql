-- Rename legacy mode column (GENERAL|CAMPAIGN) to campaign_mode, freeing "mode"
-- for the new SCAN|VALIDATE semantics introduced by the gap detection layer.
ALTER TABLE core.research_runs RENAME COLUMN mode TO campaign_mode;

ALTER TABLE core.research_runs
    ADD COLUMN mode VARCHAR(20) NOT NULL DEFAULT 'SCAN';

ALTER TABLE core.research_runs
    ADD COLUMN idea_description TEXT;

ALTER TABLE core.research_runs
    ADD CONSTRAINT mode_valid
    CHECK (mode IN ('SCAN', 'VALIDATE'));

ALTER TABLE core.research_runs
    ADD CONSTRAINT validate_requires_description
    CHECK (mode = 'SCAN' OR (mode = 'VALIDATE' AND idea_description IS NOT NULL));

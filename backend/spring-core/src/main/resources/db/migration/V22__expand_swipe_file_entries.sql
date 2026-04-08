ALTER TABLE core.swipe_file_entries
    ADD COLUMN IF NOT EXISTS campaign_objective_id UUID,
    ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS platform VARCHAR(100),
    ADD COLUMN IF NOT EXISTS source_run_id UUID;

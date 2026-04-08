CREATE TABLE core.personal_strategy_profiles (
    workspace_id UUID PRIMARY KEY REFERENCES core.workspaces(id),
    preferred_angle_types JSONB DEFAULT '{}'::jsonb,
    preferred_hook_formats JSONB DEFAULT '{}'::jsonb,
    preferred_comment_tones JSONB DEFAULT '{}'::jsonb,
    total_decisions INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

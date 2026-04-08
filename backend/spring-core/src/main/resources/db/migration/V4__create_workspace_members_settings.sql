CREATE TABLE core.workspace_members (
    workspace_id UUID NOT NULL REFERENCES core.workspaces(id),
    user_id UUID NOT NULL REFERENCES core.users(id),
    role VARCHAR(20) NOT NULL,
    PRIMARY KEY (workspace_id, user_id)
);

CREATE TABLE core.workspace_settings (
    workspace_id UUID PRIMARY KEY REFERENCES core.workspaces(id),
    allow_direct_cta BOOLEAN DEFAULT TRUE,
    max_promotional_intensity INTEGER DEFAULT 3,
    banned_phrases JSONB DEFAULT '[]'::jsonb,
    tone_constraints JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE core.content_angles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES core.research_runs(id),
    workspace_id UUID NOT NULL REFERENCES core.workspaces(id),
    angle_type VARCHAR(50),
    confidence DOUBLE PRECISION DEFAULT 0.0,
    content JSONB,
    intent_type VARCHAR(50),
    saved BOOLEAN DEFAULT FALSE,
    archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_angles_run ON core.content_angles(run_id);
CREATE INDEX idx_content_angles_workspace ON core.content_angles(workspace_id);

CREATE TABLE core.positioning_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES core.research_runs(id),
    workspace_id UUID NOT NULL REFERENCES core.workspaces(id),
    version INTEGER DEFAULT 1,
    content JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_positioning_profiles_workspace ON core.positioning_profiles(workspace_id);

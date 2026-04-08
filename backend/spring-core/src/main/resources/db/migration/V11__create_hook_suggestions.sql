CREATE TABLE core.hook_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES core.research_runs(id),
    workspace_id UUID NOT NULL REFERENCES core.workspaces(id),
    hook_type VARCHAR(50),
    confidence DOUBLE PRECISION DEFAULT 0.0,
    content JSONB,
    intent_type VARCHAR(50),
    saved BOOLEAN DEFAULT FALSE,
    archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hook_suggestions_run ON core.hook_suggestions(run_id);
CREATE INDEX idx_hook_suggestions_workspace ON core.hook_suggestions(workspace_id);

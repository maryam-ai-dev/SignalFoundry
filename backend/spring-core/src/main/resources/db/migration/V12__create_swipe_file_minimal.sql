CREATE TABLE core.swipe_file_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES core.workspaces(id),
    type VARCHAR(50) NOT NULL,
    content JSONB,
    saved BOOLEAN DEFAULT TRUE,
    archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_swipe_file_workspace ON core.swipe_file_entries(workspace_id);
CREATE INDEX idx_swipe_file_type ON core.swipe_file_entries(type);

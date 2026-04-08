CREATE TABLE core.tracked_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES core.workspaces(id),
    keyword VARCHAR(500) NOT NULL,
    platforms JSONB DEFAULT '[]'::jsonb,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

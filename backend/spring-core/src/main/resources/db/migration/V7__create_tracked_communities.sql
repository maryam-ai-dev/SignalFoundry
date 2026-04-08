CREATE TABLE core.tracked_communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES core.workspaces(id),
    name VARCHAR(255) NOT NULL,
    platform VARCHAR(100) NOT NULL,
    url TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

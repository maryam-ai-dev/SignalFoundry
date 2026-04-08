CREATE TABLE core.scheduled_refreshes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES core.workspaces(id),
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    cadence VARCHAR(20) NOT NULL DEFAULT 'DAILY',
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scheduled_refreshes_workspace ON core.scheduled_refreshes(workspace_id);
CREATE INDEX idx_scheduled_refreshes_due ON core.scheduled_refreshes(is_active, next_run_at);

CREATE TABLE core.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES core.workspaces(id),
    name VARCHAR(255) NOT NULL,
    goal_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PAUSED',
    target_audience TEXT,
    desired_action TEXT,
    offer_type VARCHAR(100),
    cta_style VARCHAR(100),
    tone_guidance TEXT,
    success_metric TEXT,
    time_window_days INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaigns_workspace ON core.campaigns(workspace_id);
CREATE INDEX idx_campaigns_status ON core.campaigns(status);

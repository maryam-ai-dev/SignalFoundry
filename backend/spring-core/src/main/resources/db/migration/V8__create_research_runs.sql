CREATE TYPE core.research_run_mode AS ENUM ('GENERAL', 'CAMPAIGN');
CREATE TYPE core.research_run_status AS ENUM ('PENDING', 'RUNNING', 'PARTIAL_ANALYSIS_READY', 'COMPLETED', 'FAILED', 'ARCHIVED');

CREATE TABLE core.research_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES core.workspaces(id),
    mode VARCHAR(20) NOT NULL DEFAULT 'GENERAL',
    query_text TEXT NOT NULL,
    platforms JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    campaign_objective_id UUID,
    goal_context_snapshot JSONB,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_research_runs_workspace ON core.research_runs(workspace_id);
CREATE INDEX idx_research_runs_status ON core.research_runs(status);

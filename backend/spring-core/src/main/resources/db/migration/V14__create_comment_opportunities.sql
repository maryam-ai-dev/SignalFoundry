CREATE TABLE core.comment_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES core.workspaces(id),
    run_id UUID REFERENCES core.research_runs(id),
    source_post_id VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    post_summary TEXT,
    post_url TEXT,
    relevance_score DOUBLE PRECISION DEFAULT 0.0,
    engagement_intent VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comment_opportunities_workspace ON core.comment_opportunities(workspace_id);
CREATE INDEX idx_comment_opportunities_status ON core.comment_opportunities(status);

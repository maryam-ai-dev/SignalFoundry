CREATE TABLE core.comment_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES core.comment_opportunities(id),
    workspace_id UUID NOT NULL REFERENCES core.workspaces(id),
    draft_text TEXT NOT NULL,
    edited_text TEXT,
    strategy_type VARCHAR(50),
    voice_match_score DOUBLE PRECISION,
    confidence_level VARCHAR(20),
    risk_flags JSONB DEFAULT '[]'::jsonb,
    duplicate_risk DOUBLE PRECISION DEFAULT 0.0,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING_REVIEW',
    requires_edit BOOLEAN DEFAULT FALSE,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comment_drafts_opportunity ON core.comment_drafts(opportunity_id);
CREATE INDEX idx_comment_drafts_workspace ON core.comment_drafts(workspace_id);

CREATE TABLE core.insight_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES core.research_runs(id),
    type VARCHAR(50) NOT NULL,
    payload JSONB,
    confidence DOUBLE PRECISION DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_insight_snapshots_run ON core.insight_snapshots(run_id);
CREATE INDEX idx_insight_snapshots_type ON core.insight_snapshots(type);

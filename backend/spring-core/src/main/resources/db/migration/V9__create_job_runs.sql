CREATE TABLE core.job_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'QUEUED',
    celery_task_id VARCHAR(255),
    payload JSONB,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    research_run_id UUID REFERENCES core.research_runs(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_details TEXT
);

CREATE INDEX idx_job_runs_research_run ON core.job_runs(research_run_id);
CREATE INDEX idx_job_runs_status ON core.job_runs(status);

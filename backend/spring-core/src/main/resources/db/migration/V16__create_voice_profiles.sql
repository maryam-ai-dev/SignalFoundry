CREATE TABLE core.voice_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL UNIQUE REFERENCES core.workspaces(id),
    maturity_score DOUBLE PRECISION DEFAULT 0.0,
    confidence_state VARCHAR(20) NOT NULL DEFAULT 'EMPTY',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

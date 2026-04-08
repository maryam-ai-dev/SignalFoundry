CREATE TABLE core.voice_samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES core.voice_profiles(id),
    sample_type VARCHAR(20) NOT NULL,
    storage_key TEXT,
    quality_score DOUBLE PRECISION DEFAULT 0.0,
    accepted BOOLEAN NOT NULL DEFAULT FALSE,
    word_count INTEGER DEFAULT 0,
    analysis_result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_voice_samples_profile ON core.voice_samples(profile_id);

CREATE TABLE core.voice_profile_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES core.voice_profiles(id),
    aggregated_vector JSONB,
    sample_count INTEGER DEFAULT 0,
    maturity_score DOUBLE PRECISION DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_voice_versions_profile ON core.voice_profile_versions(profile_id);

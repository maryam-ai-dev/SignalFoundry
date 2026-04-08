-- HookSuggestion: add campaign fields (intent_type already exists)
ALTER TABLE core.hook_suggestions ADD COLUMN IF NOT EXISTS campaign_objective_id UUID REFERENCES core.campaigns(id);
ALTER TABLE core.hook_suggestions ADD COLUMN IF NOT EXISTS goal_fit_score DOUBLE PRECISION;
ALTER TABLE core.hook_suggestions ADD COLUMN IF NOT EXISTS cta_type VARCHAR(50);

-- ContentAngle: add all campaign fields
ALTER TABLE core.content_angles ADD COLUMN IF NOT EXISTS campaign_objective_id UUID REFERENCES core.campaigns(id);
ALTER TABLE core.content_angles ADD COLUMN IF NOT EXISTS goal_fit_score DOUBLE PRECISION;
ALTER TABLE core.content_angles ADD COLUMN IF NOT EXISTS cta_type VARCHAR(50);

-- CommentOpportunity: add campaign fields
ALTER TABLE core.comment_opportunities ADD COLUMN IF NOT EXISTS campaign_objective_id UUID REFERENCES core.campaigns(id);
ALTER TABLE core.comment_opportunities ADD COLUMN IF NOT EXISTS goal_fit_score DOUBLE PRECISION;
ALTER TABLE core.comment_opportunities ADD COLUMN IF NOT EXISTS intent_type VARCHAR(50);
ALTER TABLE core.comment_opportunities ADD COLUMN IF NOT EXISTS cta_type VARCHAR(50);

-- CommentDraft: add campaign fields
ALTER TABLE core.comment_drafts ADD COLUMN IF NOT EXISTS campaign_objective_id UUID REFERENCES core.campaigns(id);
ALTER TABLE core.comment_drafts ADD COLUMN IF NOT EXISTS goal_fit_score DOUBLE PRECISION;
ALTER TABLE core.comment_drafts ADD COLUMN IF NOT EXISTS intent_type VARCHAR(50);
ALTER TABLE core.comment_drafts ADD COLUMN IF NOT EXISTS cta_type VARCHAR(50);

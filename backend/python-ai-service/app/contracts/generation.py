from pydantic import BaseModel

from app.contracts.shared import GoalContext


class GenerateHooksRequest(BaseModel):
    workspace_id: str
    topic: str
    pain_clusters: list[dict] = []
    narrative_clusters: list[dict] = []
    goal_context: GoalContext | None = None
    voice_profile_id: str | None = None


class HookGenerationResult(BaseModel):
    hooks: list[dict]


class GenerateCommentDraftRequest(BaseModel):
    workspace_id: str
    post_context: dict
    voice_profile_id: str | None = None
    goal_context: GoalContext | None = None


class CommentDraftResult(BaseModel):
    drafts: list[dict]

from pydantic import BaseModel

from app.contracts.shared import GoalContext


class RunResearchScanRequest(BaseModel):
    workspace_id: str
    query_text: str
    platforms: list[str]
    mode: str = "GENERAL"
    goal_context: GoalContext | None = None


class ResearchScanResult(BaseModel):
    run_id: str
    status: str
    normalized_post_count: int
    normalized_comment_count: int
    errors: list[str] = []

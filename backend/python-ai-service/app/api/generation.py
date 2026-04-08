from fastapi import APIRouter
from pydantic import BaseModel

from app.generation.hooks.hook_engine import generate_hooks

router = APIRouter()


class GenerateHooksRequest(BaseModel):
    workspace_id: str
    topic: str
    pain_clusters: list[dict] = []
    narrative_clusters: list[dict] = []
    goal_context: dict | None = None


@router.post("/internal/generation/hooks")
async def hooks_endpoint(body: GenerateHooksRequest):
    hooks = generate_hooks(
        topic=body.topic,
        pain_clusters=body.pain_clusters,
        narrative_clusters=body.narrative_clusters,
        goal_context=body.goal_context,
    )
    return {"hooks": hooks}

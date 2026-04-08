from fastapi import APIRouter
from pydantic import BaseModel

from app.generation.angles.angle_engine import generate_angles
from app.generation.hooks.hook_engine import generate_hooks
from app.generation.synthesis.synthesis_engine import synthesize

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


class GenerateAnglesRequest(BaseModel):
    workspace_id: str
    topic: str
    signals: dict = {}
    workspace_context: dict = {}


@router.post("/internal/generation/angles")
async def angles_endpoint(body: GenerateAnglesRequest):
    angles = generate_angles(
        topic=body.topic,
        signals=body.signals,
        workspace_context=body.workspace_context,
    )
    return {"angles": angles}


class SynthesizeRequest(BaseModel):
    pain_clusters: list[dict] = []
    objection_clusters: list[dict] = []
    narrative_clusters: list[dict] = []
    workspace_context: dict = {}


@router.post("/internal/generation/synthesis")
async def synthesis_endpoint(body: SynthesizeRequest):
    result = synthesize(
        pain_clusters=body.pain_clusters,
        objection_clusters=body.objection_clusters,
        narrative_clusters=body.narrative_clusters,
        workspace_context=body.workspace_context,
    )
    return result.model_dump()

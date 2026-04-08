from fastapi import APIRouter
from pydantic import BaseModel

from app.generation.angles.angle_engine import generate_angles
from app.generation.engagement.comment_engine import generate_comments
from app.generation.engagement.reply_engine import generate_replies
from app.generation.hooks.hook_engine import generate_hooks
from app.generation.platform.platform_engine import adapt_for_platform
from app.generation.proof.proof_engine import extract_proof
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
    goal_context: dict | None = None


@router.post("/internal/generation/angles")
async def angles_endpoint(body: GenerateAnglesRequest):
    angles = generate_angles(
        topic=body.topic,
        signals=body.signals,
        workspace_context=body.workspace_context,
        goal_context=body.goal_context,
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


class PlatformAdaptRequest(BaseModel):
    idea: str
    platforms: list[str] = ["linkedin", "x", "reddit"]


@router.post("/internal/generation/platform-adapt")
async def platform_adapt_endpoint(body: PlatformAdaptRequest):
    results = [adapt_for_platform(body.idea, p) for p in body.platforms]
    return {"adaptations": results}


class GenerateCommentRequest(BaseModel):
    workspace_id: str
    post_context: dict
    workspace_context: dict = {}
    goal_context: dict | None = None
    voice_profile_vector: dict | None = None
    voice_profile_maturity: float = 0.0


@router.post("/internal/generation/comment")
async def comment_endpoint(body: GenerateCommentRequest):
    drafts = generate_comments(
        post_context=body.post_context,
        workspace_context=body.workspace_context,
        goal_context=body.goal_context,
        voice_profile_vector=body.voice_profile_vector,
        voice_profile_maturity=body.voice_profile_maturity,
    )
    return {"drafts": drafts}


class GenerateReplyRequest(BaseModel):
    incoming_comment: str
    post_context: dict = {}
    workspace_context: dict = {}


@router.post("/internal/generation/reply")
async def reply_endpoint(body: GenerateReplyRequest):
    replies = generate_replies(
        incoming_comment=body.incoming_comment,
        post_context=body.post_context,
        workspace_context=body.workspace_context,
    )
    return {"replies": replies}


class ProofExtractRequest(BaseModel):
    raw_input: str
    workspace_context: dict = {}


@router.post("/internal/generation/proof-extract")
async def proof_extract_endpoint(body: ProofExtractRequest):
    result = extract_proof(body.raw_input, body.workspace_context)
    return result.model_dump()

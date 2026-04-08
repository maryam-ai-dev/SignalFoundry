from fastapi import APIRouter
from pydantic import BaseModel

from app.retrieval.semantic_retrieval import find_similar_posts

router = APIRouter()


class SimilarPostsRequest(BaseModel):
    query_text: str
    workspace_id: str
    limit: int = 5


@router.post("/internal/retrieval/similar")
async def similar_posts(body: SimilarPostsRequest):
    results = find_similar_posts(
        query_text=body.query_text,
        workspace_id=body.workspace_id,
        limit=body.limit,
    )
    return {"results": results}

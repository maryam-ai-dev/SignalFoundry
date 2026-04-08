from datetime import datetime

from pydantic import BaseModel


class NormalizedPost(BaseModel):
    canonical_id: str
    source_platform: str
    source_post_id: str
    workspace_id: str
    author_handle: str
    text: str
    title: str | None = None
    url: str | None = None
    created_at: datetime
    score: int = 0
    comment_count: int = 0
    topic_tags: list[str] = []
    provenance: dict = {}
    raw_metadata: dict = {}


class NormalizedComment(BaseModel):
    canonical_id: str
    source_platform: str
    source_comment_id: str
    post_canonical_id: str
    author_handle: str
    text: str
    created_at: datetime
    score: int = 0
    depth: int = 0
    provenance: dict = {}

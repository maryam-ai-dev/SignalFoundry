from datetime import datetime, timezone

from app.normalization.deduplicator import make_canonical_id
from app.normalization.models import NormalizedComment, NormalizedPost


def map_post(raw: dict, workspace_id: str) -> NormalizedPost:
    body = raw.get("body", "") or ""
    title = raw.get("title", "") or ""
    text = body if body.strip() else title

    return NormalizedPost(
        canonical_id=make_canonical_id("reddit", raw["source_post_id"]),
        source_platform="reddit",
        source_post_id=raw["source_post_id"],
        workspace_id=workspace_id,
        author_handle=raw.get("author", "[deleted]") or "[deleted]",
        text=text,
        title=title or None,
        url=raw.get("url"),
        created_at=_parse_dt(raw.get("created_utc")),
        score=raw.get("score", 0),
        comment_count=raw.get("comment_count", 0),
        topic_tags=[],
        provenance={
            "source_platform": "reddit",
            "subreddit": raw.get("subreddit", ""),
            "fetched_at": raw.get("fetched_at", ""),
        },
        raw_metadata=raw,
    )


def map_comment(raw: dict, post_canonical_id: str) -> NormalizedComment:
    return NormalizedComment(
        canonical_id=make_canonical_id("reddit", raw["source_comment_id"]),
        source_platform="reddit",
        source_comment_id=raw["source_comment_id"],
        post_canonical_id=post_canonical_id,
        author_handle=raw.get("author", "[deleted]") or "[deleted]",
        text=raw.get("body", ""),
        created_at=_parse_dt(raw.get("created_utc")),
        score=raw.get("score", 0),
        depth=raw.get("depth", 0),
        provenance={
            "source_platform": "reddit",
            "fetched_at": raw.get("fetched_at", ""),
        },
    )


def _parse_dt(value) -> datetime:
    if value is None:
        return datetime.now(tz=timezone.utc)
    if isinstance(value, str):
        return datetime.fromisoformat(value)
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(value, tz=timezone.utc)
    return datetime.now(tz=timezone.utc)

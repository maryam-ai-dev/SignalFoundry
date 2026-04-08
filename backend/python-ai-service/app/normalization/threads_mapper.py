from datetime import datetime, timezone

from app.normalization.deduplicator import make_canonical_id
from app.normalization.models import NormalizedPost


def map_post(raw: dict, workspace_id: str) -> NormalizedPost:
    return NormalizedPost(
        canonical_id=make_canonical_id("threads", raw.get("source_post_id", "")),
        source_platform="threads",
        source_post_id=raw.get("source_post_id", ""),
        workspace_id=workspace_id,
        author_handle=raw.get("author", "") or "",
        text=(raw.get("body", "") or "")[:2000],
        title=None,
        url=raw.get("url"),
        created_at=_parse_dt(raw.get("created_utc")),
        score=raw.get("score", 0) or 0,
        comment_count=0,
        provenance={"source_platform": "threads", "fetched_at": raw.get("fetched_at", "")},
        raw_metadata=raw,
    )


def _parse_dt(value) -> datetime:
    if value is None:
        return datetime.now(tz=timezone.utc)
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value)
        except ValueError:
            return datetime.now(tz=timezone.utc)
    return datetime.now(tz=timezone.utc)

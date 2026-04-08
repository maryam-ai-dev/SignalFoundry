from datetime import datetime, timezone

from app.normalization.deduplicator import make_canonical_id
from app.normalization.models import NormalizedPost


def map_post(raw: dict, workspace_id: str) -> NormalizedPost:
    body = raw.get("body", "") or ""
    return NormalizedPost(
        canonical_id=make_canonical_id("x", raw.get("source_post_id", "")),
        source_platform="x",
        source_post_id=raw.get("source_post_id", ""),
        workspace_id=workspace_id,
        author_handle=raw.get("author", "") or "",
        text=body[:2000],
        title=None,
        url=raw.get("url"),
        created_at=_parse_dt(raw.get("created_utc")),
        score=raw.get("score", 0) or 0,
        comment_count=0,
        provenance={"source_platform": "x", "fetched_at": raw.get("fetched_at", "")},
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

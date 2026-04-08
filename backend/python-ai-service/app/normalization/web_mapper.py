import hashlib
from datetime import datetime, timezone

from app.normalization.deduplicator import make_canonical_id
from app.normalization.models import NormalizedPost


def map_page(raw: dict, workspace_id: str) -> NormalizedPost:
    url = raw.get("url", "")
    title = raw.get("title", "") or ""
    text = raw.get("text", "") or ""
    source_id = hashlib.md5(url.encode()).hexdigest()[:16]

    return NormalizedPost(
        canonical_id=make_canonical_id("web", source_id),
        source_platform="web",
        source_post_id=source_id,
        workspace_id=workspace_id,
        author_handle="",
        text=(title + " " + text).strip()[:3000],
        title=title or None,
        url=url,
        created_at=datetime.now(tz=timezone.utc),
        score=0,
        comment_count=0,
        provenance={
            "source_platform": "web",
            "original_url": url,
            "word_count": raw.get("word_count", 0),
        },
        raw_metadata=raw,
    )

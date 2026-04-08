import logging
import math
from datetime import datetime, timezone

from app.normalization.models import NormalizedPost
from app.shared.embeddings import embed_text

logger = logging.getLogger(__name__)


def score_posts_for_engagement(
    posts: list[NormalizedPost],
    workspace_context: dict,
    embeddings_map: dict[str, list[float]] | None = None,
) -> list[dict]:
    if not posts:
        return []

    product_desc = workspace_context.get("productDescription", "")
    product_embedding = embed_text(product_desc) if product_desc else None

    now = datetime.now(tz=timezone.utc)
    scored = []

    for post in posts:
        # Relevance score
        relevance = 0.0
        if product_embedding and embeddings_map and post.canonical_id in embeddings_map:
            relevance = _cosine_sim(product_embedding, embeddings_map[post.canonical_id])

        # Freshness score
        age_hours = (now - post.created_at).total_seconds() / 3600
        if age_hours < 24:
            freshness = 1.0
        elif age_hours < 72:
            freshness = 0.5
        elif age_hours < 168:
            freshness = 0.1
        else:
            freshness = 0.0

        # Discussion quality
        discussion = min(1.0, post.comment_count / 20)

        final_score = round(0.4 * relevance + 0.3 * freshness + 0.3 * discussion, 3)

        scored.append({
            "post_canonical_id": post.canonical_id,
            "platform": post.source_platform,
            "post_summary": post.text[:200],
            "why_worth_commenting": _generate_reason(post, relevance, freshness, discussion),
            "final_score": final_score,
            "relevance_score": round(relevance, 3),
            "freshness_score": round(freshness, 3),
            "discussion_quality": round(discussion, 3),
        })

    scored.sort(key=lambda x: x["final_score"], reverse=True)
    return scored[:10]


def _cosine_sim(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return max(0.0, min(1.0, dot / (norm_a * norm_b)))


def _generate_reason(post: NormalizedPost, relevance: float, freshness: float, discussion: float) -> str:
    parts = []
    if relevance > 0.5:
        parts.append("highly relevant to your product")
    elif relevance > 0.3:
        parts.append("moderately relevant")

    if freshness >= 1.0:
        parts.append("posted today")
    elif freshness >= 0.5:
        parts.append("recent (within 3 days)")

    if discussion >= 0.5:
        parts.append("active discussion")
    elif discussion > 0:
        parts.append("some engagement")

    if not parts:
        parts.append("potential opportunity")

    return f"This {post.source_platform} post is {', '.join(parts)}."

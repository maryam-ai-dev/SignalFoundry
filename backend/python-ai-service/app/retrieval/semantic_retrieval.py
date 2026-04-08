"""Semantic retrieval — pgvector cosine search on normalized_posts."""

import logging

from sqlalchemy import text

from app.shared.database import SessionLocal
from app.shared.embeddings import embed_text

logger = logging.getLogger(__name__)


def find_similar_posts(
    query_text: str,
    workspace_id: str,
    limit: int = 5,
    min_similarity: float = 0.3,
) -> list[dict]:
    if not query_text or not query_text.strip():
        return []

    query_embedding = embed_text(query_text)
    vec_str = "[" + ",".join(str(v) for v in query_embedding) + "]"

    with SessionLocal() as session:
        rows = session.execute(
            text(
                "SELECT canonical_id, text, "
                "1 - (embedding <=> CAST(:vec AS vector)) AS similarity_score "
                "FROM intel.normalized_posts "
                "WHERE workspace_id = :ws_id "
                "AND embedding IS NOT NULL "
                "ORDER BY embedding <=> CAST(:vec AS vector) "
                "LIMIT :lim"
            ),
            {"vec": vec_str, "ws_id": workspace_id, "lim": limit},
        ).fetchall()

    results = []
    for r in rows:
        score = float(r.similarity_score)
        if score < min_similarity:
            continue
        results.append({
            "canonical_id": r.canonical_id,
            "text_snippet": r.text[:200] if r.text else "",
            "similarity_score": round(score, 4),
        })

    return results

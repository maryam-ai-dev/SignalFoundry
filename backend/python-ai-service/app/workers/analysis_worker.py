import logging
import os

import httpx
from sqlalchemy import text

from app.analysis.narratives.narrative_engine import build_narrative_clusters
from app.analysis.trends.trend_engine import detect_trends
from app.normalization.models import NormalizedPost
from app.shared.database import SessionLocal
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)

SPRING_URL = os.getenv("SPRING_URL", "http://localhost:8080")


@celery_app.task(name="run_analysis")
def run_analysis_task(payload: dict) -> dict:
    """Run trend detection + narrative clustering on stored posts.
    Sends Spring analysis callback (finalStage=false), then dispatches generation.
    """
    job_id = payload.get("job_id")
    workspace_id = payload.get("workspace_id", "")
    post_canonical_ids = payload.get("post_canonical_ids", [])

    try:
        posts, embeddings = _fetch_posts_with_embeddings(post_canonical_ids)
        logger.info("Analysis: loaded %d posts with embeddings", len(posts))

        trend_clusters = detect_trends(posts)
        narrative_clusters = build_narrative_clusters(posts, embeddings)

        result = {
            "trend_clusters": [tc.model_dump() for tc in trend_clusters],
            "narrative_clusters": [nc.model_dump() for nc in narrative_clusters],
        }

        logger.info(
            "Analysis complete: %d trends, %d narratives",
            len(trend_clusters), len(narrative_clusters),
        )

        # Send analysis callback (finalStage=false — generation still coming)
        if job_id:
            httpx.post(
                f"{SPRING_URL}/api/internal/jobs/{job_id}/complete",
                json={"stage": "analysis", "finalStage": False, "result": result},
                timeout=10,
            )

        # Dispatch generation task
        # TODO: Wire real generation worker in Phase 8. For now, fire stub generation callback.
        _fire_stub_generation_callback(job_id)

        return result

    except Exception as exc:
        logger.error("Analysis failed for job %s: %s", job_id, exc)
        if job_id:
            try:
                httpx.post(
                    f"{SPRING_URL}/api/internal/jobs/{job_id}/fail",
                    json={"error": str(exc)},
                    timeout=10,
                )
            except Exception:
                pass
        raise


def _fetch_posts_with_embeddings(canonical_ids: list[str]):
    """Fetch posts and their embeddings from the intel schema."""
    if not canonical_ids:
        return [], []

    placeholders = ",".join(f":id{i}" for i in range(len(canonical_ids)))
    params = {f"id{i}": cid for i, cid in enumerate(canonical_ids)}

    with SessionLocal() as session:
        rows = session.execute(
            text(
                f"SELECT canonical_id, source_platform, source_post_id, workspace_id, "
                f"author_handle, text, title, url, created_at, score, comment_count, embedding "
                f"FROM intel.normalized_posts "
                f"WHERE canonical_id IN ({placeholders}) AND embedding IS NOT NULL"
            ),
            params,
        ).fetchall()

    posts = []
    embeddings = []
    for r in rows:
        from datetime import datetime, timezone
        p = NormalizedPost(
            canonical_id=r.canonical_id, source_platform=r.source_platform,
            source_post_id=r.source_post_id, workspace_id=r.workspace_id,
            author_handle=r.author_handle, text=r.text, title=r.title,
            url=r.url, created_at=r.created_at or datetime.now(timezone.utc),
            score=r.score or 0, comment_count=r.comment_count or 0,
        )
        posts.append(p)
        vec_str = r.embedding
        if isinstance(vec_str, str):
            vec = [float(x) for x in vec_str.strip("[]").split(",")]
        else:
            vec = list(vec_str)
        embeddings.append((r.canonical_id, vec))

    return posts, embeddings


def _fire_stub_generation_callback(job_id: str | None):
    """Temporary: fire generation callback until real generation worker exists."""
    if not job_id:
        return
    try:
        httpx.post(
            f"{SPRING_URL}/api/internal/jobs/{job_id}/complete",
            json={"stage": "generation", "finalStage": True, "result": {}},
            timeout=10,
        )
    except Exception as exc:
        logger.warning("Stub generation callback failed for job %s: %s", job_id, exc)

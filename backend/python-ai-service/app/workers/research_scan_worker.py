import logging
import os

import httpx

from app.connectors.reddit_connector import RedditConnector
from app.normalization.reddit_mapper import map_post, map_comment
from app.normalization.storage import save_posts, save_comments
from app.shared.database import SessionLocal
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)

SPRING_URL = os.getenv("SPRING_URL", "http://localhost:8080")


@celery_app.task(name="research_scan")
def run_research_scan(payload: dict) -> dict:
    """Scan stage: fetch posts + comments from connectors, normalize, store.
    Does NOT call the Spring complete callback — the chain continues to embed/analysis/generation.
    Calls the fail callback on exception.
    """
    job_id = payload.get("job_id")
    workspace_id = payload.get("workspace_id", "")
    query_text = payload.get("query_text", "")
    platforms = payload.get("platforms", [])

    if not job_id:
        return {"status": "error", "message": "no job_id in payload"}

    try:
        all_posts = []
        all_comments = []

        if "reddit" in platforms:
            connector = RedditConnector()
            raw_posts = connector.search_posts(query_text, window_days=7, limit=50)
            logger.info("Reddit returned %d posts for query '%s'", len(raw_posts), query_text)

            posts = [map_post(rp, workspace_id) for rp in raw_posts]
            all_posts.extend(posts)

            # Fetch comments for top 10 posts by score
            top_posts = sorted(raw_posts, key=lambda p: p.get("score", 0), reverse=True)[:10]
            for rp in top_posts:
                raw_comments = connector.fetch_comments(rp["source_post_id"], limit=50)
                post_cid = posts[raw_posts.index(rp)].canonical_id if rp in raw_posts else ""
                if post_cid:
                    comments = [map_comment(rc, post_cid) for rc in raw_comments]
                    all_comments.extend(comments)

        # Store to intel schema
        with SessionLocal() as session:
            post_count = save_posts(all_posts, session)
            comment_count = save_comments(all_comments, session)

        logger.info("Stored %d posts, %d comments for job %s", post_count, comment_count, job_id)

        # Chain to embed worker
        canonical_ids = [p.canonical_id for p in all_posts]
        if canonical_ids:
            from app.workers.embed_worker import embed_posts_task
            embed_posts_task.delay(canonical_ids)
            logger.info("Dispatched embed_posts_task for %d posts", len(canonical_ids))

        # Fire stub callbacks until analysis/generation workers are wired (Phase 6+)
        # TODO: Remove once real analysis/generation workers chain from embed
        _fire_stub_callbacks(job_id)

        return {
            "status": "ok",
            "normalized_post_count": len(all_posts),
            "normalized_comment_count": len(all_comments),
        }

    except Exception as exc:
        logger.error("Research scan failed for job %s: %s", job_id, exc)
        try:
            httpx.post(
                f"{SPRING_URL}/api/internal/jobs/{job_id}/fail",
                json={"error": str(exc)},
                timeout=10,
            )
        except Exception:
            pass
        raise


def _fire_stub_callbacks(job_id: str):
    """Temporary: fire analysis + generation callbacks until real workers exist."""
    try:
        httpx.post(
            f"{SPRING_URL}/api/internal/jobs/{job_id}/complete",
            json={"stage": "analysis", "finalStage": False, "result": {}},
            timeout=10,
        )
        httpx.post(
            f"{SPRING_URL}/api/internal/jobs/{job_id}/complete",
            json={"stage": "generation", "finalStage": True, "result": {}},
            timeout=10,
        )
    except Exception as exc:
        logger.warning("Stub callback failed for job %s: %s", job_id, exc)

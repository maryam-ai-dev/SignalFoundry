import logging

from app.analysis.embedder import embed_and_store_posts
from app.shared.database import SessionLocal
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="embed_posts")
def embed_posts_task(post_canonical_ids: list[str], payload: dict | None = None) -> dict:
    """Embed posts that don't have embeddings yet, then dispatch analysis."""
    try:
        with SessionLocal() as session:
            count = embed_and_store_posts(post_canonical_ids, session)
        logger.info("Embedded %d posts, dispatching analysis", count)

        # Chain to analysis worker
        if payload and post_canonical_ids:
            from app.workers.analysis_worker import run_analysis_task
            analysis_payload = {
                "job_id": payload.get("job_id"),
                "workspace_id": payload.get("workspace_id"),
                "post_canonical_ids": post_canonical_ids,
                "product_context": payload.get("product_context", {}),
            }
            run_analysis_task.delay(analysis_payload)

        return {"status": "ok", "embedded_count": count}
    except Exception as exc:
        logger.error("Embed task failed: %s", exc)
        raise

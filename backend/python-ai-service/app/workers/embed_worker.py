import logging

from app.analysis.embedder import embed_and_store_posts
from app.shared.database import SessionLocal
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="embed_posts")
def embed_posts_task(post_canonical_ids: list[str]) -> dict:
    """Embed posts that don't have embeddings yet. Does NOT call Spring callback."""
    try:
        with SessionLocal() as session:
            count = embed_and_store_posts(post_canonical_ids, session)
        return {"status": "ok", "embedded_count": count}
    except Exception as exc:
        logger.error("Embed task failed: %s", exc)
        raise

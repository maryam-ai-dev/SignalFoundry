from app.workers.celery_app import celery_app


@celery_app.task(name="research_scan")
def run_research_scan(payload: dict) -> dict:
    """Stub task — returns empty results. Real implementation in Phase 4+."""
    return {
        "status": "ok",
        "normalized_post_count": 0,
        "normalized_comment_count": 0,
    }

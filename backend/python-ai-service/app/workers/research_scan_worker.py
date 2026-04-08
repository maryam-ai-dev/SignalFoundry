import logging
import os

import httpx

from app.connectors.product_hunt_connector import ProductHuntConnector
from app.connectors.reddit_connector import RedditConnector
from app.connectors.tiktok_connector import TikTokConnector
from app.connectors.x_connector import XConnector
from app.connectors.youtube_connector import YouTubeConnector
from app.normalization.product_hunt_mapper import map_post as map_ph_post, map_comment as map_ph_comment
from app.normalization.reddit_mapper import map_post as map_reddit_post, map_comment as map_reddit_comment
from app.normalization.tiktok_mapper import map_post as map_tiktok_post
from app.normalization.x_mapper import map_post as map_x_post
from app.normalization.youtube_mapper import map_video, map_comment as map_yt_comment
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

            posts = [map_reddit_post(rp, workspace_id) for rp in raw_posts]
            all_posts.extend(posts)

            top_posts = sorted(raw_posts, key=lambda p: p.get("score", 0), reverse=True)[:10]
            for rp in top_posts:
                raw_comments = connector.fetch_comments(rp["source_post_id"], limit=50)
                post_cid = posts[raw_posts.index(rp)].canonical_id if rp in raw_posts else ""
                if post_cid:
                    comments = [map_reddit_comment(rc, post_cid) for rc in raw_comments]
                    all_comments.extend(comments)

        if "youtube" in platforms:
            yt_connector = YouTubeConnector()
            raw_videos = yt_connector.search_posts(query_text, window_days=7, limit=25)
            logger.info("YouTube returned %d videos for query '%s'", len(raw_videos), query_text)

            videos = [map_video(rv, workspace_id) for rv in raw_videos]
            all_posts.extend(videos)

            top_videos = sorted(raw_videos, key=lambda v: v.get("score", 0), reverse=True)[:5]
            for rv in top_videos:
                raw_comments = yt_connector.fetch_comments(rv["source_post_id"], limit=30)
                vid_cid = videos[raw_videos.index(rv)].canonical_id if rv in raw_videos else ""
                if vid_cid:
                    yt_comments = [map_yt_comment(rc, vid_cid) for rc in raw_comments]
                    all_comments.extend(yt_comments)

        if "producthunt" in platforms:
            ph_connector = ProductHuntConnector()
            raw_ph = ph_connector.search_posts(query_text, window_days=30, limit=20)
            logger.info("Product Hunt returned %d posts for query '%s'", len(raw_ph), query_text)

            ph_posts = [map_ph_post(rp, workspace_id) for rp in raw_ph]
            all_posts.extend(ph_posts)

            for rp in raw_ph[:5]:
                raw_comments = ph_connector.fetch_comments(rp["source_post_id"], limit=20)
                ph_cid = ph_posts[raw_ph.index(rp)].canonical_id if rp in raw_ph else ""
                if ph_cid:
                    ph_comments = [map_ph_comment(rc, ph_cid) for rc in raw_comments]
                    all_comments.extend(ph_comments)

        if "x" in platforms:
            x_connector = XConnector()
            raw_x = x_connector.search_posts(query_text, window_days=3, limit=25)
            logger.info("X returned %d posts for query '%s'", len(raw_x), query_text)
            x_posts = [map_x_post(rp, workspace_id) for rp in raw_x]
            all_posts.extend(x_posts)

        if "tiktok" in platforms:
            tt_connector = TikTokConnector()
            raw_tt = tt_connector.search_posts(query_text, window_days=7, limit=20)
            logger.info("TikTok returned %d posts for query '%s'", len(raw_tt), query_text)
            tt_posts = [map_tiktok_post(rp, workspace_id) for rp in raw_tt]
            all_posts.extend(tt_posts)

        # Store to intel schema
        with SessionLocal() as session:
            post_count = save_posts(all_posts, session)
            comment_count = save_comments(all_comments, session)

        logger.info("Stored %d posts, %d comments for job %s", post_count, comment_count, job_id)

        # Chain to embed worker (which chains to analysis, which chains to generation)
        canonical_ids = [p.canonical_id for p in all_posts]
        if canonical_ids:
            from app.workers.embed_worker import embed_posts_task
            embed_posts_task.delay(canonical_ids, payload)
            logger.info("Dispatched embed_posts_task for %d posts", len(canonical_ids))

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

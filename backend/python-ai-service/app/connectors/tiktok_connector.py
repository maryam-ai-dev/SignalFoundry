"""TikTok connector — uses unofficial TikTokApi library.

Grey area: unofficial browser automation. For personal/research use only.
May require session cookies. Returns [] on any failure.
"""

import asyncio
import logging
from datetime import datetime, timezone

from app.connectors.base_connector import BaseConnector

logger = logging.getLogger(__name__)


class TikTokConnector(BaseConnector):

    def search_posts(self, query: str, window_days: int = 7, limit: int = 25) -> list[dict]:
        try:
            return asyncio.run(self.search_posts_async(query, window_days, limit))
        except RuntimeError:
            # Already in an event loop (Celery worker)
            loop = asyncio.new_event_loop()
            try:
                return loop.run_until_complete(self.search_posts_async(query, window_days, limit))
            finally:
                loop.close()
        except Exception as e:
            logger.warning("TikTok search error: %s", e)
            return []

    async def search_posts_async(self, query: str, window_days: int = 7, limit: int = 25) -> list[dict]:
        try:
            from TikTokApi import TikTokApi

            results = []
            async with TikTokApi() as api:
                await api.create_sessions(num_sessions=1, sleep_after=3, headless=True)
                count = 0
                async for video in api.search.videos(query, count=limit):
                    vd = video.as_dict if hasattr(video, 'as_dict') else video
                    if isinstance(vd, dict):
                        desc = vd.get("desc", "")
                        author = vd.get("author", {})
                        stats = vd.get("stats", {})
                        vid_id = str(vd.get("id", ""))
                    else:
                        desc = getattr(video, 'desc', '') or ''
                        author = getattr(video, 'author', {}) or {}
                        stats = getattr(video, 'stats', {}) or {}
                        vid_id = str(getattr(video, 'id', ''))

                    author_handle = author.get("uniqueId", "") if isinstance(author, dict) else str(author)

                    results.append({
                        "source_platform": "tiktok",
                        "source_post_id": vid_id,
                        "title": "",
                        "body": desc,
                        "author": author_handle,
                        "url": f"https://tiktok.com/@{author_handle}/video/{vid_id}",
                        "subreddit": "",
                        "score": stats.get("playCount", 0) if isinstance(stats, dict) else 0,
                        "comment_count": stats.get("commentCount", 0) if isinstance(stats, dict) else 0,
                        "created_utc": datetime.now(tz=timezone.utc).isoformat(),
                        "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
                    })
                    count += 1
                    if count >= limit:
                        break

            logger.info("TikTok returned %d posts for '%s'", len(results), query)
            return results
        except Exception as e:
            logger.warning("TikTok API error: %s", e)
            return []

    def fetch_comments(self, post_id: str, limit: int = 50) -> list[dict]:
        try:
            return asyncio.run(self._fetch_comments_async(post_id, limit))
        except Exception as e:
            logger.warning("TikTok comments error: %s", e)
            return []

    async def _fetch_comments_async(self, post_id: str, limit: int) -> list[dict]:
        try:
            from TikTokApi import TikTokApi

            results = []
            async with TikTokApi() as api:
                await api.create_sessions(num_sessions=1, sleep_after=3, headless=True)
                video = api.video(id=post_id)
                count = 0
                async for comment in video.comments(count=limit):
                    cd = comment.as_dict if hasattr(comment, 'as_dict') else comment
                    if isinstance(cd, dict):
                        text = cd.get("text", "")
                        user = cd.get("user", {})
                        cid = str(cd.get("cid", ""))
                    else:
                        text = getattr(comment, 'text', '')
                        user = getattr(comment, 'user', {}) or {}
                        cid = str(getattr(comment, 'cid', ''))

                    results.append({
                        "source_platform": "tiktok",
                        "source_comment_id": cid,
                        "post_source_id": post_id,
                        "author": user.get("uniqueId", "") if isinstance(user, dict) else "",
                        "body": text,
                        "score": 0,
                        "depth": 0,
                        "created_utc": datetime.now(tz=timezone.utc).isoformat(),
                        "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
                    })
                    count += 1
                    if count >= limit:
                        break

            return results
        except Exception as e:
            logger.warning("TikTok comments API error: %s", e)
            return []

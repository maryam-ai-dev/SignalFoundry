"""TikTok connector — uses tikwm.com public API (primary) with TikTokApi fallback.

Grey area: third-party API for personal/research use only.
Returns [] on any failure — never crashes the scan.
"""

import logging
from datetime import datetime, timezone

import httpx

from app.connectors.base_connector import BaseConnector

logger = logging.getLogger(__name__)


class TikTokConnector(BaseConnector):

    def search_posts(self, query: str, window_days: int = 7, limit: int = 25) -> list[dict]:
        results = self._search_tikwm(query, limit)
        if results:
            return results
        # TikTokApi fallback disabled — too unreliable with session management
        return []

    def fetch_comments(self, post_id: str, limit: int = 50) -> list[dict]:
        return self._fetch_comments_tikwm(post_id, limit)

    def _search_tikwm(self, query: str, limit: int) -> list[dict]:
        try:
            resp = httpx.get(
                "https://www.tikwm.com/api/feed/search",
                params={"keywords": query, "count": min(limit, 30), "cursor": 0},
                headers={"User-Agent": "Mozilla/5.0"},
                timeout=15,
            )
            if resp.status_code != 200:
                return []

            data = resp.json()
            videos = data.get("data", {}).get("videos", [])
            results = []
            for v in videos[:limit]:
                vid_id = str(v.get("video_id", "") or v.get("id", ""))
                author = v.get("author", {})
                author_handle = author.get("unique_id", "") if isinstance(author, dict) else ""

                results.append({
                    "source_platform": "tiktok",
                    "source_post_id": vid_id,
                    "title": "",
                    "body": v.get("title", "") or "",
                    "author": author_handle,
                    "url": f"https://tiktok.com/@{author_handle}/video/{vid_id}" if author_handle else "",
                    "subreddit": "",
                    "score": v.get("play_count", 0) or 0,
                    "comment_count": v.get("comment_count", 0) or 0,
                    "created_utc": datetime.fromtimestamp(
                        v.get("create_time", 0), tz=timezone.utc
                    ).isoformat() if v.get("create_time") else datetime.now(tz=timezone.utc).isoformat(),
                    "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
                })

            logger.info("TikTok (tikwm) returned %d posts for '%s'", len(results), query)
            return results
        except Exception as e:
            logger.warning("TikTok tikwm error: %s", e)
            return []

    def _fetch_comments_tikwm(self, post_id: str, limit: int) -> list[dict]:
        try:
            resp = httpx.get(
                "https://www.tikwm.com/api/comment/list",
                params={"url": f"https://www.tiktok.com/@x/video/{post_id}", "count": min(limit, 30), "cursor": 0},
                headers={"User-Agent": "Mozilla/5.0"},
                timeout=15,
            )
            if resp.status_code != 200:
                return []

            data = resp.json()
            comments = data.get("data", {}).get("comments", [])
            results = []
            for c in comments[:limit]:
                user = c.get("user", {})
                results.append({
                    "source_platform": "tiktok",
                    "source_comment_id": str(c.get("cid", "")),
                    "post_source_id": post_id,
                    "author": user.get("unique_id", "") if isinstance(user, dict) else "",
                    "body": c.get("text", ""),
                    "score": c.get("digg_count", 0) or 0,
                    "depth": 0,
                    "created_utc": datetime.fromtimestamp(
                        c.get("create_time", 0), tz=timezone.utc
                    ).isoformat() if c.get("create_time") else datetime.now(tz=timezone.utc).isoformat(),
                    "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
                })

            return results
        except Exception as e:
            logger.warning("TikTok comments error: %s", e)
            return []

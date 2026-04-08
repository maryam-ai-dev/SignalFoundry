import logging
import os
from datetime import datetime, timezone

import yt_dlp

from app.connectors.base_connector import BaseConnector

logger = logging.getLogger(__name__)

_HAS_YT_KEY = bool(os.getenv("YOUTUBE_API_KEY"))


class YouTubeConnector(BaseConnector):

    def __init__(self):
        self.youtube = None
        if _HAS_YT_KEY:
            try:
                from googleapiclient.discovery import build
                self.youtube = build("youtube", "v3", developerKey=os.getenv("YOUTUBE_API_KEY"))
            except Exception as e:
                logger.error("Failed to initialise YouTube client: %s", e)

    def search_posts(self, query: str, window_days: int = 7, limit: int = 25) -> list[dict]:
        # Try official API first
        if self.youtube is not None:
            results = self._search_official(query, window_days, limit)
            if results:
                return results

        # Fallback: yt-dlp (no API key needed)
        return self._search_ytdlp(query, limit)

    def fetch_comments(self, video_id: str, limit: int = 50) -> list[dict]:
        # Try official API first
        if self.youtube is not None:
            results = self._fetch_comments_official(video_id, limit)
            if results is not None:
                return results

        # Fallback: yt-dlp comment extraction
        return self._fetch_comments_ytdlp(video_id, limit)

    # ── Official API ──

    def _search_official(self, query: str, window_days: int, limit: int) -> list[dict]:
        try:
            from datetime import timedelta
            published_after = (datetime.now(tz=timezone.utc) - timedelta(days=window_days)).isoformat()
            response = self.youtube.search().list(
                q=query, part="snippet", type="video", order="relevance",
                publishedAfter=published_after, maxResults=min(limit, 50),
            ).execute()

            video_ids = [item["id"]["videoId"] for item in response.get("items", [])]
            if not video_ids:
                return []

            stats_response = self.youtube.videos().list(
                id=",".join(video_ids), part="statistics",
            ).execute()
            stats_map = {item["id"]: item.get("statistics", {}) for item in stats_response.get("items", [])}

            results = []
            for item in response.get("items", []):
                snippet = item.get("snippet", {})
                vid = item["id"]["videoId"]
                stats = stats_map.get(vid, {})
                results.append({
                    "source_platform": "youtube",
                    "source_post_id": vid,
                    "title": snippet.get("title", ""),
                    "body": snippet.get("description", ""),
                    "author": snippet.get("channelTitle", ""),
                    "url": f"https://youtube.com/watch?v={vid}",
                    "subreddit": "",
                    "score": int(stats.get("viewCount", 0)),
                    "comment_count": int(stats.get("commentCount", 0)),
                    "created_utc": snippet.get("publishedAt", datetime.now(tz=timezone.utc).isoformat()),
                    "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
                })
            logger.info("YouTube API returned %d videos for '%s'", len(results), query)
            return results
        except Exception as e:
            logger.error("YouTube API search error: %s", e)
            return []

    def _fetch_comments_official(self, video_id: str, limit: int) -> list[dict] | None:
        try:
            response = self.youtube.commentThreads().list(
                videoId=video_id, part="snippet", order="relevance",
                maxResults=min(limit, 100),
            ).execute()
            results = []
            for item in response.get("items", []):
                c = item["snippet"]["topLevelComment"]["snippet"]
                results.append({
                    "source_platform": "youtube",
                    "source_comment_id": item["id"],
                    "post_source_id": video_id,
                    "author": c.get("authorDisplayName", ""),
                    "body": c.get("textDisplay", ""),
                    "score": c.get("likeCount", 0),
                    "depth": 0,
                    "created_utc": c.get("publishedAt", datetime.now(tz=timezone.utc).isoformat()),
                    "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
                })
            return results
        except Exception as e:
            logger.warning("YouTube API comments error: %s", e)
            return None

    # ── yt-dlp fallback (no API key) ──

    def _search_ytdlp(self, query: str, limit: int) -> list[dict]:
        try:
            ydl_opts = {
                "quiet": True,
                "no_warnings": True,
                "extract_flat": True,
                "default_search": f"ytsearch{min(limit, 25)}",
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                result = ydl.extract_info(f"ytsearch{min(limit, 25)}:{query}", download=False)

            results = []
            for entry in result.get("entries", []):
                if not entry:
                    continue
                vid = entry.get("id", "")
                results.append({
                    "source_platform": "youtube",
                    "source_post_id": vid,
                    "title": entry.get("title", ""),
                    "body": entry.get("description", "") or "",
                    "author": entry.get("channel", "") or entry.get("uploader", "") or "",
                    "url": entry.get("url", "") or f"https://youtube.com/watch?v={vid}",
                    "subreddit": "",
                    "score": entry.get("view_count", 0) or 0,
                    "comment_count": entry.get("comment_count", 0) or 0,
                    "created_utc": datetime.now(tz=timezone.utc).isoformat(),
                    "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
                })
            logger.info("yt-dlp returned %d videos for '%s'", len(results), query)
            return results
        except Exception as e:
            logger.error("yt-dlp search error: %s", e)
            return []

    def _fetch_comments_ytdlp(self, video_id: str, limit: int) -> list[dict]:
        try:
            ydl_opts = {
                "quiet": True,
                "no_warnings": True,
                "skip_download": True,
                "getcomments": True,
                "extractor_args": {"youtube": {"max_comments": [str(limit)]}},
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(f"https://youtube.com/watch?v={video_id}", download=False)

            results = []
            for c in (info or {}).get("comments", []) or []:
                results.append({
                    "source_platform": "youtube",
                    "source_comment_id": c.get("id", ""),
                    "post_source_id": video_id,
                    "author": c.get("author", ""),
                    "body": c.get("text", ""),
                    "score": c.get("like_count", 0) or 0,
                    "depth": 0,
                    "created_utc": datetime.now(tz=timezone.utc).isoformat(),
                    "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
                })
            return results[:limit]
        except Exception as e:
            logger.warning("yt-dlp comments error for %s: %s", video_id, e)
            return []

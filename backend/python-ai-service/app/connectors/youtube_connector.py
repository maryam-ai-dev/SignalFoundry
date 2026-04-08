import logging
import os
from datetime import datetime, timedelta, timezone

from app.connectors.base_connector import BaseConnector

logger = logging.getLogger(__name__)


class YouTubeConnector(BaseConnector):

    def __init__(self):
        self.api_key = os.getenv("YOUTUBE_API_KEY", "")
        self.youtube = None
        if self.api_key:
            try:
                from googleapiclient.discovery import build
                self.youtube = build("youtube", "v3", developerKey=self.api_key)
            except Exception as e:
                logger.error("Failed to initialise YouTube client: %s", e)

    def search_posts(self, query: str, window_days: int = 7, limit: int = 25) -> list[dict]:
        if self.youtube is None:
            logger.warning("YouTube client not initialised — returning []")
            return []

        try:
            published_after = (datetime.now(tz=timezone.utc) - timedelta(days=window_days)).isoformat()
            request = self.youtube.search().list(
                q=query,
                part="snippet",
                type="video",
                order="relevance",
                publishedAfter=published_after,
                maxResults=min(limit, 50),
            )
            response = request.execute()

            video_ids = [item["id"]["videoId"] for item in response.get("items", [])]
            if not video_ids:
                return []

            # Fetch statistics for view counts
            stats_response = self.youtube.videos().list(
                id=",".join(video_ids),
                part="statistics",
            ).execute()
            stats_map = {
                item["id"]: item.get("statistics", {})
                for item in stats_response.get("items", [])
            }

            results = []
            for item in response.get("items", []):
                snippet = item.get("snippet", {})
                video_id = item["id"]["videoId"]
                stats = stats_map.get(video_id, {})
                results.append({
                    "source_platform": "youtube",
                    "source_post_id": video_id,
                    "title": snippet.get("title", ""),
                    "body": snippet.get("description", ""),
                    "author": snippet.get("channelTitle", ""),
                    "url": f"https://youtube.com/watch?v={video_id}",
                    "subreddit": "",
                    "score": int(stats.get("viewCount", 0)),
                    "comment_count": int(stats.get("commentCount", 0)),
                    "created_utc": snippet.get("publishedAt", datetime.now(tz=timezone.utc).isoformat()),
                    "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
                })
            logger.info("YouTube returned %d videos for '%s'", len(results), query)
            return results

        except Exception as e:
            logger.error("YouTube search error: %s", e)
            return []

    def fetch_comments(self, video_id: str, limit: int = 50) -> list[dict]:
        if self.youtube is None:
            return []

        try:
            request = self.youtube.commentThreads().list(
                videoId=video_id,
                part="snippet",
                order="relevance",
                maxResults=min(limit, 100),
            )
            response = request.execute()

            results = []
            for item in response.get("items", []):
                comment = item["snippet"]["topLevelComment"]["snippet"]
                results.append({
                    "source_platform": "youtube",
                    "source_comment_id": item["id"],
                    "post_source_id": video_id,
                    "author": comment.get("authorDisplayName", ""),
                    "body": comment.get("textDisplay", ""),
                    "score": comment.get("likeCount", 0),
                    "depth": 0,
                    "created_utc": comment.get("publishedAt", datetime.now(tz=timezone.utc).isoformat()),
                    "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
                })
            return results

        except Exception as e:
            # 403 = comments disabled, other errors
            logger.warning("YouTube comments error for %s: %s", video_id, e)
            return []

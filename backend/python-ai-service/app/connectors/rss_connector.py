import hashlib
import logging
import time
from datetime import datetime, timezone
from calendar import timegm

import feedparser

from app.connectors.base_connector import BaseConnector

logger = logging.getLogger(__name__)


class RSSConnector(BaseConnector):

    def fetch_feed(self, url: str, limit: int = 25) -> list[dict]:
        try:
            feed = feedparser.parse(url)
            if feed.bozo and not feed.entries:
                logger.warning("RSS parse error for %s: %s", url, feed.bozo_exception)
                return []

            results = []
            for entry in feed.entries[:limit]:
                title = entry.get("title", "")
                summary = entry.get("summary", "") or entry.get("description", "") or ""
                link = entry.get("link", "")
                author = entry.get("author", "") or ""
                published = _parse_feed_date(entry)
                source_id = entry.get("id", "") or link or hashlib.md5(title.encode()).hexdigest()

                results.append({
                    "source_platform": "rss",
                    "source_post_id": source_id,
                    "title": title,
                    "body": summary,
                    "author": author,
                    "url": link,
                    "subreddit": "",
                    "score": 0,
                    "comment_count": 0,
                    "created_utc": published.isoformat(),
                    "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
                })

            logger.info("RSS returned %d entries from %s", len(results), url)
            return results
        except Exception as e:
            logger.warning("RSS fetch error for %s: %s", url, e)
            return []

    def search_posts(self, query: str, window_days: int = 7, limit: int = 25) -> list[dict]:
        # RSS doesn't support search — use fetch_feed with a known URL instead
        return []

    def fetch_comments(self, post_id: str, limit: int = 50) -> list[dict]:
        # RSS feeds don't have comments
        return []


def _parse_feed_date(entry) -> datetime:
    for field in ("published_parsed", "updated_parsed"):
        parsed = entry.get(field)
        if parsed:
            try:
                return datetime.fromtimestamp(timegm(parsed), tz=timezone.utc)
            except (ValueError, OverflowError):
                pass
    return datetime.now(tz=timezone.utc)

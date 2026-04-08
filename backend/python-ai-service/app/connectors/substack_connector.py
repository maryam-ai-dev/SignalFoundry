"""Substack connector — RSS feeds (primary) + httpx search (fallback).

RSS approach is stable and works for any public Substack publication.
Search scrapes substack.com/search for cross-publication discovery.
"""

import logging
import re
from datetime import datetime, timezone
from calendar import timegm

import feedparser
import httpx

from app.connectors.base_connector import BaseConnector

logger = logging.getLogger(__name__)


class SubstackConnector(BaseConnector):

    def search_posts(self, query: str, window_days: int = 30, limit: int = 25) -> list[dict]:
        # Strategy A: if query looks like a Substack URL, use RSS
        if "substack.com" in query or query.endswith(".substack.com"):
            return self._fetch_rss(query, limit)

        # Strategy B: keyword search via substack.com/search
        return self._search_web(query, limit)

    def fetch_comments(self, post_id: str, limit: int = 50) -> list[dict]:
        # Substack comments require login
        return []

    def _fetch_rss(self, url: str, limit: int) -> list[dict]:
        # Normalize URL to RSS feed
        clean = url.strip().rstrip("/")
        if not clean.startswith("http"):
            clean = f"https://{clean}"
        if not clean.endswith("/feed"):
            clean = f"{clean}/feed"

        try:
            feed = feedparser.parse(clean)
            if feed.bozo and not feed.entries:
                logger.warning("Substack RSS parse error for %s: %s", clean, feed.bozo_exception)
                return []

            results = []
            for entry in feed.entries[:limit]:
                title = entry.get("title", "")
                summary = entry.get("summary", "") or entry.get("description", "") or ""
                # Strip HTML tags from summary
                summary_clean = re.sub(r"<[^>]+>", "", summary).strip()

                results.append({
                    "source_platform": "substack",
                    "source_post_id": entry.get("id", entry.get("link", "")),
                    "title": title,
                    "body": summary_clean[:3000],
                    "author": entry.get("author", "") or feed.feed.get("title", ""),
                    "url": entry.get("link", ""),
                    "subreddit": "",
                    "score": 0,
                    "comment_count": 0,
                    "created_utc": _parse_feed_date(entry).isoformat(),
                    "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
                })

            logger.info("Substack RSS returned %d posts from %s", len(results), clean)
            return results
        except Exception as e:
            logger.warning("Substack RSS error for %s: %s", clean, e)
            return []

    def _search_web(self, query: str, limit: int) -> list[dict]:
        try:
            resp = httpx.get(
                "https://substack.com/api/v1/post/search",
                params={"query": query, "page": 0, "type": "posts"},
                headers={"User-Agent": "Mozilla/5.0"},
                timeout=15,
            )
            if resp.status_code != 200:
                # Fallback: try Google
                return self._search_google_fallback(query, limit)

            data = resp.json()
            posts = data if isinstance(data, list) else data.get("results", data.get("posts", []))

            results = []
            for p in posts[:limit]:
                results.append({
                    "source_platform": "substack",
                    "source_post_id": str(p.get("id", p.get("slug", ""))),
                    "title": p.get("title", ""),
                    "body": p.get("subtitle", "") or p.get("description", "") or "",
                    "author": p.get("publishedBylines", [{}])[0].get("name", "") if p.get("publishedBylines") else "",
                    "url": p.get("canonical_url", "") or p.get("url", ""),
                    "subreddit": "",
                    "score": p.get("reactions", {}).get("❤", 0) if isinstance(p.get("reactions"), dict) else 0,
                    "comment_count": p.get("comment_count", 0) or 0,
                    "created_utc": p.get("post_date", datetime.now(tz=timezone.utc).isoformat()),
                    "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
                })

            if results:
                logger.info("Substack search returned %d posts for '%s'", len(results), query)
            return results
        except Exception as e:
            logger.warning("Substack search error: %s", e)
            return self._search_google_fallback(query, limit)

    def _search_google_fallback(self, query: str, limit: int) -> list[dict]:
        """Last resort: find Substack publications via their RSS feeds."""
        # Can't reliably search Substack without their API working
        # Return empty — user should provide publication URLs directly
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

import logging
import os
import time
from datetime import datetime, timezone

import httpx

from app.connectors.base_connector import BaseConnector

logger = logging.getLogger(__name__)

_USER_AGENT = os.getenv("REDDIT_USER_AGENT", "SignalFoundry/0.1")
_HAS_PRAW_CREDS = bool(os.getenv("REDDIT_CLIENT_ID"))


class RedditConnector(BaseConnector):

    def __init__(self):
        self.reddit = None
        if _HAS_PRAW_CREDS:
            try:
                import praw
                self.reddit = praw.Reddit(
                    client_id=os.getenv("REDDIT_CLIENT_ID", ""),
                    client_secret=os.getenv("REDDIT_CLIENT_SECRET", ""),
                    user_agent=_USER_AGENT,
                )
            except Exception as e:
                logger.error("Failed to initialise PRAW client: %s", e)

    def search_posts(self, query: str, window_days: int = 7, limit: int = 25) -> list[dict]:
        # Try official API first
        if self.reddit is not None:
            results = self._search_praw(query, window_days, limit)
            if results:
                return results

        # Fallback: public JSON endpoint (no auth needed)
        return self._search_json(query, window_days, limit)

    def fetch_comments(self, post_id: str, limit: int = 50) -> list[dict]:
        # Try official API first
        if self.reddit is not None:
            results = self._fetch_comments_praw(post_id, limit)
            if results is not None:
                return results

        # Fallback: public JSON endpoint
        return self._fetch_comments_json(post_id, limit)

    # ── Official PRAW methods ──

    def _search_praw(self, query: str, window_days: int, limit: int) -> list[dict]:
        import praw
        import prawcore.exceptions

        results: list[dict] = []
        for attempt in range(3):
            try:
                submissions = self.reddit.subreddit("all").search(
                    query, sort="relevance", time_filter=_time_filter(window_days), limit=limit
                )
                for s in submissions:
                    results.append(_praw_post_to_dict(s))
                return results
            except prawcore.exceptions.RequestException as e:
                logger.warning("PRAW request error (attempt %d/3): %s", attempt + 1, e)
                if attempt < 2:
                    time.sleep(2)
            except Exception as e:
                logger.error("PRAW search error: %s", e)
                return []
        return results

    def _fetch_comments_praw(self, post_id: str, limit: int) -> list[dict] | None:
        import prawcore.exceptions

        results: list[dict] = []
        for attempt in range(3):
            try:
                submission = self.reddit.submission(id=post_id)
                submission.comments.replace_more(limit=0)
                for comment in submission.comments[:limit]:
                    results.append(_praw_comment_to_dict(comment, post_id))
                return results
            except prawcore.exceptions.RequestException as e:
                logger.warning("PRAW comments error (attempt %d/3): %s", attempt + 1, e)
                if attempt < 2:
                    time.sleep(2)
            except Exception as e:
                logger.error("PRAW comments error: %s", e)
                return None  # signal fallback
        return results

    # ── Public JSON fallback (no auth) ──

    def _search_json(self, query: str, window_days: int, limit: int) -> list[dict]:
        url = "https://www.reddit.com/search.json"
        params = {
            "q": query,
            "sort": "relevance",
            "t": _time_filter(window_days),
            "limit": min(limit, 100),
        }
        for attempt in range(3):
            try:
                resp = httpx.get(url, params=params, headers={"User-Agent": _USER_AGENT}, timeout=15)
                if resp.status_code == 429:
                    logger.warning("Reddit JSON rate-limited (attempt %d/3)", attempt + 1)
                    time.sleep(3)
                    continue
                resp.raise_for_status()
                data = resp.json()
                posts = []
                for child in data.get("data", {}).get("children", []):
                    d = child.get("data", {})
                    posts.append({
                        "source_platform": "reddit",
                        "source_post_id": d.get("id", ""),
                        "title": d.get("title", ""),
                        "body": d.get("selftext", ""),
                        "author": d.get("author", "[deleted]"),
                        "url": f"https://reddit.com{d.get('permalink', '')}",
                        "subreddit": d.get("subreddit", ""),
                        "score": d.get("score", 0),
                        "comment_count": d.get("num_comments", 0),
                        "created_utc": datetime.fromtimestamp(d.get("created_utc", 0), tz=timezone.utc).isoformat(),
                        "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
                    })
                logger.info("Reddit JSON returned %d posts for '%s'", len(posts), query)
                return posts
            except Exception as e:
                logger.warning("Reddit JSON search error (attempt %d/3): %s", attempt + 1, e)
                if attempt < 2:
                    time.sleep(2)
        return []

    def _fetch_comments_json(self, post_id: str, limit: int) -> list[dict]:
        url = f"https://www.reddit.com/comments/{post_id}.json"
        for attempt in range(3):
            try:
                resp = httpx.get(url, headers={"User-Agent": _USER_AGENT}, timeout=15)
                if resp.status_code == 429:
                    time.sleep(3)
                    continue
                resp.raise_for_status()
                data = resp.json()
                comments = []
                if len(data) > 1:
                    for child in data[1].get("data", {}).get("children", [])[:limit]:
                        if child.get("kind") != "t1":
                            continue
                        d = child.get("data", {})
                        comments.append({
                            "source_platform": "reddit",
                            "source_comment_id": d.get("id", ""),
                            "post_source_id": post_id,
                            "author": d.get("author", "[deleted]"),
                            "body": d.get("body", ""),
                            "score": d.get("score", 0),
                            "depth": 0,
                            "created_utc": datetime.fromtimestamp(d.get("created_utc", 0), tz=timezone.utc).isoformat(),
                            "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
                        })
                return comments
            except Exception as e:
                logger.warning("Reddit JSON comments error (attempt %d/3): %s", attempt + 1, e)
                if attempt < 2:
                    time.sleep(2)
        return []


def _praw_post_to_dict(s) -> dict:
    return {
        "source_platform": "reddit",
        "source_post_id": s.id,
        "title": s.title,
        "body": s.selftext or "",
        "author": str(s.author) if s.author else "[deleted]",
        "url": f"https://reddit.com{s.permalink}",
        "subreddit": str(s.subreddit),
        "score": s.score,
        "comment_count": s.num_comments,
        "created_utc": datetime.fromtimestamp(s.created_utc, tz=timezone.utc).isoformat(),
        "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
    }


def _praw_comment_to_dict(comment, post_id: str) -> dict:
    return {
        "source_platform": "reddit",
        "source_comment_id": comment.id,
        "post_source_id": post_id,
        "author": str(comment.author) if comment.author else "[deleted]",
        "body": comment.body,
        "score": comment.score,
        "depth": 0,
        "created_utc": datetime.fromtimestamp(comment.created_utc, tz=timezone.utc).isoformat(),
        "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
    }


def _time_filter(window_days: int) -> str:
    if window_days <= 1:
        return "day"
    if window_days <= 7:
        return "week"
    if window_days <= 30:
        return "month"
    return "year"

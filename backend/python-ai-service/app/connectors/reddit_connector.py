import logging
import os
import time
from datetime import datetime, timezone

import praw
import prawcore.exceptions

from app.connectors.base_connector import BaseConnector

logger = logging.getLogger(__name__)


class RedditConnector(BaseConnector):

    def __init__(self):
        try:
            self.reddit = praw.Reddit(
                client_id=os.getenv("REDDIT_CLIENT_ID", ""),
                client_secret=os.getenv("REDDIT_CLIENT_SECRET", ""),
                user_agent=os.getenv("REDDIT_USER_AGENT", "SignalFoundry/0.1"),
            )
        except Exception as e:
            logger.error("Failed to initialise Reddit client: %s", e)
            self.reddit = None

    def search_posts(self, query: str, window_days: int = 7, limit: int = 25) -> list[dict]:
        if self.reddit is None:
            logger.warning("Reddit client not initialised — returning []")
            return []

        results: list[dict] = []
        for attempt in range(3):
            try:
                submissions = self.reddit.subreddit("all").search(
                    query, sort="relevance", time_filter=_time_filter(window_days), limit=limit
                )
                for s in submissions:
                    results.append({
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
                    })
                return results
            except prawcore.exceptions.RequestException as e:
                logger.warning("Reddit request error (attempt %d/3): %s", attempt + 1, e)
                if attempt < 2:
                    time.sleep(2)
            except Exception as e:
                logger.error("Reddit connector error: %s", e)
                return []
        return results

    def fetch_comments(self, post_id: str, limit: int = 50) -> list[dict]:
        if self.reddit is None:
            return []

        results: list[dict] = []
        for attempt in range(3):
            try:
                submission = self.reddit.submission(id=post_id)
                submission.comments.replace_more(limit=0)
                for comment in submission.comments[:limit]:
                    results.append({
                        "source_platform": "reddit",
                        "source_comment_id": comment.id,
                        "post_source_id": post_id,
                        "author": str(comment.author) if comment.author else "[deleted]",
                        "body": comment.body,
                        "score": comment.score,
                        "depth": 0,
                        "created_utc": datetime.fromtimestamp(comment.created_utc, tz=timezone.utc).isoformat(),
                        "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
                    })
                return results
            except prawcore.exceptions.RequestException as e:
                logger.warning("Reddit comments error (attempt %d/3): %s", attempt + 1, e)
                if attempt < 2:
                    time.sleep(2)
            except Exception as e:
                logger.error("Reddit comments error: %s", e)
                return []
        return results


def _time_filter(window_days: int) -> str:
    if window_days <= 1:
        return "day"
    if window_days <= 7:
        return "week"
    if window_days <= 30:
        return "month"
    return "year"

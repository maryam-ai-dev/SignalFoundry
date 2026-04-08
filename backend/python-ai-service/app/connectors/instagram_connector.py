"""Instagram connector — uses instaloader to scrape public hashtags and profiles.

Grey area: ToS prohibits scraping. For personal/research use only.
Requires login for hashtag search. Use a dedicated throwaway account.
Rate limits are strict — do not run more than 1-2 scans per hour.
Returns [] on any failure.
"""

import logging
import os
from datetime import datetime, timedelta, timezone

from app.connectors.base_connector import BaseConnector

logger = logging.getLogger(__name__)

_IG_USER = os.getenv("INSTAGRAM_USERNAME", "")
_IG_PASS = os.getenv("INSTAGRAM_PASSWORD", "")


class InstagramConnector(BaseConnector):

    def __init__(self):
        self.loader = None
        try:
            import instaloader
            self.loader = instaloader.Instaloader(
                download_pictures=False,
                download_videos=False,
                download_video_thumbnails=False,
                download_geotags=False,
                download_comments=False,
                save_metadata=False,
                compress_json=False,
                quiet=True,
            )
            if _IG_USER and _IG_PASS:
                self.loader.login(_IG_USER, _IG_PASS)
                logger.info("Instagram: logged in as %s", _IG_USER)
            else:
                logger.warning("Instagram: no credentials — hashtag search requires login")
        except Exception as e:
            logger.warning("Instagram init error: %s", e)

    def search_posts(self, query: str, window_days: int = 7, limit: int = 25) -> list[dict]:
        if self.loader is None:
            return []

        try:
            import instaloader
            hashtag = query.lstrip("#").strip()
            if not hashtag:
                return []

            cutoff = datetime.now(tz=timezone.utc) - timedelta(days=window_days)
            results = []

            ht = instaloader.Hashtag.from_name(self.loader.context, hashtag)
            for post in ht.get_posts():
                post_date = post.date_utc.replace(tzinfo=timezone.utc) if post.date_utc.tzinfo is None else post.date_utc
                if post_date < cutoff:
                    break
                results.append({
                    "source_platform": "instagram",
                    "source_post_id": post.shortcode,
                    "title": "",
                    "body": post.caption or "",
                    "author": post.owner_username or "",
                    "url": f"https://instagram.com/p/{post.shortcode}/",
                    "subreddit": "",
                    "score": post.likes or 0,
                    "comment_count": post.comments or 0,
                    "created_utc": post_date.isoformat(),
                    "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
                })
                if len(results) >= limit:
                    break

            logger.info("Instagram returned %d posts for #%s", len(results), hashtag)
            return results

        except Exception as e:
            logger.warning("Instagram search error: %s", e)
            return []

    def fetch_comments(self, shortcode: str, limit: int = 50) -> list[dict]:
        if self.loader is None:
            return []

        try:
            import instaloader
            post = instaloader.Post.from_shortcode(self.loader.context, shortcode)
            results = []
            for comment in post.get_comments():
                results.append({
                    "source_platform": "instagram",
                    "source_comment_id": str(comment.id),
                    "post_source_id": shortcode,
                    "author": comment.owner.username if comment.owner else "",
                    "body": comment.text or "",
                    "score": comment.likes_count or 0,
                    "depth": 0,
                    "created_utc": comment.created_at_utc.isoformat() if comment.created_at_utc else datetime.now(tz=timezone.utc).isoformat(),
                    "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
                })
                if len(results) >= limit:
                    break
            return results
        except Exception as e:
            logger.warning("Instagram comments error: %s", e)
            return []

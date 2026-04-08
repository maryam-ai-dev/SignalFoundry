"""X (Twitter) connector — Playwright scraper with Nitter RSS fallback.

Grey area: Playwright scrapes x.com search pages. Personal/research use only.
Nitter fallback is safer but instances may be unreliable.
Both paths return [] on any failure — never crash the scan.
"""

import logging
import os
import random
import time
from datetime import datetime, timezone

import feedparser
import httpx

from app.connectors.base_connector import BaseConnector

logger = logging.getLogger(__name__)

_X_CONNECTOR_MODE = os.getenv("X_CONNECTOR_MODE", "nitter")  # playwright | nitter

_NITTER_INSTANCES = [
    "https://nitter.privacydev.net",
    "https://nitter.poast.org",
    "https://nitter.net",
]


class XConnector(BaseConnector):

    def search_posts(self, query: str, window_days: int = 3, limit: int = 25) -> list[dict]:
        if _X_CONNECTOR_MODE == "playwright":
            results = self._search_playwright(query, limit)
            if results:
                return results

        # Fallback: Nitter RSS
        return self._search_nitter(query, limit)

    def fetch_comments(self, post_id: str, limit: int = 50) -> list[dict]:
        # Comments not reliably available via scraping
        return []

    # ── Playwright ──

    def _search_playwright(self, query: str, limit: int) -> list[dict]:
        try:
            from playwright.sync_api import sync_playwright

            results = []
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                page.set_extra_http_headers({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})

                url = f"https://x.com/search?q={query}&src=typed_query&f=live"
                page.goto(url, timeout=15000)
                time.sleep(2 + random.random() * 2)

                # Scroll to load more tweets
                for _ in range(3):
                    page.evaluate("window.scrollBy(0, 1000)")
                    time.sleep(1 + random.random())

                # Extract tweets from article elements
                articles = page.query_selector_all("article[data-testid='tweet']")
                for article in articles[:limit]:
                    try:
                        text_el = article.query_selector("div[data-testid='tweetText']")
                        text = text_el.inner_text() if text_el else ""
                        user_el = article.query_selector("div[dir='ltr'] > span")
                        author = user_el.inner_text() if user_el else ""

                        results.append({
                            "source_platform": "x",
                            "source_post_id": f"x-{hash(text)%10**8}",
                            "title": "",
                            "body": text,
                            "author": author,
                            "url": "",
                            "subreddit": "",
                            "score": 0,
                            "comment_count": 0,
                            "created_utc": datetime.now(tz=timezone.utc).isoformat(),
                            "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
                        })
                    except Exception:
                        continue

                browser.close()

            logger.info("X Playwright returned %d posts for '%s'", len(results), query)
            return results
        except Exception as e:
            logger.warning("X Playwright error: %s", e)
            return []

    # ── Nitter RSS fallback ──

    def _search_nitter(self, query: str, limit: int) -> list[dict]:
        for instance in _NITTER_INSTANCES:
            try:
                url = f"{instance}/search/rss?q={query}"
                resp = httpx.get(url, timeout=10, follow_redirects=True)
                if resp.status_code != 200:
                    continue

                feed = feedparser.parse(resp.text)
                if not feed.entries:
                    continue

                results = []
                for entry in feed.entries[:limit]:
                    results.append({
                        "source_platform": "x",
                        "source_post_id": entry.get("id", entry.get("link", "")),
                        "title": "",
                        "body": entry.get("title", "") or entry.get("summary", ""),
                        "author": entry.get("author", ""),
                        "url": entry.get("link", ""),
                        "subreddit": "",
                        "score": 0,
                        "comment_count": 0,
                        "created_utc": datetime.now(tz=timezone.utc).isoformat(),
                        "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
                    })

                if results:
                    logger.info("Nitter (%s) returned %d posts for '%s'", instance, len(results), query)
                    return results
            except Exception as e:
                logger.warning("Nitter %s error: %s", instance, e)
                continue

        return []

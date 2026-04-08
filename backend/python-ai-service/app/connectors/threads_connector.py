"""Threads connector — scrapes public search via Playwright.

No login required. Uses headless Chromium to render client-side content.
Returns [] on any failure.
"""

import logging
import re
import time
from datetime import datetime, timezone

from app.connectors.base_connector import BaseConnector

logger = logging.getLogger(__name__)


class ThreadsConnector(BaseConnector):

    def search_posts(self, query: str, window_days: int = 7, limit: int = 25) -> list[dict]:
        try:
            from playwright.sync_api import sync_playwright

            results = []
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                page.set_extra_http_headers({
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                })

                url = f"https://www.threads.net/search?q={query}&serp_type=default"
                page.goto(url, timeout=20000, wait_until="domcontentloaded")
                time.sleep(6)

                # Scroll to load more
                for _ in range(3):
                    page.evaluate("window.scrollBy(0, 800)")
                    time.sleep(2)

                # Extract posts via JS
                raw_posts = page.evaluate("""() => {
                    const containers = document.querySelectorAll('[data-pressable-container]');
                    const posts = [];
                    for (const c of containers) {
                        const text = c.textContent?.trim() || '';
                        if (text.length < 20) continue;

                        // Try to extract username (usually first part before date)
                        const parts = text.split(/\\d{2}\\/\\d{2}\\/\\d{2}/);
                        const author = parts[0]?.replace('Verified', '').trim() || '';

                        // Find links
                        const links = c.querySelectorAll('a[href*="/post/"]');
                        const postUrl = links.length > 0 ? links[0].href : '';
                        const postId = postUrl.split('/post/')[1]?.split('?')[0] || '';

                        // Get the actual content (after the metadata)
                        const contentMatch = text.match(/More(.+?)(?:Like|Reply|Repost|Share|\\d+ replies)/s);
                        const content = contentMatch ? contentMatch[1].trim() : text.slice(author.length).trim();

                        posts.push({
                            author: author,
                            text: content.slice(0, 500),
                            url: postUrl,
                            postId: postId || String(Math.random()).slice(2, 10)
                        });
                    }
                    return posts;
                }""")

                for rp in raw_posts[:limit]:
                    if not rp.get("text"):
                        continue
                    results.append({
                        "source_platform": "threads",
                        "source_post_id": rp.get("postId", ""),
                        "title": "",
                        "body": rp.get("text", ""),
                        "author": rp.get("author", ""),
                        "url": rp.get("url", ""),
                        "subreddit": "",
                        "score": 0,
                        "comment_count": 0,
                        "created_utc": datetime.now(tz=timezone.utc).isoformat(),
                        "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
                    })

                browser.close()

            logger.info("Threads returned %d posts for '%s'", len(results), query)
            return results

        except Exception as e:
            logger.warning("Threads search error: %s", e)
            return []

    def fetch_comments(self, post_id: str, limit: int = 50) -> list[dict]:
        """Fetch replies from a Threads post page. post_id should be the post URL."""
        if not post_id:
            return []

        try:
            from playwright.sync_api import sync_playwright

            # post_id might be a URL or a shortcode
            url = post_id if post_id.startswith("http") else f"https://www.threads.net/post/{post_id}"

            results = []
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                page.set_extra_http_headers({
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                })
                page.goto(url, timeout=15000, wait_until="domcontentloaded")
                time.sleep(6)
                page.evaluate("window.scrollBy(0, 1500)")
                time.sleep(3)

                raw_replies = page.evaluate("""() => {
                    const containers = document.querySelectorAll('[data-pressable-container]');
                    // Skip first (original post), take rest as replies
                    return Array.from(containers).slice(1).map(c => {
                        const text = c.textContent || '';
                        const match = text.match(/^(\\w+?)(?:Verified)?\\d/);
                        const author = match ? match[1] : '';
                        const contentMatch = text.match(/More(.+?)(?:Like|Reply|Repost|Share|$)/s);
                        const content = contentMatch ? contentMatch[1].trim() : '';
                        return { author, content: content.slice(0, 500) };
                    });
                }""")

                for i, r in enumerate(raw_replies[:limit]):
                    if not r.get("content"):
                        continue
                    results.append({
                        "source_platform": "threads",
                        "source_comment_id": f"reply-{post_id}-{i}",
                        "post_source_id": post_id,
                        "author": r.get("author", ""),
                        "body": r.get("content", ""),
                        "score": 0,
                        "depth": 0,
                        "created_utc": datetime.now(tz=timezone.utc).isoformat(),
                        "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
                    })

                browser.close()

            logger.info("Threads returned %d replies for post %s", len(results), post_id[:50])
            return results

        except Exception as e:
            logger.warning("Threads comments error: %s", e)
            return []

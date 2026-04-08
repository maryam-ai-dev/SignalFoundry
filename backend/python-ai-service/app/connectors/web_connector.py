import hashlib
import logging
from datetime import datetime, timezone
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser

import trafilatura

from app.connectors.base_connector import BaseConnector

logger = logging.getLogger(__name__)

_USER_AGENT = "SignalFoundry/0.1"


class WebConnector(BaseConnector):

    def fetch_page(self, url: str) -> dict | None:
        # Check robots.txt
        if not _robots_allowed(url):
            logger.info("robots.txt disallows %s", url)
            return None

        try:
            downloaded = trafilatura.fetch_url(url)
            if not downloaded:
                logger.warning("Failed to download %s", url)
                return None

            text = trafilatura.extract(downloaded, include_comments=False, include_tables=False)
            if not text:
                logger.warning("Failed to extract text from %s", url)
                return None

            title = trafilatura.extract(downloaded, output_format="xml")
            # Extract title from metadata if available
            metadata = trafilatura.extract(downloaded, output_format="json", include_comments=False)
            page_title = ""
            if metadata:
                import json
                try:
                    meta = json.loads(metadata)
                    page_title = meta.get("title", "")
                except Exception:
                    pass

            return {
                "url": url,
                "title": page_title,
                "text": text,
                "word_count": len(text.split()),
            }
        except Exception as e:
            logger.warning("Web fetch error for %s: %s", url, e)
            return None

    def search_posts(self, query: str, window_days: int = 7, limit: int = 25) -> list[dict]:
        # Web connector doesn't support search — use fetch_page with known URLs
        return []

    def fetch_comments(self, post_id: str, limit: int = 50) -> list[dict]:
        return []


def _robots_allowed(url: str) -> bool:
    try:
        parsed = urlparse(url)
        robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
        rp = RobotFileParser()
        rp.set_url(robots_url)
        rp.read()
        return rp.can_fetch(_USER_AGENT, url)
    except Exception:
        # If we can't read robots.txt, allow (be permissive for personal use)
        return True

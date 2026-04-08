import logging
import os
from datetime import datetime, timezone

import httpx

from app.connectors.base_connector import BaseConnector

logger = logging.getLogger(__name__)

_PH_API_URL = "https://api.producthunt.com/v2/api/graphql"
_PH_TOKEN = os.getenv("PRODUCT_HUNT_API_TOKEN", "")


class ProductHuntConnector(BaseConnector):

    def search_posts(self, query: str, window_days: int = 30, limit: int = 25) -> list[dict]:
        if _PH_TOKEN:
            return self._search_graphql(query, limit)

        # Fallback: scrape public Product Hunt search
        return self._search_public(query, limit)

    def fetch_comments(self, post_id: str, limit: int = 50) -> list[dict]:
        if _PH_TOKEN:
            return self._fetch_comments_graphql(post_id, limit)
        return []

    # ── Official GraphQL API ──

    def _search_graphql(self, query: str, limit: int) -> list[dict]:
        gql = """
        query($query: String!, $first: Int!) {
          posts(first: $first, order: NEWEST, topic: $query) {
            edges {
              node {
                id
                name
                tagline
                description
                url
                votesCount
                commentsCount
                createdAt
                user { name }
              }
            }
          }
        }
        """
        try:
            resp = httpx.post(
                _PH_API_URL,
                headers={
                    "Authorization": f"Bearer {_PH_TOKEN}",
                    "Content-Type": "application/json",
                },
                json={"query": gql, "variables": {"query": query, "first": min(limit, 20)}},
                timeout=15,
            )
            if resp.status_code != 200:
                logger.warning("Product Hunt API error: %s", resp.status_code)
                return self._search_public(query, limit)

            data = resp.json()
            posts = []
            for edge in data.get("data", {}).get("posts", {}).get("edges", []):
                node = edge.get("node", {})
                posts.append(_node_to_dict(node))
            logger.info("Product Hunt API returned %d posts for '%s'", len(posts), query)
            return posts
        except Exception as e:
            logger.warning("Product Hunt API error: %s", e)
            return self._search_public(query, limit)

    def _fetch_comments_graphql(self, post_id: str, limit: int) -> list[dict]:
        gql = """
        query($id: ID!) {
          post(id: $id) {
            comments(first: 50) {
              edges {
                node {
                  id
                  body
                  createdAt
                  user { name }
                }
              }
            }
          }
        }
        """
        try:
            resp = httpx.post(
                _PH_API_URL,
                headers={
                    "Authorization": f"Bearer {_PH_TOKEN}",
                    "Content-Type": "application/json",
                },
                json={"query": gql, "variables": {"id": post_id}},
                timeout=15,
            )
            if resp.status_code != 200:
                return []

            data = resp.json()
            results = []
            for edge in data.get("data", {}).get("post", {}).get("comments", {}).get("edges", []):
                node = edge.get("node", {})
                results.append({
                    "source_platform": "product_hunt",
                    "source_comment_id": node.get("id", ""),
                    "post_source_id": post_id,
                    "author": node.get("user", {}).get("name", ""),
                    "body": node.get("body", ""),
                    "score": 0,
                    "depth": 0,
                    "created_utc": node.get("createdAt", datetime.now(tz=timezone.utc).isoformat()),
                    "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
                })
            return results[:limit]
        except Exception as e:
            logger.warning("Product Hunt comments error: %s", e)
            return []

    # ── Public fallback (no token) ──

    def _search_public(self, query: str, limit: int) -> list[dict]:
        try:
            resp = httpx.get(
                "https://www.producthunt.com/search",
                params={"q": query},
                headers={"User-Agent": "SignalFoundry/0.1"},
                follow_redirects=True,
                timeout=15,
            )
            if resp.status_code != 200:
                return []

            # Parse basic data from the page — Product Hunt embeds JSON-LD
            import json
            import re
            scripts = re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', resp.text, re.DOTALL)
            results = []
            for script in scripts:
                try:
                    data = json.loads(script)
                    items = data if isinstance(data, list) else [data]
                    for item in items:
                        if item.get("@type") in ("Product", "SoftwareApplication"):
                            results.append({
                                "source_platform": "product_hunt",
                                "source_post_id": item.get("url", ""),
                                "title": item.get("name", ""),
                                "body": item.get("description", ""),
                                "author": "",
                                "url": item.get("url", ""),
                                "subreddit": "",
                                "score": 0,
                                "comment_count": 0,
                                "created_utc": datetime.now(tz=timezone.utc).isoformat(),
                                "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
                            })
                except json.JSONDecodeError:
                    continue

            if results:
                logger.info("Product Hunt public returned %d posts for '%s'", len(results), query)
            return results[:limit]
        except Exception as e:
            logger.warning("Product Hunt public search error: %s", e)
            return []


def _node_to_dict(node: dict) -> dict:
    return {
        "source_platform": "product_hunt",
        "source_post_id": node.get("id", ""),
        "title": node.get("name", ""),
        "body": f"{node.get('tagline', '')}. {node.get('description', '')}",
        "author": node.get("user", {}).get("name", ""),
        "url": node.get("url", ""),
        "subreddit": "",
        "score": node.get("votesCount", 0),
        "comment_count": node.get("commentsCount", 0),
        "created_utc": node.get("createdAt", datetime.now(tz=timezone.utc).isoformat()),
        "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
    }

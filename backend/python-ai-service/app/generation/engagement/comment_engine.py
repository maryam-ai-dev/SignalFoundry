import json
import logging
import math

from app.shared.embeddings import embed_text
from app.shared.llm import complete

logger = logging.getLogger(__name__)

_GENERIC_FLAGS = ["great post", "love this", "so true", "amazing", "awesome post", "well said"]

_SYSTEM_PROMPT = (
    "You are a comment strategist for a founder who wants to engage authentically on social media. "
    "Given a post and its existing comments, generate exactly 3 comment drafts with distinct strategies. "
    "Strategy types: INSIGHTFUL (add a unique perspective or data point), "
    "EMPATHETIC (connect emotionally with the author's experience), "
    "FOUNDER_PERSPECTIVE (share relevant experience from building the product). "
    "Return ONLY a valid JSON array: "
    '[{"text": str, "strategy_type": str}]. '
    "Each comment must be 50-280 characters. Never use generic phrases like 'great post', 'love this', 'amazing'. "
    "FOUNDER_PERSPECTIVE must reference the product context naturally — no hard sell."
)


def generate_comments(
    post_context: dict,
    workspace_context: dict,
    goal_context: dict | None = None,
) -> list[dict]:
    post_text = post_context.get("post_text", "")
    top_comments = post_context.get("top_comments", [])
    platform = post_context.get("platform", "reddit")

    comments_block = ""
    if top_comments:
        comments_block = "Existing comments:\n" + "\n".join(f"- {c[:150]}" for c in top_comments[:5])

    product_block = ""
    if workspace_context:
        product_block = (
            f"Product: {workspace_context.get('productName', '')}\n"
            f"Description: {workspace_context.get('productDescription', '')}"
        )

    user_prompt = (
        f"Platform: {platform}\n"
        f"Post: {post_text[:500]}\n"
        f"{comments_block}\n"
        f"{product_block}"
    ).strip()

    response = complete(_SYSTEM_PROMPT, user_prompt, max_tokens=600)
    drafts = _parse_json_array(response)

    results = []
    for d in drafts[:3]:
        text = d.get("text", "")
        strategy = d.get("strategy_type", "INSIGHTFUL")

        # Generic check
        risk_flags = []
        text_lower = text.lower()
        for phrase in _GENERIC_FLAGS:
            if phrase in text_lower:
                risk_flags.append(f"contains generic phrase: '{phrase}'")

        results.append({
            "text": text,
            "strategy_type": strategy,
            "risk_flags": risk_flags,
            "duplicate_risk": 0.0,
        })

    return results


def _parse_json_array(text: str) -> list[dict]:
    if not text or text == "[unavailable]":
        return []
    try:
        data = json.loads(text)
        if isinstance(data, list):
            return data
        return []
    except json.JSONDecodeError:
        start = text.find("[")
        end = text.rfind("]")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(text[start : end + 1])
            except json.JSONDecodeError:
                pass
        logger.warning("Failed to parse comment generation response")
        return []

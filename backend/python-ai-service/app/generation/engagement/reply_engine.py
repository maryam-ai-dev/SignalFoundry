import json
import logging

from app.shared.llm import complete

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = (
    "You are a reply strategist for a founder engaging on social media. "
    "Given an incoming comment on a post, generate 2-3 reply drafts with distinct strategies. "
    "Strategy types: DEEPEN_CONVERSATION (must end with a question mark), "
    "ADDRESS_OBJECTION (acknowledge the concern without being defensive — only if the comment expresses skepticism), "
    "SHARE_PERSPECTIVE (offer a unique viewpoint from the founder's experience). "
    "Return ONLY a valid JSON array: "
    '[{"text": str, "strategy_type": str, "suggested_intent": str}]. '
    "suggested_intent: BUILD_TRUST, JOIN_DISCUSSION, or HANDLE_OBJECTION. "
    "Each reply must be max 150 characters. Be concise and genuine — no corporate speak."
)


def generate_replies(
    incoming_comment: str,
    post_context: dict,
    workspace_context: dict,
) -> list[dict]:
    if not incoming_comment or not incoming_comment.strip():
        return []

    post_text = post_context.get("post_text", "")
    product_block = ""
    if workspace_context:
        product_block = (
            f"Product: {workspace_context.get('productName', '')}\n"
            f"Description: {workspace_context.get('productDescription', '')}"
        )

    user_prompt = (
        f"Post context: {post_text[:300]}\n"
        f"Incoming comment: {incoming_comment[:300]}\n"
        f"{product_block}"
    ).strip()

    response = complete(_SYSTEM_PROMPT, user_prompt, max_tokens=500)
    drafts = _parse_json_array(response)

    results = []
    for d in drafts[:3]:
        text = d.get("text", "")
        if len(text) > 150:
            text = text[:147] + "..."
        results.append({
            "text": text,
            "strategy_type": d.get("strategy_type", "SHARE_PERSPECTIVE"),
            "suggested_intent": d.get("suggested_intent", "JOIN_DISCUSSION"),
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
        logger.warning("Failed to parse reply generation response")
        return []

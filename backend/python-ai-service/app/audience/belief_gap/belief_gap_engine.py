import json
import logging

from pydantic import BaseModel

from app.normalization.models import NormalizedComment
from app.shared.llm import complete

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = (
    "You are an audience intelligence analyst specializing in belief gap analysis. "
    "Given user comments from a niche community and a product context, identify gaps between "
    "what the audience currently believes and what they would need to believe to care about this product. "
    "Return a JSON array of objects: "
    '[{"current_belief": str, "required_belief": str, "gap_summary": str, "bridge_content_suggestion": str}]. '
    "Each bridge_content_suggestion should start with an action verb (Write, Create, Show, Demonstrate, etc.). "
    "Return 2-4 belief gaps. If none are apparent, return []."
)


class BeliefGap(BaseModel):
    current_belief: str
    required_belief: str
    gap_summary: str
    bridge_content_suggestion: str


def find_belief_gaps(
    comments: list[NormalizedComment],
    product_context: dict,
) -> list[BeliefGap]:
    if not comments:
        return []

    product_name = product_context.get("productName", "the product")
    product_desc = product_context.get("productDescription", "")
    key_themes = product_context.get("keyThemes", [])

    context_block = (
        f"Product: {product_name}\n"
        f"Description: {product_desc}\n"
        f"Key themes: {', '.join(key_themes) if key_themes else 'N/A'}"
    )

    comment_texts = "\n---\n".join(c.text[:200] for c in comments[:30])

    user_prompt = (
        f"PRODUCT CONTEXT:\n{context_block}\n\n"
        f"AUDIENCE COMMENTS:\n{comment_texts}"
    )

    response = complete(_SYSTEM_PROMPT, user_prompt, max_tokens=800)
    parsed = _parse_json_array(response)

    gaps: list[BeliefGap] = []
    for item in parsed:
        try:
            gaps.append(BeliefGap(
                current_belief=item.get("current_belief", ""),
                required_belief=item.get("required_belief", ""),
                gap_summary=item.get("gap_summary", ""),
                bridge_content_suggestion=item.get("bridge_content_suggestion", ""),
            ))
        except Exception:
            continue

    return gaps[:4]


def _parse_json_array(text: str) -> list[dict]:
    if not text or text == "[unavailable]":
        return []
    try:
        data = json.loads(text)
        if isinstance(data, list):
            return data
        if isinstance(data, dict) and any(isinstance(v, list) for v in data.values()):
            for v in data.values():
                if isinstance(v, list):
                    return v
        return []
    except json.JSONDecodeError:
        start = text.find("[")
        end = text.rfind("]")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(text[start : end + 1])
            except json.JSONDecodeError:
                pass
        logger.warning("Failed to parse belief gap LLM response")
        return []

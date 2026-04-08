import json
import logging
from collections import defaultdict

from pydantic import BaseModel

from app.normalization.models import NormalizedComment
from app.shared.llm import complete

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = (
    "You are an audience intelligence analyst. "
    "Given a batch of user comments, identify expressions of skepticism, doubt, or resistance "
    "to the topic being discussed. Look for pushback, disagreement, distrust, or cynicism. "
    "Return a JSON array: [{\"theme\": str, \"quote\": str}]. "
    "Each quote must be an exact substring from the input comments. "
    "Return at most 10 items per batch. If no objections are present, return []."
)


class ObjectionCluster(BaseModel):
    theme: str
    representative_quotes: list[str]
    frequency: int


def extract_objections(comments: list[NormalizedComment]) -> list[ObjectionCluster]:
    if not comments:
        return []

    raw_items: list[dict] = []

    for i in range(0, len(comments), 20):
        batch = comments[i : i + 20]
        text_block = "\n---\n".join(c.text[:300] for c in batch)
        response = complete(_SYSTEM_PROMPT, text_block, max_tokens=800)
        parsed = _parse_json_array(response)
        raw_items.extend(parsed)

    if not raw_items:
        return []

    grouped: defaultdict[str, list[dict]] = defaultdict(list)
    for item in raw_items:
        theme = item.get("theme", "").strip().lower()
        if theme:
            grouped[theme].append(item)

    clusters: list[ObjectionCluster] = []
    for theme, items in grouped.items():
        quotes = list({item.get("quote", "") for item in items if item.get("quote")})
        clusters.append(ObjectionCluster(
            theme=theme.title(),
            representative_quotes=quotes[:5],
            frequency=len(items),
        ))

    clusters.sort(key=lambda c: c.frequency, reverse=True)
    return clusters[:5]


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
        logger.warning("Failed to parse objection LLM response as JSON array")
        return []

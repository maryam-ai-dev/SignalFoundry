import json
import logging
from collections import defaultdict

from pydantic import BaseModel

from app.normalization.models import NormalizedComment
from app.shared.llm import complete

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = (
    "You are an audience intelligence analyst. "
    "Given a batch of user comments, identify recurring pain points — frustrations, "
    "unmet needs, or complaints. "
    "Return a JSON array: [{\"theme\": str, \"severity\": \"HIGH\"|\"MEDIUM\"|\"LOW\", \"quote\": str}]. "
    "Each quote must be an exact substring from the input comments. "
    "Return at most 10 items per batch."
)


class PainCluster(BaseModel):
    theme: str
    severity: str
    representative_quotes: list[str]
    frequency: int


def extract_pain_points(comments: list[NormalizedComment]) -> list[PainCluster]:
    if not comments:
        return []

    raw_items: list[dict] = []

    # Batch 50 comments per LLM call, max 3 batches (= max 3 LLM calls)
    sampled = comments[:150]
    for i in range(0, len(sampled), 50):
        batch = sampled[i : i + 50]
        text_block = "\n---\n".join(c.text[:200] for c in batch)
        response = complete(_SYSTEM_PROMPT, text_block, max_tokens=800)
        parsed = _parse_json_array(response)
        raw_items.extend(parsed)

    if not raw_items:
        return []

    # Group by theme (case-insensitive)
    grouped: defaultdict[str, list[dict]] = defaultdict(list)
    for item in raw_items:
        theme = item.get("theme", "").strip().lower()
        if theme:
            grouped[theme].append(item)

    # Build clusters, top 5 by frequency
    clusters: list[PainCluster] = []
    for theme, items in grouped.items():
        quotes = list({item.get("quote", "") for item in items if item.get("quote")})
        severity = _majority_severity(items)
        clusters.append(PainCluster(
            theme=theme.title(),
            severity=severity,
            representative_quotes=quotes[:5],
            frequency=len(items),
        ))

    clusters.sort(key=lambda c: c.frequency, reverse=True)
    return clusters[:5]


def _majority_severity(items: list[dict]) -> str:
    counts: defaultdict[str, int] = defaultdict(int)
    for item in items:
        sev = item.get("severity", "MEDIUM").upper()
        if sev in ("HIGH", "MEDIUM", "LOW"):
            counts[sev] += 1
    if not counts:
        return "MEDIUM"
    return max(counts, key=counts.get)  # type: ignore


def _parse_json_array(text: str) -> list[dict]:
    if not text or text == "[unavailable]":
        return []
    try:
        # Try direct parse
        data = json.loads(text)
        if isinstance(data, list):
            return data
        if isinstance(data, dict) and any(isinstance(v, list) for v in data.values()):
            for v in data.values():
                if isinstance(v, list):
                    return v
        return []
    except json.JSONDecodeError:
        # Try to extract JSON array from text
        start = text.find("[")
        end = text.rfind("]")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(text[start : end + 1])
            except json.JSONDecodeError:
                pass
        logger.warning("Failed to parse LLM response as JSON array")
        return []

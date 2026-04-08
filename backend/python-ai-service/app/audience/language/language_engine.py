import json
import logging

from pydantic import BaseModel

from app.normalization.models import NormalizedComment
from app.shared.llm import complete

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = (
    "You are a language pattern analyst. Given user comments from an online community, extract:\n"
    "1. top_phrases: the 10 most emotionally resonant multi-word phrases (not generic filler like "
    "'great post' or 'so true' — only phrases that reveal real sentiment or identity)\n"
    "2. emotional_words: 10 single words that carry the strongest emotional charge\n"
    "3. identity_signals: 5-8 phrases where users signal who they are or what group they belong to "
    "(e.g. 'as a founder', 'we marketers', 'in my experience as...')\n\n"
    'Return JSON: {"top_phrases": [...], "emotional_words": [...], "identity_signals": [...]}'
)


class LanguageMap(BaseModel):
    top_phrases: list[str]
    emotional_words: list[str]
    identity_signals: list[str]


def extract_language_patterns(comments: list[NormalizedComment]) -> LanguageMap:
    if not comments:
        return LanguageMap(top_phrases=[], emotional_words=[], identity_signals=[])

    text_block = "\n---\n".join(c.text[:300] for c in comments[:40])
    response = complete(_SYSTEM_PROMPT, text_block, max_tokens=600)
    parsed = _parse_json_object(response)

    return LanguageMap(
        top_phrases=_ensure_list(parsed.get("top_phrases", [])),
        emotional_words=_ensure_list(parsed.get("emotional_words", [])),
        identity_signals=_ensure_list(parsed.get("identity_signals", [])),
    )


def _ensure_list(val) -> list[str]:
    if isinstance(val, list):
        return [str(v) for v in val if v]
    return []


def _parse_json_object(text: str) -> dict:
    if not text or text == "[unavailable]":
        return {}
    try:
        data = json.loads(text)
        if isinstance(data, dict):
            return data
        return {}
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(text[start : end + 1])
            except json.JSONDecodeError:
                pass
        logger.warning("Failed to parse language LLM response")
        return {}

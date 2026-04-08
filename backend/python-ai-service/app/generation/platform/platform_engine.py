import logging

from app.shared.llm import complete

logger = logging.getLogger(__name__)

_PLATFORM_RULES = {
    "linkedin": (
        "Adapt for LinkedIn. 150-400 characters. Use paragraph format with multiple sentences. "
        "Professional but human tone. No hashtags. No emojis."
    ),
    "x": (
        "Adapt for X (Twitter). Maximum 280 characters. Punchy and concise. "
        "Rewrite completely if needed — never just truncate. One strong statement."
    ),
    "reddit": (
        "Adapt for Reddit. Conversational tone. No self-promotion, no 'I'm building', no product plugs. "
        "Write as a community member sharing a genuine observation or question."
    ),
}

_SYSTEM_PROMPT = (
    "You are a platform-specific content adapter. "
    "Rewrite the given idea for the target platform following the rules exactly. "
    "Return ONLY the adapted text — no quotes, no labels, no explanation."
)


def adapt_for_platform(idea: str, platform: str) -> dict:
    platform = platform.lower()
    rules = _PLATFORM_RULES.get(platform, _PLATFORM_RULES["linkedin"])

    user_prompt = f"Rules: {rules}\n\nIdea: {idea}"
    adapted = complete(_SYSTEM_PROMPT, user_prompt, max_tokens=300)

    if adapted == "[unavailable]":
        adapted = idea[:280] if platform == "x" else idea

    return {
        "platform": platform,
        "adapted_text": adapted.strip(),
        "character_count": len(adapted.strip()),
        "format_notes": rules.split(".")[0],
    }

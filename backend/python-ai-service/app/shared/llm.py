import logging
import os

from openai import OpenAI

logger = logging.getLogger(__name__)

_JSON_SUFFIX = " Return ONLY valid JSON when asked for JSON. No markdown fences. No preamble."

_client: OpenAI | None = None


def _get_client() -> OpenAI | None:
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            logger.warning("OPENAI_API_KEY not set — LLM calls will return [unavailable]")
            return None
        _client = OpenAI(api_key=api_key)
    return _client


def complete(system_prompt: str, user_prompt: str, max_tokens: int = 500) -> str:
    client = _get_client()
    if client is None:
        return "[unavailable]"

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt + _JSON_SUFFIX},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=max_tokens,
            temperature=0.7,
        )
        return response.choices[0].message.content or "[empty]"
    except Exception as e:
        logger.error("LLM call failed: %s", e)
        return "[unavailable]"

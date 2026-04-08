import json
import logging

from pydantic import BaseModel

from app.shared.llm import complete

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = (
    "You are a marketing strategist advising a founder. "
    "Given audience pain points, objections, narrative themes, and product context, "
    "write a strategic synthesis. "
    "Return ONLY valid JSON: "
    '{"summary": str, "key_themes": [str], "recommended_directions": [str]}. '
    "summary: 2-3 paragraphs of readable prose explaining what's happening in this niche. "
    "key_themes: 3-5 short phrases capturing the dominant themes. "
    "recommended_directions: exactly 3 actionable directions, each starting with a verb."
)


class SynthesisResult(BaseModel):
    summary: str
    key_themes: list[str]
    recommended_directions: list[str]


def synthesize(
    pain_clusters: list[dict] | None = None,
    objection_clusters: list[dict] | None = None,
    narrative_clusters: list[dict] | None = None,
    workspace_context: dict | None = None,
) -> SynthesisResult:
    parts = []

    if pain_clusters:
        parts.append("Pain points:\n" + "\n".join(
            f"- {p.get('theme', '')} ({p.get('severity', '')})" for p in pain_clusters[:5]
        ))
    if objection_clusters:
        parts.append("Objections:\n" + "\n".join(
            f"- {o.get('theme', '')}" for o in objection_clusters[:5]
        ))
    if narrative_clusters:
        parts.append("Narratives:\n" + "\n".join(
            f"- {n.get('summary', '')[:150]}" for n in narrative_clusters[:5]
        ))
    if workspace_context:
        parts.append(
            f"Product: {workspace_context.get('productName', '')}\n"
            f"Description: {workspace_context.get('productDescription', '')}\n"
            f"Themes: {', '.join(workspace_context.get('keyThemes', []))}"
        )

    user_prompt = "\n\n".join(parts) if parts else "General marketing niche analysis"

    response = complete(_SYSTEM_PROMPT, user_prompt, max_tokens=1000)
    parsed = _parse_json_object(response)

    return SynthesisResult(
        summary=parsed.get("summary", "[unavailable]"),
        key_themes=_ensure_list(parsed.get("key_themes", [])),
        recommended_directions=_ensure_list(parsed.get("recommended_directions", [])),
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
        logger.warning("Failed to parse synthesis response")
        return {}

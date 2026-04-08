import json
import logging

from app.shared.llm import complete

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = (
    "You are a hook copywriter for founder marketing. "
    "Given a topic, audience pain points, and narrative themes, generate 6-8 hooks. "
    "Each hook must be max 280 characters. "
    "Use at least 3 distinct hook_types from: PROBLEM_AWARE, CONTRARIAN, EMPATHY, CURIOSITY, FOUNDER_STORY, BELIEF_CHALLENGE. "
    "Return ONLY a valid JSON array: "
    '[{"text": str, "hook_type": str, "confidence": float, "source_basis": str}]. '
    "source_basis should explain which pain point or narrative inspired the hook. "
    "Be specific and provocative — no generic marketing speak."
)


def generate_hooks(
    topic: str,
    pain_clusters: list[dict] | None = None,
    narrative_clusters: list[dict] | None = None,
    goal_context: dict | None = None,
) -> list[dict]:
    pain_summary = ""
    if pain_clusters:
        pain_summary = "Pain points:\n" + "\n".join(
            f"- {p.get('theme', '')} ({p.get('severity', 'MEDIUM')})" for p in pain_clusters[:5]
        )

    narrative_summary = ""
    if narrative_clusters:
        narrative_summary = "Narratives:\n" + "\n".join(
            f"- {n.get('summary', '')[:150]}" for n in narrative_clusters[:5]
        )

    goal_line = ""
    if goal_context:
        goal_line = f"Goal: {goal_context.get('goal_type', 'AWARENESS')} targeting {goal_context.get('target_audience', 'general audience')}"

    user_prompt = f"Topic: {topic}\n{pain_summary}\n{narrative_summary}\n{goal_line}".strip()

    response = complete(_SYSTEM_PROMPT, user_prompt, max_tokens=1000)
    hooks = _parse_json_array(response)

    # Validate and clean
    valid = []
    for h in hooks:
        text = h.get("text", "")
        if not text or len(text) > 280:
            continue
        valid.append({
            "text": text,
            "hook_type": h.get("hook_type", "CURIOSITY"),
            "confidence": min(1.0, max(0.0, float(h.get("confidence", 0.5)))),
            "source_basis": h.get("source_basis", ""),
        })

    return valid[:8]


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
        logger.warning("Failed to parse hook generation response")
        return []

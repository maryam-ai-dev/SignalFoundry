import json
import logging

from app.shared.llm import complete

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = (
    "You are a content strategy architect for founder-led brands. "
    "Given a topic, audience signals (pain points, objections, belief gaps), and workspace context, "
    "generate exactly 5 content angles — one for each angle_type. "
    "Angle types: FOUNDER_STORY, EDUCATIONAL, CONTRARIAN, PRODUCT_BUILDING, USER_PSYCHOLOGY. "
    "Intent types: AWARENESS, TRUST, OBJECTION, CONVERSION, CURIOSITY. "
    "Return ONLY a valid JSON array: "
    '[{"title": str, "angle_type": str, "description": str, "example_opening_line": str, "intent_type": str, "confidence": float}]. '
    "example_opening_line must be a complete, usable sentence — no placeholders. "
    "CONTRARIAN must genuinely challenge a common assumption."
)


def generate_angles(
    topic: str,
    signals: dict | None = None,
    workspace_context: dict | None = None,
    goal_context: dict | None = None,
) -> list[dict]:
    signals = signals or {}
    workspace_context = workspace_context or {}

    signal_block = ""
    if signals.get("pain_clusters"):
        signal_block += "Pain points:\n" + "\n".join(
            f"- {p.get('theme', '')}" for p in signals["pain_clusters"][:5]
        ) + "\n"
    if signals.get("objection_clusters"):
        signal_block += "Objections:\n" + "\n".join(
            f"- {o.get('theme', '')}" for o in signals["objection_clusters"][:5]
        ) + "\n"
    if signals.get("belief_gaps"):
        signal_block += "Belief gaps:\n" + "\n".join(
            f"- Current: {bg.get('current_belief', '')[:100]} → Required: {bg.get('required_belief', '')[:100]}"
            for bg in signals["belief_gaps"][:3]
        ) + "\n"

    context_block = ""
    if workspace_context:
        context_block = (
            f"Product: {workspace_context.get('productName', '')}\n"
            f"Description: {workspace_context.get('productDescription', '')}\n"
            f"Themes: {', '.join(workspace_context.get('keyThemes', []))}"
        )

    goal_block = ""
    if goal_context:
        goal_block = f"Campaign goal: {goal_context.get('goal_type', '')} targeting {goal_context.get('target_audience', 'general')}"

    user_prompt = f"Topic: {topic}\n{signal_block}\n{context_block}\n{goal_block}".strip()

    response = complete(_SYSTEM_PROMPT, user_prompt, max_tokens=1200)
    angles = _parse_json_array(response)

    valid = []
    for a in angles:
        if not a.get("title") or not a.get("angle_type"):
            continue
        valid.append({
            "title": a["title"],
            "angle_type": a["angle_type"],
            "description": a.get("description", ""),
            "example_opening_line": a.get("example_opening_line", ""),
            "intent_type": a.get("intent_type", "AWARENESS"),
            "confidence": min(1.0, max(0.0, float(a.get("confidence", 0.5)))),
        })

    return valid[:5]


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
        logger.warning("Failed to parse angle generation response")
        return []

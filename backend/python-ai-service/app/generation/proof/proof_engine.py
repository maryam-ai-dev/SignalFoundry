import json
import logging

from pydantic import BaseModel

from app.shared.llm import complete

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = (
    "You are a proof extraction specialist. "
    "Extract ONLY concrete facts from the given text. Do not invent anything. "
    "If no concrete facts exist, return empty arrays. "
    "Return ONLY valid JSON: "
    '{"evidence_claims": [str], "proof_backed_post_ideas": [str], "trust_signals": [str]}. '
    "evidence_claims: specific, verifiable facts from the input. "
    "proof_backed_post_ideas: 2-3 content ideas that could use these facts as proof. "
    "trust_signals: phrases or data points that build credibility."
)


class ProofExtractionResult(BaseModel):
    evidence_claims: list[str]
    proof_backed_post_ideas: list[str]
    trust_signals: list[str]


def extract_proof(raw_input: str, workspace_context: dict | None = None) -> ProofExtractionResult:
    if not raw_input or not raw_input.strip():
        return ProofExtractionResult(evidence_claims=[], proof_backed_post_ideas=[], trust_signals=[])

    context_block = ""
    if workspace_context:
        context_block = f"\nProduct: {workspace_context.get('productName', '')}"

    user_prompt = f"Text to extract from:\n{raw_input[:1000]}{context_block}"

    response = complete(_SYSTEM_PROMPT, user_prompt, max_tokens=600)
    parsed = _parse_json_object(response)

    return ProofExtractionResult(
        evidence_claims=_ensure_list(parsed.get("evidence_claims", [])),
        proof_backed_post_ideas=_ensure_list(parsed.get("proof_backed_post_ideas", [])),
        trust_signals=_ensure_list(parsed.get("trust_signals", [])),
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
        logger.warning("Failed to parse proof extraction response")
        return {}

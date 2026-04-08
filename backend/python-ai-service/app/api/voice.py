from fastapi import APIRouter
from pydantic import BaseModel

from app.voice.confidence.confidence_engine import compute_confidence
from app.voice.matching.voice_matcher import compute_match
from app.voice.stylometry.feature_extraction.schema import FEATURE_ORDER
from app.voice.stylometry.feature_extractor import extract_features
from app.voice.stylometry.models import StyleFeatureVector

router = APIRouter()


class AnalyzeVoiceSampleRequest(BaseModel):
    workspace_id: str
    sample_type: str = "TEXT"
    content: str | None = None
    file_path: str | None = None


@router.post("/internal/voice/analyze-sample")
async def analyze_sample(body: AnalyzeVoiceSampleRequest):
    if body.sample_type != "TEXT" or not body.content:
        return {"error": True, "message": "Only TEXT samples supported"}

    text = body.content
    fv = extract_features(text)
    word_count = len(text.split())

    # Quality score: lexical diversity * 0.5 + sentence regularity * 0.5
    lex_div = fv.features.get("type_token_ratio", 0.0)
    sent_var = fv.features.get("sentence_length_std", 0.0)
    quality_score = round(lex_div * 0.5 + (1 - min(sent_var / 50, 1)) * 0.5, 3)

    is_sufficient = word_count >= 200

    return {
        "features": fv.features,
        "quality_score": quality_score,
        "is_sufficient": is_sufficient,
        "word_count": word_count,
    }


class VoiceMatchRequest(BaseModel):
    generated_text: str
    profile_vector: dict[str, float]
    profile_maturity: float = 0.5


@router.post("/internal/voice/match")
async def voice_match(body: VoiceMatchRequest):
    # Reconstruct StyleFeatureVector from dict
    profile = StyleFeatureVector.from_features(body.profile_vector, 0)

    result = compute_match(body.generated_text, profile)
    confidence = compute_confidence(result.match_score, body.profile_maturity)

    return {
        "match_score": result.match_score,
        "drift_detected": result.drift_detected,
        "weakest_features": result.weakest_features,
        "confidence": confidence,
    }

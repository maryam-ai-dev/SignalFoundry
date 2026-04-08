"""Voice matcher — computes similarity between generated text and a voice profile.

Uses SBERT embeddings for overall match score (semantic+style similarity),
and feature vector comparison for identifying the weakest style dimensions.
"""

import math

from pydantic import BaseModel

from app.voice.stylometry.feature_extraction.schema import FEATURE_ORDER
from app.voice.stylometry.feature_extractor import extract_features
from app.voice.stylometry.models import StyleFeatureVector


class VoiceMatchResult(BaseModel):
    match_score: float
    drift_detected: bool
    weakest_features: list[str]


def compute_match(
    generated_text: str,
    profile_vector: StyleFeatureVector,
) -> VoiceMatchResult:
    """Compare generated text against a voice profile.

    match_score uses SBERT cosine similarity against reference texts if provided,
    otherwise falls back to feature vector cosine similarity (normalized).
    weakest_features always uses feature vector comparison.
    """
    if not generated_text or not generated_text.strip():
        return VoiceMatchResult(match_score=0.0, drift_detected=True, weakest_features=[])

    gen_vector = extract_features(generated_text)

    # Style-focused match: mean absolute difference on tiers 0-4 (31 features)
    # converted to 0-1 similarity score
    score = _style_similarity(gen_vector, profile_vector)
    drift = score < 0.5
    weakest = _find_weakest_features(gen_vector, profile_vector)

    return VoiceMatchResult(
        match_score=round(score, 3),
        drift_detected=drift,
        weakest_features=weakest,
    )


# Style-discriminative features (tiers 0-4, 31 features — excludes trigrams/bigrams)
_STYLE_FEATURES = FEATURE_ORDER[:31]


def _style_similarity(a: StyleFeatureVector, b: StyleFeatureVector) -> float:
    """Similarity based on mean absolute difference across style features.
    Returns 0-1 where 1.0 = identical style.
    """
    diffs = []
    for f in _STYLE_FEATURES:
        av = a.features.get(f, 0.0)
        bv = b.features.get(f, 0.0)
        # Normalize difference relative to the feature's scale
        max_val = max(abs(av), abs(bv), 0.001)
        diffs.append(abs(av - bv) / max_val)

    if not diffs:
        return 0.0

    mean_diff = sum(diffs) / len(diffs)
    # Convert: 0 diff → 1.0 score, 1.0 diff → 0.0 score
    return max(0.0, min(1.0, 1.0 - mean_diff))


def _find_weakest_features(gen: StyleFeatureVector, profile: StyleFeatureVector) -> list[str]:
    """Top 3 features with largest absolute gap, excluding near-zero features."""
    gaps = []
    for f in FEATURE_ORDER:
        gv = gen.features.get(f, 0.0)
        pv = profile.features.get(f, 0.0)
        if abs(pv) < 0.001 and abs(gv) < 0.001:
            continue
        gaps.append((f, abs(gv - pv)))
    gaps.sort(key=lambda x: x[1], reverse=True)
    return [g[0] for g in gaps[:3]]


def _cosine_sim(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return max(0.0, min(1.0, dot / (norm_a * norm_b)))
